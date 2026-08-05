import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

/** Client service_role, réservé au setup/cleanup des parcours — jamais à la
 * navigation elle-même, qui doit passer par l'UI comme un vrai utilisateur. */
export function adminClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function loginAsTestAccount(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(process.env.E2E_TEST_EMAIL!);
  await page.getByPlaceholder("Mot de passe").fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/app");
}

export function uniqueLabel(prefix: string) {
  return `${prefix} E2E ${Date.now()}`;
}

export async function getTestUserId() {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const user = data.users.find((u) => u.email === process.env.E2E_TEST_EMAIL);
  if (!user) throw new Error(`Compte de test introuvable pour ${process.env.E2E_TEST_EMAIL}`);
  return user.id;
}
