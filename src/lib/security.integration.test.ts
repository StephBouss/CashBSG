import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AI_MESSAGE_QUOTA, TRACKER_ENTRY_LIMIT, SAVINGS_ACCOUNT_LIMIT, PLAN_ORDER } from "@/lib/plan";

/**
 * Test d'isolation et d'escalade de privilèges (CORRECTIONS-IWADU-CASH.md,
 * chantier C1.7). Crée deux vrais comptes sur le projet Supabase LIÉ (pas de
 * staging disponible) et vérifie qu'un utilisateur ne peut ni accéder aux
 * données d'un autre, ni s'auto-promouvoir admin/payant, ni contourner le
 * gating d'historique par plan, ni appeler admin-dashboard sans être admin.
 *
 * Ne tourne jamais via `npm run test` (exclu de vite.config.ts) — uniquement
 * via `npm run test:security`, qui charge .env.test (SUPABASE_URL,
 * SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, jamais committé).
 */

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY manquants (voir .env.test).");
}

const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const userA = { email: `test-security-a-${stamp}@iwaducash-test.invalid`, password: `TestSecurity!A${stamp}` };
const userB = { email: `test-security-b-${stamp}@iwaducash-test.invalid`, password: `TestSecurity!B${stamp}` };

let clientA: SupabaseClient;
let clientB: SupabaseClient;
let idA: string;
let idB: string;
let categoryAId: string;
let savingsAccountAId: string;

const ISOLATION_TABLES = [
  "profiles",
  "incomes",
  "expenses",
  "expense_tracker",
  "goals",
  "savings_accounts",
  "savings_movements",
  "ai_messages",
  "notifications",
  "upgrade_requests",
  "client_errors",
] as const;

// Rempli pendant beforeAll ; it.each ne connaît que les NOMS de table au
// moment de la collecte (statiques ci-dessus), les ids sont lus au runtime
// une fois les fixtures posées.
const fixtureIds: Partial<Record<(typeof ISOLATION_TABLES)[number], string>> = {};

async function insertAsA(table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await admin.from(table).insert(row).select("id").single();
  if (error) throw new Error(`Setup ${table}: ${error.message}`);
  if ((ISOLATION_TABLES as readonly string[]).includes(table)) {
    fixtureIds[table as (typeof ISOLATION_TABLES)[number]] = data.id as string;
  }
  return data.id as string;
}

beforeAll(async () => {
  const { data: createdA, error: errA } = await admin.auth.admin.createUser({
    email: userA.email,
    password: userA.password,
    email_confirm: true,
  });
  if (errA || !createdA.user) throw new Error(`Création userA: ${errA?.message}`);
  idA = createdA.user.id;

  const { data: createdB, error: errB } = await admin.auth.admin.createUser({
    email: userB.email,
    password: userB.password,
    email_confirm: true,
  });
  if (errB || !createdB.user) throw new Error(`Création userB: ${errB?.message}`);
  idB = createdB.user.id;

  clientA = createClient(url, anonKey);
  clientB = createClient(url, anonKey);

  const { error: signInAErr } = await clientA.auth.signInWithPassword(userA);
  if (signInAErr) throw new Error(`Connexion userA: ${signInAErr.message}`);
  const { error: signInBErr } = await clientB.auth.signInWithPassword(userB);
  if (signInBErr) throw new Error(`Connexion userB: ${signInBErr.message}`);

  // S'assurer que A est bien en plan "free" (défaut du trigger handle_new_user).
  await admin.from("profiles").update({ plan: "free", plan_expires_at: null, is_admin: false }).eq("id", idA);
  // profiles n'est pas inséré via insertAsA (la ligne existe déjà via le
  // trigger de signup) : on référence directement l'id du compte pour le
  // test d'isolation générique ci-dessous.
  fixtureIds.profiles = idA;

  categoryAId = await insertAsA("categories", { user_id: idA, nom: "Test sécurité", type: "depense" });
  await insertAsA("incomes", { user_id: idA, nom: "Revenu test", montant: 100000, date: new Date().toISOString().slice(0, 10) });
  await insertAsA("expenses", {
    user_id: idA,
    nom: "Dépense test récente",
    montant: 5000,
    date_echeance: new Date().toISOString().slice(0, 10),
    statut: "a_venir",
  });

  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
  await insertAsA("expenses", {
    user_id: idA,
    nom: "Dépense test ancienne",
    montant: 7500,
    date_echeance: fourMonthsAgo.toISOString().slice(0, 10),
    statut: "paye",
  });

  await insertAsA("expense_tracker", { user_id: idA, nom: "Tracker test", category_id: categoryAId, montant: 1200 });
  await insertAsA("goals", { user_id: idA, label: "Objectif test", montant_cible: 500000 });

  savingsAccountAId = await insertAsA("savings_accounts", { user_id: idA, type: "epargne", nom: "Épargne test" });
  await insertAsA("savings_movements", { user_id: idA, account_id: savingsAccountAId, montant: 2000 });

  await insertAsA("ai_messages", { user_id: idA, role: "user", content: "Message test" });
  await insertAsA("notifications", {
    user_id: idA,
    type: "test",
    title: "Notification test",
    message: "Contenu test",
    dedupe_key: `test-${stamp}`,
  });
  await insertAsA("upgrade_requests", { user_id: idA, current_plan: "free", requested_plan: "essentiel" });
  await insertAsA("client_errors", { user_id: idA, message: "Erreur test" });
}, 30_000);

afterAll(async () => {
  try {
    if (idA) await admin.auth.admin.deleteUser(idA);
  } catch {
    // best-effort : voir nettoyage manuel de secours documenté dans le plan
  }
  try {
    if (idB) await admin.auth.admin.deleteUser(idB);
  } catch {
    // idem
  }
}, 30_000);

describe("Isolation entre comptes (B ne doit jamais accéder aux données de A)", () => {
  // P1.3 — vérifier qu'une ligne "existe encore" après une attaque ne prouve
  // pas qu'elle n'a pas été altérée : on capture un instantané complet avant
  // l'attaque et on vérifie une égalité stricte après, pas seulement une
  // présence. Une UPDATE qui réussirait partiellement (une seule colonne
  // modifiée par exemple) serait ainsi détectée, contrairement à un simple
  // `toBeTruthy()`.
  it.each(ISOLATION_TABLES)("B ne peut ni lire, ni modifier, ni supprimer la ligne de A dans %s", async (table) => {
      const id = fixtureIds[table];
      if (!id) throw new Error(`Fixture manquante pour ${table} (beforeAll a dû échouer).`);

      const { data: selectData } = await clientB.from(table).select("id").eq("id", id);
      expect(selectData ?? []).toHaveLength(0);

      const { data: beforeRow } = await admin.from(table).select("*").eq("id", id).single();
      expect(beforeRow).toBeTruthy();

      await clientB.from(table).update({ nom: "hacked", label: "hacked", title: "hacked" }).eq("id", id);
      const { data: afterUpdate } = await admin.from(table).select("*").eq("id", id).single();
      expect(afterUpdate).toEqual(beforeRow);

      await clientB.from(table).delete().eq("id", id);
      const { data: afterDelete } = await admin.from(table).select("*").eq("id", id).maybeSingle();
      expect(afterDelete).toEqual(beforeRow);
    }
  );
});

describe("C1.1 — A ne peut pas s'auto-promouvoir via profiles", () => {
  it("un update sur is_admin/plan/plan_expires_at par le propriétaire lui-même reste sans effet", async () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);

    await clientA
      .from("profiles")
      .update({ is_admin: true, plan: "pro", plan_expires_at: future.toISOString() })
      .eq("id", idA);

    const { data: profile } = await admin.from("profiles").select("is_admin, plan, plan_expires_at").eq("id", idA).single();

    expect(profile?.is_admin).toBe(false);
    expect(profile?.plan).toBe("free");
    expect(profile?.plan_expires_at).toBeNull();
  });

  it("le propriétaire peut toujours modifier son nom (champ non privilégié)", async () => {
    const { error } = await clientA.from("profiles").update({ nom: "Test A" }).eq("id", idA);
    expect(error).toBeNull();

    const { data: profile } = await admin.from("profiles").select("nom").eq("id", idA).single();
    expect(profile?.nom).toBe("Test A");
  });
});

// P1.2 — ce test contredisait 20260805093939_lock_devise_when_transactions_exist.sql
// (le trigger le plus récent bloque explicitement tout changement de devise
// dès qu'un revenu/dépense/mouvement d'épargne existe, pour éviter de
// réinterpréter silencieusement un historique de montants dans une autre
// devise). idA a des transactions depuis beforeAll ; idB n'en a aucune.
describe("C2.3 — la devise ne peut plus être changée une fois des transactions saisies", () => {
  it("B (aucune transaction) peut changer sa devise", async () => {
    const { error } = await clientB.from("profiles").update({ devise: "EUR" }).eq("id", idB);
    expect(error).toBeNull();

    const { data: profile } = await admin.from("profiles").select("devise").eq("id", idB).single();
    expect(profile?.devise).toBe("EUR");
  });

  it("A (transactions existantes) ne peut pas changer sa devise", async () => {
    const { error } = await clientA.from("profiles").update({ devise: "EUR" }).eq("id", idA);
    expect(error).toBeTruthy();

    const { data: profile } = await admin.from("profiles").select("devise").eq("id", idA).single();
    expect(profile?.devise).not.toBe("EUR");
  });
});

describe("C1.2 — un compte Free ne peut pas lire son historique ancien", () => {
  it("la dépense vieille de 4 mois n'est pas retournée à un compte free via l'API", async () => {
    const { data } = await clientA.from("expenses").select("id, nom").ilike("nom", "Dépense test ancienne%");
    expect(data ?? []).toHaveLength(0);
  });

  it("la dépense récente reste bien visible", async () => {
    const { data } = await clientA.from("expenses").select("id, nom").ilike("nom", "Dépense test récente%");
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

describe("C1.3 — l'expiration de plan est effective sans dépendre du cron", () => {
  it("has_paid_plan() renvoie false immédiatement pour un compte payant expiré", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    await admin.from("profiles").update({ plan: "pro", plan_expires_at: past.toISOString() }).eq("id", idA);

    const { data } = await clientA.rpc("has_paid_plan");
    expect(data).toBe(false);
  });

  it("downgrade_expired_plans() repasse le compte à free (exécuté en service_role, à travers le trigger C1.1)", async () => {
    const { error } = await admin.rpc("downgrade_expired_plans");
    expect(error).toBeNull();

    const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", idA).single();
    expect(profile?.plan).toBe("free");
    expect(profile?.plan_expires_at).toBeNull();
  });

  it("un compte authentifié normal ne peut pas appeler downgrade_expired_plans()", async () => {
    const { error } = await clientA.rpc("downgrade_expired_plans");
    expect(error).toBeTruthy();
  });
});

describe("C1.4 — limitation de débit", () => {
  it("un appelant non authentifié ne peut plus insérer dans client_errors", async () => {
    const anonClient = createClient(url, anonKey);
    const { error } = await anonClient.from("client_errors").insert({ message: "Erreur anonyme test" });
    expect(error).toBeTruthy();
  });

  it("au-delà de 20 client_errors en 5 minutes pour le même utilisateur, l'insertion est refusée proprement", async () => {
    let rejected = false;
    for (let i = 0; i < 25 && !rejected; i++) {
      const { error } = await clientA.from("client_errors").insert({ user_id: idA, message: `Erreur rafale ${i}` });
      if (error) rejected = true;
    }
    expect(rejected).toBe(true);
  });

  it("une deuxième demande de mise à niveau 'en_attente' pour le même utilisateur est refusée (contrainte unique)", async () => {
    const { error } = await clientA
      .from("upgrade_requests")
      .insert({ user_id: idA, current_plan: "free", requested_plan: "essentiel" });
    expect(error).toBeTruthy();
    expect((error as { code?: string } | null)?.code).toBe("23505");
  });
});

describe("C1.6 — client_errors : lecture réservée aux admins", () => {
  it("un compte non-admin ne peut pas lire ses propres client_errors", async () => {
    const { data } = await clientA.from("client_errors").select("id").eq("user_id", idA);
    expect(data ?? []).toHaveLength(0);
  });

  it("un compte admin peut lire les client_errors de tous les comptes", async () => {
    await admin.from("profiles").update({ is_admin: true }).eq("id", idB);
    try {
      const { data, error } = await clientB.from("client_errors").select("id").eq("user_id", idA);
      expect(error).toBeNull();
      expect((data ?? []).length).toBeGreaterThan(0);
    } finally {
      await admin.from("profiles").update({ is_admin: false }).eq("id", idB);
    }
  });

  it("purge_old_client_errors() supprime les lignes de plus de 30 jours", async () => {
    // idB plutôt que idA : idA a déjà atteint le plafond de 20/5min dans le
    // test C1.4 précédent (même trigger, pas d'exemption service_role).
    const { data: inserted } = await admin
      .from("client_errors")
      .insert({ user_id: idB, message: "Erreur ancienne" })
      .select("id")
      .single();

    await admin
      .from("client_errors")
      .update({ created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() })
      .eq("id", inserted!.id);

    const { error } = await admin.rpc("purge_old_client_errors");
    expect(error).toBeNull();

    const { data: afterPurge } = await admin.from("client_errors").select("id").eq("id", inserted!.id).maybeSingle();
    expect(afterPurge).toBeNull();
  });
});

describe("C1.5 — admin-dashboard refuse un appelant non-admin", () => {
  it("B (non-admin) reçoit un 403", async () => {
    const { error } = await clientB.functions.invoke("admin-dashboard");
    expect(error).toBeTruthy();
    const status = (error as { context?: { status?: number } } | null)?.context?.status;
    if (status !== undefined) {
      expect(status).toBe(403);
    }
  });
});

describe("P0.7 — quota IA non contournable", () => {
  it("A ne peut pas supprimer son propre message (empêche de réinitialiser le quota)", async () => {
    const id = fixtureIds.ai_messages;
    if (!id) throw new Error("Fixture ai_messages manquante.");

    await clientA.from("ai_messages").delete().eq("id", id);
    const { data } = await admin.from("ai_messages").select("id").eq("id", id).maybeSingle();
    expect(data).toBeTruthy();
  });

  it("A ne peut pas modifier le contenu de son propre message", async () => {
    const id = fixtureIds.ai_messages;
    if (!id) throw new Error("Fixture ai_messages manquante.");

    await clientA.from("ai_messages").update({ content: "hacked" }).eq("id", id);
    const { data } = await admin.from("ai_messages").select("content").eq("id", id).single();
    expect(data?.content).not.toBe("hacked");
  });

  it("un compte authentifié ne peut pas écrire directement dans ai_quota_usage", async () => {
    const period = new Date().toISOString().slice(0, 8) + "01";
    const { error } = await clientA.from("ai_quota_usage").insert({ user_id: idA, period_start: period, message_count: 0 });
    expect(error).toBeTruthy();
  });

  it("consume_ai_quota() refuse une fois la limite du plan atteinte", async () => {
    const period = new Date().toISOString().slice(0, 8) + "01";
    await admin.from("ai_quota_usage").upsert({ user_id: idA, period_start: period, message_count: 25 });

    const { error } = await clientA.rpc("consume_ai_quota");
    expect(error).toBeTruthy();
  });
});

describe("P0.9 — expiration stricte des plans (NULL n'est plus un accès à vie)", () => {
  it("has_paid_plan() renvoie false pour un plan payant sans plan_expires_at", async () => {
    await admin.from("profiles").update({ plan: "pro", plan_expires_at: null }).eq("id", idA);

    const { data } = await clientA.rpc("has_paid_plan");
    expect(data).toBe(false);
  });

  it("effective_plan() renvoie 'free' pour un plan payant sans plan_expires_at", async () => {
    const { data } = await clientA.rpc("effective_plan");
    expect(data).toBe("free");
  });

  afterAll(async () => {
    await admin.from("profiles").update({ plan: "free", plan_expires_at: null }).eq("id", idA);
  });
});

describe("P0.8 — vraie suppression de compte", () => {
  it("delete-account supprime réellement le compte et journalise l'action (service_role)", async () => {
    const stampC = Date.now();
    const userC = { email: `test-security-c-${stampC}@iwaducash-test.invalid`, password: `TestSecurity!C${stampC}` };

    const { data: createdC, error: errC } = await admin.auth.admin.createUser({
      email: userC.email,
      password: userC.password,
      email_confirm: true,
    });
    if (errC || !createdC.user) throw new Error(`Création userC: ${errC?.message}`);
    const idC = createdC.user.id;

    const clientC = createClient(url, anonKey);
    const { error: signInErr } = await clientC.auth.signInWithPassword(userC);
    if (signInErr) throw new Error(`Connexion userC: ${signInErr.message}`);

    const { error: wrongConfirmError } = await clientC.functions.invoke("delete-account", {
      body: { confirmEmail: "mauvais@email.invalid" },
    });
    expect(wrongConfirmError).toBeTruthy();

    const { data: stillExists } = await admin.auth.admin.getUserById(idC);
    expect(stillExists?.user).toBeTruthy();

    const { error: deleteError } = await clientC.functions.invoke("delete-account", {
      body: { confirmEmail: userC.email },
    });
    expect(deleteError).toBeNull();

    const { data: afterDelete, error: afterDeleteError } = await admin.auth.admin.getUserById(idC);
    expect(Boolean(afterDeleteError) || afterDelete?.user == null).toBe(true);

    const { data: auditRow } = await admin
      .from("account_deletions")
      .select("id, email")
      .eq("user_id", idC)
      .maybeSingle();
    expect(auditRow?.email).toBe(userC.email);
  }, 30_000);
});

describe("P1.3 — isolation cross-user sur les objectifs (goal_contributions)", () => {
  it("B ne peut pas contribuer à un objectif de A (IDOR sur contribute_to_goal)", async () => {
    const goalId = fixtureIds.goals;
    if (!goalId) throw new Error("Fixture goals manquante.");

    const { error } = await clientB.rpc("contribute_to_goal", { p_goal_id: goalId, p_amount: 1000, p_note: null });
    expect(error).toBeTruthy();

    const { data: goal } = await admin.from("goals").select("montant_epargne").eq("id", goalId).single();
    expect(Number(goal?.montant_epargne ?? 0)).toBe(0);
  });

  it("B ne peut pas lire les contributions de A", async () => {
    const goalId = fixtureIds.goals;
    if (!goalId) throw new Error("Fixture goals manquante.");

    await admin.from("goal_contributions").insert({ goal_id: goalId, user_id: idA, montant: 500, note: "seed" });

    const { data } = await clientB.from("goal_contributions").select("id").eq("goal_id", goalId);
    expect(data ?? []).toHaveLength(0);
  });
});

describe("P1.1 — le catalogue serveur (plan_catalog) reste synchronisé avec src/lib/plan.ts", () => {
  it("AI_MESSAGE_QUOTA/TRACKER_ENTRY_LIMIT/SAVINGS_ACCOUNT_LIMIT correspondent au catalogue", async () => {
    const { data: catalog, error } = await admin.from("plan_catalog").select("*");
    expect(error).toBeNull();
    expect(catalog?.length).toBe(4);

    for (const row of catalog ?? []) {
      const plan = row.plan as (typeof PLAN_ORDER)[number];
      expect(PLAN_ORDER).toContain(plan);
      expect(row.ai_quota).toBe(AI_MESSAGE_QUOTA[plan]);
      expect(row.tracker_limit).toBe(TRACKER_ENTRY_LIMIT[plan]);
      expect(row.savings_epargne_limit).toBe(SAVINGS_ACCOUNT_LIMIT[plan].epargne);
      expect(row.savings_investissement_limit).toBe(SAVINGS_ACCOUNT_LIMIT[plan].investissement);
    }
  });

  it("get_plan_catalog() est lisible par un utilisateur authentifié normal", async () => {
    const { data, error } = await clientA.rpc("get_plan_catalog");
    expect(error).toBeNull();
    expect((data ?? []).length).toBe(4);
  });
});

describe("P1.6 — génération réelle des revenus récurrents", () => {
  it("génère l'occurrence due, ne la double pas sur une deuxième exécution, et respecte l'arrêt de récurrence", async () => {
    const start = new Date();
    start.setMonth(start.getMonth() - 2); // il y a 2 mois : une occurrence "mensuel" est due

    const { data: root, error: rootError } = await admin
      .from("incomes")
      .insert({
        user_id: idA,
        nom: "Salaire test récurrent",
        montant: 300000,
        frequence: "mensuel",
        date: start.toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    if (rootError || !root) throw new Error(`Setup revenu récurrent: ${rootError?.message}`);

    const { error: genError } = await admin.rpc("generate_recurring_income_occurrences");
    expect(genError).toBeNull();

    const { data: afterFirstRun } = await admin
      .from("incomes")
      .select("id, date")
      .eq("recurrence_source_id", root.id);
    expect((afterFirstRun ?? []).length).toBeGreaterThanOrEqual(1);
    const countAfterFirstRun = (afterFirstRun ?? []).length;

    // Double exécution du job : ne doit produire aucun doublon (test obligatoire P1.6).
    const { error: genError2 } = await admin.rpc("generate_recurring_income_occurrences");
    expect(genError2).toBeNull();
    const { data: afterSecondRun } = await admin
      .from("incomes")
      .select("id")
      .eq("recurrence_source_id", root.id);
    expect((afterSecondRun ?? []).length).toBe(countAfterFirstRun);

    // Arrêt de la récurrence : plus aucune nouvelle occurrence générée.
    await admin.from("incomes").update({ recurrence_active: false }).eq("id", root.id);
    const olderStart = new Date();
    olderStart.setMonth(olderStart.getMonth() - 6);
    await admin.from("incomes").update({ date: olderStart.toISOString().slice(0, 10) }).eq("id", root.id);

    const { error: genError3 } = await admin.rpc("generate_recurring_income_occurrences");
    expect(genError3).toBeNull();
    const { data: afterStop } = await admin.from("incomes").select("id").eq("recurrence_source_id", root.id);
    expect((afterStop ?? []).length).toBe(countAfterFirstRun);
  });
});

describe("P1.7 — vrais rappels de factures (échéance proche / dépassée)", () => {
  it("génère une notification à J-3 et une à J+1 de retard, sans doublon sur double exécution", async () => {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: upcoming, error: upcomingError } = await admin
      .from("expenses")
      .insert({
        user_id: idA,
        nom: "Facture test à venir",
        montant: 15000,
        date_echeance: in3Days.toISOString().slice(0, 10),
        statut: "a_venir",
      })
      .select("id")
      .single();
    if (upcomingError || !upcoming) throw new Error(`Setup facture à venir: ${upcomingError?.message}`);

    const { data: overdue, error: overdueError } = await admin
      .from("expenses")
      .insert({
        user_id: idA,
        nom: "Facture test en retard",
        montant: 8000,
        date_echeance: yesterday.toISOString().slice(0, 10),
        statut: "a_venir",
      })
      .select("id")
      .single();
    if (overdueError || !overdue) throw new Error(`Setup facture en retard: ${overdueError?.message}`);

    const { error: genError } = await admin.rpc("generate_bill_reminders");
    expect(genError).toBeNull();
    const { error: genError2 } = await admin.rpc("generate_bill_reminders");
    expect(genError2).toBeNull();

    const { data: upcomingNotif } = await admin
      .from("notifications")
      .select("id")
      .eq("dedupe_key", `bill_upcoming_${upcoming.id}`);
    expect(upcomingNotif ?? []).toHaveLength(1);

    const { data: overdueNotif } = await admin
      .from("notifications")
      .select("id")
      .eq("dedupe_key", `bill_overdue_${overdue.id}`);
    expect(overdueNotif ?? []).toHaveLength(1);
  });
});
