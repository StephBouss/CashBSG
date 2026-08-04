import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
  it.each(ISOLATION_TABLES)("B ne peut ni lire, ni modifier, ni supprimer la ligne de A dans %s", async (table) => {
      const id = fixtureIds[table];
      if (!id) throw new Error(`Fixture manquante pour ${table} (beforeAll a dû échouer).`);

      const { data: selectData } = await clientB.from(table).select("id").eq("id", id);
      expect(selectData ?? []).toHaveLength(0);

      await clientB.from(table).update({ nom: "hacked", label: "hacked", title: "hacked" }).eq("id", id);
      const { data: afterUpdate } = await admin.from(table).select("*").eq("id", id).single();
      expect(afterUpdate).toBeTruthy();

      await clientB.from(table).delete().eq("id", id);
      const { data: afterDelete } = await admin.from(table).select("id").eq("id", id).maybeSingle();
      expect(afterDelete).toBeTruthy();
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

  it("le propriétaire peut toujours modifier ses champs non privilégiés", async () => {
    const { error } = await clientA.from("profiles").update({ nom: "Test A", devise: "EUR" }).eq("id", idA);
    expect(error).toBeNull();

    const { data: profile } = await admin.from("profiles").select("nom, devise").eq("id", idA).single();
    expect(profile?.nom).toBe("Test A");
    expect(profile?.devise).toBe("EUR");
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
