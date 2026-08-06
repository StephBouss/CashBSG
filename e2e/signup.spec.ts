import { test, expect } from "@playwright/test";
import { adminClient } from "./helpers";

/** Parcours 1/4 — Inscription et confirmation.
 * Va jusqu'à l'écran "vérifiez votre boîte mail" : on ne peut pas aller plus
 * loin sans accès à la boîte mail réelle (pas de webhook/inbox de test ici).
 * Nettoie le compte créé via service_role dans tous les cas (afterEach). */
test.describe("Inscription", () => {
  // Supabase Auth vérifie la délivrabilité réelle du domaine à l'inscription
  // publique : ni .invalid (RFC 2606) ni example.com ne passent. On utilise
  // un alias "+" sur une vraie adresse (délivrable, unique par run, définie
  // dans .env.test — jamais commitée) : les emails de confirmation
  // atterrissent dans la boîte de l'adresse de base et peuvent être ignorés.
  const [localPart, domain] = process.env.E2E_SIGNUP_BASE_EMAIL!.split("@");
  const email = `${localPart}+e2e-signup-${Date.now()}@${domain}`;
  const password = "MotDePasseTest123";

  test.afterEach(async () => {
    const admin = adminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const created = data.users.find((u) => u.email === email);
    if (created) await admin.auth.admin.deleteUser(created.id);
  });

  test("crée un compte et affiche l'écran de confirmation par email", async ({ page }) => {
    await page.goto("/signup");

    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Mot de passe", { exact: true }).fill(password);
    await page.getByPlaceholder("Confirmer le mot de passe").fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByText("Vérifiez votre boîte mail")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });
});
