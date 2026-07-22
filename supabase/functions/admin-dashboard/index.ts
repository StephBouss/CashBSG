// Edge Function : Tableau de bord administrateur
// Vérifie que l'appelant est administrateur (profiles.is_admin), puis utilise
// la clé service_role pour agréger les données réelles de tous les comptes
// (RLS ne s'applique pas à un client service_role — c'est le seul endroit
// du projet qui a une vue globale, et l'accès y est gardé côté serveur).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function startOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
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
    const authUsers: { id: string; email: string | null; created_at: string }[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      authUsers.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at })));
      if (data.users.length < perPage) break;
      page += 1;
    }

    const now = new Date();
    const start = startOfMonthISO(now);
    const end = endOfMonthISO(now);

    const [{ data: profiles }, { data: incomes }, { data: expenses }, { data: aiMessages }, { data: goals }] =
      await Promise.all([
        admin.from("profiles").select("id, nom, devise, is_admin"),
        admin.from("incomes").select("user_id, montant").gte("date", start).lte("date", end),
        admin.from("expenses").select("user_id, montant").gte("date_echeance", start).lte("date_echeance", end),
        admin.from("ai_messages").select("user_id").eq("role", "user").gte("created_at", start).lte("created_at", end),
        admin.from("goals").select("user_id, montant_cible, montant_epargne"),
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

    const goalsByUser = new Map<string, number>();
    for (const g of goals ?? []) {
      goalsByUser.set(g.user_id, (goalsByUser.get(g.user_id) ?? 0) + 1);
    }

    const users = authUsers
      .map((u) => {
        const profile = profileById.get(u.id);
        return {
          id: u.id,
          nom: profile?.nom ?? null,
          email: u.email,
          devise: profile?.devise ?? "FCFA",
          isAdmin: profile?.is_admin ?? false,
          createdAt: u.created_at,
          revenusMois: revenusByUser.get(u.id) ?? 0,
          depensesMois: depensesByUser.get(u.id) ?? 0,
          messagesIaMois: messagesByUser.get(u.id) ?? 0,
          objectifs: goalsByUser.get(u.id) ?? 0,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalRevenusMois = Array.from(revenusByUser.values()).reduce((s, v) => s + v, 0);
    const totalDepensesMois = Array.from(depensesByUser.values()).reduce((s, v) => s + v, 0);
    const totalMessagesIaMois = (aiMessages ?? []).length;
    const totalObjectifs = (goals ?? []).length;
    const objectifsAtteints = (goals ?? []).filter((g) => g.montant_epargne >= g.montant_cible).length;

    const deviseCounts = new Map<string, number>();
    for (const p of profiles ?? []) {
      deviseCounts.set(p.devise, (deviseCounts.get(p.devise) ?? 0) + 1);
    }

    const payload = {
      kpis: {
        totalComptes: authUsers.length,
        totalRevenusMois,
        totalDepensesMois,
        totalMessagesIaMois,
        totalObjectifs,
        objectifsAtteints,
      },
      users,
      recentSignups: users.slice(0, 8),
      deviseBreakdown: Array.from(deviseCounts.entries()).map(([devise, count]) => ({ devise, count })),
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
