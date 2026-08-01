// Edge Function : Conseiller IA Budget+
// Reçoit un message utilisateur, construit un contexte financier réel depuis
// Supabase, appelle l'API DeepSeek, persiste les deux messages, renvoie la réponse.

import { createClient } from "jsr:@supabase/supabase-js@2";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

function startOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function endOfMonthISO(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

// Contrôle de coût : évite qu'un compte authentifié ne fasse exploser la
// facture DeepSeek en spammant l'endpoint.
const BURST_LIMIT = 8; // messages max sur 5 minutes
const DAILY_LIMIT = 60; // messages max sur 24h

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function countUserMessagesSince(supabase: any, userId: string, sinceISO: string): Promise<number> {
  const { count, error } = await supabase
    .from("ai_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", sinceISO);
  if (error) throw error;
  return count ?? 0;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "DEEPSEEK_API_KEY n'est pas configurée. Exécutez : supabase secrets set DEEPSEEK_API_KEY=sk-...",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message manquant." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitNow = new Date();
    const fiveMinAgo = new Date(rateLimitNow.getTime() - 5 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(rateLimitNow.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const [burstCount, dailyCount] = await Promise.all([
      countUserMessagesSince(supabase, user.id, fiveMinAgo),
      countUserMessagesSince(supabase, user.id, oneDayAgo),
    ]);

    if (burstCount >= BURST_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Trop de messages envoyés en peu de temps. Merci de patienter quelques minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (dailyCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Limite quotidienne de messages avec le conseiller IA atteinte. Réessayez demain." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const start = startOfMonthISO(now);
    const end = endOfMonthISO(now);

    const [{ data: profile }, { data: incomes }, { data: expenses }, { data: goals }, { data: history }] =
      await Promise.all([
        supabase.from("profiles").select("devise").eq("id", user.id).single(),
        supabase
          .from("incomes")
          .select("nom, montant, date")
          .gte("date", start)
          .lte("date", end),
        supabase
          .from("expenses")
          .select("nom, montant, statut, date_echeance")
          .gte("date_echeance", start)
          .lte("date_echeance", end),
        supabase
          .from("goals")
          .select("label, montant_cible, montant_epargne, contribution_mensuelle"),
        supabase
          .from("ai_messages")
          .select("role, content")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const devise = profile?.devise ?? "FCFA";
    const totalRevenus = (incomes ?? []).reduce((s, i) => s + Number(i.montant), 0);
    const totalDepenses = (expenses ?? []).reduce((s, e) => s + Number(e.montant), 0);

    const contextSummary = `Contexte financier du mois en cours (devise: ${devise}) :
- Revenus totaux : ${totalRevenus} ${devise}
- Dépenses totales : ${totalDepenses} ${devise}
- Détail dépenses : ${(expenses ?? [])
      .map((e) => `${e.nom} (${e.montant} ${devise}, ${e.statut})`)
      .join(", ") || "aucune"}
- Objectifs d'épargne : ${
      (goals ?? [])
        .map(
          (g) =>
            `${g.label} (${g.montant_epargne}/${g.montant_cible} ${devise}, contribution mensuelle ${g.contribution_mensuelle} ${devise})`
        )
        .join(", ") || "aucun"
    }`;

    const conversationHistory = (history ?? [])
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    await supabase.from("ai_messages").insert({ user_id: user.id, role: "user", content: message });

    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `Tu es Iwadu, le conseiller financier IA de l'application Iwadu Cash, une app de budget personnel en franc CFA (FCFA), utilisée en français. Donne des conseils concrets, chiffrés et bienveillants, basés UNIQUEMENT sur les données réelles fournies ci-dessous. Ne jamais inventer de chiffres. Réponds en français, de façon concise (moins de 200 mots sauf si l'utilisateur demande un détail).\n\n${contextSummary}`,
          },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      throw new Error(`Erreur API DeepSeek (${deepseekRes.status}) : ${errText}`);
    }

    const deepseekData = await deepseekRes.json();
    const reply = deepseekData.choices?.[0]?.message?.content ?? "Désolé, je n'ai pas pu générer de réponse.";
    const tokensUsed = deepseekData.usage?.total_tokens ?? null;

    await supabase.from("ai_messages").insert({ user_id: user.id, role: "assistant", content: reply, tokens_used: tokensUsed });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
