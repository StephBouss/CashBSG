// Edge Function : Tableau de bord administrateur
// Vérifie que l'appelant est administrateur (profiles.is_admin), puis utilise
// la clé service_role pour agréger les données réelles de tous les comptes
// (RLS ne s'applique pas à un client service_role — c'est le seul endroit
// du projet qui a une vue globale, et l'accès y est gardé côté serveur).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// CORS restreint : ALLOWED_ORIGINS (secret, liste séparée par des virgules,
// ex: "https://iwaducash.com,https://www.iwaducash.com") détermine les
// origines autorisées en production. Sans ce secret, seul le serveur de
// développement local est autorisé (fail-closed plutôt que "*").
const DEFAULT_DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function buildCorsHeaders(req: Request): Record<string, string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const allowlist = configured.length > 0 ? configured : DEFAULT_DEV_ORIGINS;
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowlist.includes(origin) ? origin : allowlist[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}

// Un compte est considéré "actif" s'il s'est connecté au cours des 30 derniers jours.
const ACTIVE_WINDOW_DAYS = 30;

function startOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("is_admin")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Tous les comptes auth (pagination Supabase Admin API).
    const authUsers: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      authUsers.push(
        ...data.users.map((u) => ({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
        }))
      );
      if (data.users.length < perPage) break;
      page += 1;
    }

    const now = new Date();
    const start = startOfMonthISO(now);
    const end = endOfMonthISO(now);

    const [{ data: profiles }, { data: incomes }, { data: expenses }, { data: aiMessages }, { data: goals }, { data: aiTokens }] =
      await Promise.all([
        admin.from("profiles").select("id, nom, devise, pays, plan, is_admin"),
        admin.from("incomes").select("user_id, montant").gte("date", start).lte("date", end),
        admin.from("expenses").select("user_id, montant").gte("date_echeance", start).lte("date_echeance", end),
        admin.from("ai_messages").select("user_id").eq("role", "user").gte("created_at", start).lte("created_at", end),
        admin.from("goals").select("id, user_id, label, icone, montant_cible, montant_epargne, date_cible"),
        admin.from("ai_messages").select("user_id, tokens_used").eq("role", "assistant"),
      ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    function sumByUser(rows: { user_id: string; montant: number }[] | null) {
      const map = new Map<string, number>();
      for (const row of rows ?? []) {
        map.set(row.user_id, (map.get(row.user_id) ?? 0) + Number(row.montant));
      }
      return map;
    }

    const revenusByUser = sumByUser(incomes);
    const depensesByUser = sumByUser(expenses);

    const messagesByUser = new Map<string, number>();
    for (const row of aiMessages ?? []) {
      messagesByUser.set(row.user_id, (messagesByUser.get(row.user_id) ?? 0) + 1);
    }

    const tokensByUser = new Map<string, number>();
    for (const row of aiTokens ?? []) {
      tokensByUser.set(row.user_id, (tokensByUser.get(row.user_id) ?? 0) + (row.tokens_used ?? 0));
    }

    const goalsByUser = new Map<string, number>();
    const goalsAtteintsByUser = new Map<string, number>();
    for (const g of goals ?? []) {
      goalsByUser.set(g.user_id, (goalsByUser.get(g.user_id) ?? 0) + 1);
      if (g.montant_epargne >= g.montant_cible) {
        goalsAtteintsByUser.set(g.user_id, (goalsAtteintsByUser.get(g.user_id) ?? 0) + 1);
      }
    }

    const activeThreshold = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const users = authUsers
      .map((u) => {
        const profile = profileById.get(u.id);
        const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null;
        return {
          id: u.id,
          nom: profile?.nom ?? null,
          email: u.email,
          pays: profile?.pays ?? null,
          devise: profile?.devise ?? "FCFA",
          plan: profile?.plan ?? "free",
          isAdmin: profile?.is_admin ?? false,
          status: lastSignIn && lastSignIn >= activeThreshold ? "actif" : "inactif",
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at,
          revenusMois: revenusByUser.get(u.id) ?? 0,
          depensesMois: depensesByUser.get(u.id) ?? 0,
          messagesIaMois: messagesByUser.get(u.id) ?? 0,
          tokensIaTotal: tokensByUser.get(u.id) ?? 0,
          objectifs: goalsByUser.get(u.id) ?? 0,
          objectifsAtteints: goalsAtteintsByUser.get(u.id) ?? 0,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const usersById = new Map(users.map((u) => [u.id, u]));

    const goalsDetail = (goals ?? []).map((g) => {
      const owner = usersById.get(g.user_id);
      return {
        id: g.id,
        userId: g.user_id,
        userNom: owner?.nom ?? null,
        userEmail: owner?.email ?? null,
        label: g.label,
        icone: g.icone,
        montantCible: Number(g.montant_cible),
        montantEpargne: Number(g.montant_epargne),
        dateCible: g.date_cible,
        atteint: Number(g.montant_epargne) >= Number(g.montant_cible),
      };
    });

    const totalRevenusMois = Array.from(revenusByUser.values()).reduce((s, v) => s + v, 0);
    const totalDepensesMois = Array.from(depensesByUser.values()).reduce((s, v) => s + v, 0);
    const totalMessagesIaMois = (aiMessages ?? []).length;
    const totalTokensIa = (aiTokens ?? []).reduce((s, row) => s + (row.tokens_used ?? 0), 0);
    const totalObjectifs = (goals ?? []).length;
    const objectifsAtteints = (goals ?? []).filter((g) => g.montant_epargne >= g.montant_cible).length;
    const activeCount = users.filter((u) => u.status === "actif").length;

    const deviseCounts = new Map<string, number>();
    for (const p of profiles ?? []) {
      deviseCounts.set(p.devise, (deviseCounts.get(p.devise) ?? 0) + 1);
    }

    const planCounts = new Map<string, number>();
    for (const p of profiles ?? []) {
      const plan = p.plan ?? "free";
      planCounts.set(plan, (planCounts.get(plan) ?? 0) + 1);
    }

    const payload = {
      kpis: {
        totalComptes: authUsers.length,
        totalRevenusMois,
        totalDepensesMois,
        totalMessagesIaMois,
        totalTokensIa,
        totalObjectifs,
        objectifsAtteints,
        activeCount,
        inactiveCount: authUsers.length - activeCount,
      },
      users,
      recentSignups: users.slice(0, 8),
      deviseBreakdown: Array.from(deviseCounts.entries()).map(([devise, count]) => ({ devise, count })),
      planBreakdown: Array.from(planCounts.entries()).map(([plan, count]) => ({ plan, count })),
      goalsDetail,
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
