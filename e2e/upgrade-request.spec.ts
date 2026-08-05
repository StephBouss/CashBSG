import { test, expect } from "@playwright/test";
import { adminClient, getTestUserId, loginAsTestAccount } from "./helpers";

/** Parcours 4/4 — Demande de mise à niveau d'offre.
 * upgrade_requests a une contrainte "une seule demande en_attente par
 * utilisateur" (C1.4) : on nettoie avant ET après, pour que le test reste
 * rejouable même si une exécution précédente a été interrompue. */
test.describe("Demande de mise à niveau", () => {
  test.beforeEach(async () => {
    const admin = adminClient();
    const userId = await getTestUserId();
    await admin.from("upgrade_requests").delete().eq("user_id", userId).eq("status", "en_attente");
  });

  test.afterEach(async () => {
    const admin = adminClient();
    const userId = await getTestUserId();
    await admin.from("upgrade_requests").delete().eq("user_id", userId).eq("status", "en_attente");
  });

  test("envoie une demande et affiche l'accusé de réception", async ({ page }) => {
    await loginAsTestAccount(page);
    await page.goto("/app/mise-a-niveau");

    await page.getByRole("button", { name: /^Passer à /u }).first().click();

    await expect(page.getByText(/en attente de traitement/)).toBeVisible();
  });
});
