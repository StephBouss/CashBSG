import { test, expect } from "@playwright/test";
import { adminClient, loginAsTestAccount, uniqueLabel } from "./helpers";

/** Parcours 3/4 — Onboarding jusqu'au déverrouillage d'Iwadu (IA).
 * Le compte de test a déjà un nom mais aucun revenu/dépense au départ :
 * Iwadu doit être verrouillé, puis se débloquer une fois les deux derniers
 * critères remplis (revenu + dépense). Nettoie les deux lignes créées. */
test.describe("Déverrouillage d'Iwadu via l'onboarding", () => {
  const incomeLabel = uniqueLabel("Revenu");
  const expenseLabel = uniqueLabel("Dépense");

  test.afterEach(async () => {
    const admin = adminClient();
    await admin.from("incomes").delete().eq("nom", incomeLabel);
    await admin.from("expenses").delete().eq("nom", expenseLabel);
  });

  test("verrouillé sans revenu/dépense, débloqué une fois le profil complété", async ({ page }) => {
    await loginAsTestAccount(page);

    await page.goto("/app/conseiller-ia");
    await expect(page.getByText("Iwadu n'est pas encore débloqué")).toBeVisible();

    // Ajoute le revenu manquant.
    await page.goto("/app/revenus");
    await page.getByPlaceholder("Nom du revenu").fill(incomeLabel);
    await page.getByPlaceholder("Montant (FCFA)").fill("2000");
    await page.locator('input[type="date"]').fill(new Date().toISOString().slice(0, 10));
    await page.getByRole("button", { name: "Ajouter le revenu" }).click();
    await expect(page.getByText(incomeLabel)).toBeVisible();

    // Ajoute la dépense manquante (le type "Dépense" est déjà présélectionné
    // depuis cette page — cf. ExpensesPage). ".last()" cible le bouton de
    // soumission de la modale, qui partage son libellé "Ajouter" avec le
    // bouton qui l'ouvre, toujours présent derrière elle dans le DOM.
    await page.goto("/app/depenses");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByText("Ajouter une transaction")).toBeVisible();
    await page.getByPlaceholder("Ex: Salaire principal").fill(expenseLabel);
    await page.getByPlaceholder("0").fill("500");
    await page.getByRole("button", { name: "Ajouter", exact: true }).last().click();
    await expect(page.getByText(expenseLabel)).toBeVisible();

    // Iwadu doit maintenant être débloqué.
    await page.goto("/app/conseiller-ia");
    await expect(page.getByText("Iwadu n'est pas encore débloqué")).not.toBeVisible();
    await expect(page.getByPlaceholder("Posez une question...")).toBeVisible();
  });
});
