// Edge Function : Conseiller IA Budget+
// Reçoit un message utilisateur, construit un contexte financier réel depuis
// Supabase, appelle l'API DeepSeek, persiste les deux messages, renvoie la réponse.

import { createClient } from "jsr:@supabase/supabase-js@2";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    const now = new Date();
    const start = startOfMonthISO(now);
    const end = endOfMonthISO(now);

    const [{ data: profile }, { data: incomes }, { data: expenses }, { data: goals }, { data: history }] =
      await Promise.all([
        supabase.from("profiles").select("pourcentage_dime, devise").eq("id", user.id).single(),
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
    const dime = totalRevenus * ((profile?.pourcentage_dime ?? 15) / 100);

    const contextSummary = `Contexte financier du mois en cours (devise: ${devise}) :
- Revenus totaux : ${totalRevenus} ${devise}
- Dépenses totales : ${totalDepenses} ${devise}
- Dîme (${profile?.pourcentage_dime ?? 15}%) : ${Math.round(dime)} ${devise}
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
        model: "deepseek-chat",
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `Tu es le conseiller financier IA de l'application Budget+, une app de budget personnel en franc CFA (FCFA), utilisée en français. Donne des conseils concrets, chiffrés et bienveillants, basés UNIQUEMENT sur les données réelles fournies ci-dessous. Ne jamais inventer de chiffres. Réponds en français, de façon concise (moins de 200 mots sauf si l'utilisateur demande un détail).\n\n${contextSummary}`,
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

    await supabase.from("ai_messages").insert({ user_id: user.id, role: "assistant", content: reply });

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
