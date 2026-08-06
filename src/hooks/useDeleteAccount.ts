import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/** P0.8 — suppression réelle et définitive du compte (edge function
 * delete-account, service_role). `confirmEmail` doit correspondre à l'email
 * du compte connecté : la confirmation est revérifiée côté serveur. */
export async function deleteAccount(confirmEmail: string): Promise<void> {
  const { error } = await supabase.functions.invoke("delete-account", {
    body: { confirmEmail },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
}
