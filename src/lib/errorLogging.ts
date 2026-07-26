import { supabase } from "@/lib/supabase";

/** Envoie une erreur client à la table `client_errors` (Supabase). Best-effort :
 * ne doit jamais lever, sous peine de masquer l'erreur d'origine. */
export async function logClientError(error: unknown, context?: string) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack ?? null : null;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("client_errors").insert({
      user_id: user?.id ?? null,
      message: context ? `[${context}] ${message}` : message,
      stack,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // Best-effort : on ignore silencieusement un échec de journalisation.
  }
}

/** Capture les erreurs qui n'atteignent jamais un ErrorBoundary React
 * (rejets de promesses non gérés, erreurs hors du cycle de rendu). */
export function installGlobalErrorLogging() {
  window.addEventListener("error", (event) => {
    logClientError(event.error ?? event.message, "window.onerror");
  });
  window.addEventListener("unhandledrejection", (event) => {
    logClientError(event.reason, "unhandledrejection");
  });
}
