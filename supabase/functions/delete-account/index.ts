// Edge Function : suppression réelle de compte (P0.8)
// Le bouton "Supprimer le compte" (SettingsPage.tsx) n'appelait auparavant
// que signOut() — aucune donnée n'était effacée, en contradiction avec la
// politique de confidentialité. Cette fonction authentifie l'appelant, exige
// une confirmation explicite (son propre email), journalise la suppression
// dans account_deletions (service_role uniquement), puis supprime le compte
// via l'API Admin GoTrue — ce qui déclenche la cascade on delete définie sur
// toutes les tables métier (expenses, incomes, goals, ai_messages, etc.).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
      data: { user },
    } = await callerClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { confirmEmail } = await req.json().catch(() => ({ confirmEmail: null }));

    // Confirmation explicite exigée côté serveur (pas seulement côté UI) :
    // une action aussi irréversible ne doit pas pouvoir être déclenchée par
    // un simple appel réseau rejoué ou un clic accidentel.
    if (
      typeof confirmEmail !== "string" ||
      !user.email ||
      confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
    ) {
      return new Response(
        JSON.stringify({ error: "Confirmation invalide : l'email saisi ne correspond pas à votre compte." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await admin.from("account_deletions").insert({ user_id: user.id, email: user.email });

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
