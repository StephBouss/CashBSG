import { test, expect } from "@playwright/test";
import { adminClient, loginAsTestAccount, uniqueLabel } from "./helpers";

/** Parcours 2/4 — Saisie d'une dépense depuis le tableau de bord. */
test.describe("Saisie d'une dépense", () => {
  const label = uniqueLabel("Dépense");

  test.afterEach(async () => {
    const admin = adminClient();
    await admin.from("expenses").delete().eq("nom", label);
  });

  test("ajoute une dépense et la retrouve dans la liste des dépenses", async ({ page }) => {
    await loginAsTestAccount(page);

    await page.getByRole("button", { name: "+ Ajouter" }).click();
    await expect(page.getByText("Ajouter une transaction")).toBeVisible();

    // Le type "Dépense" est déjà sélectionné par défaut depuis le dashboard.
    await page.getByPlaceholder("Ex: Salaire principal").fill(label);
    await page.getByPlaceholder("0").fill("1500");
    await page.getByRole("button", { name: "Ajouter", exact: true }).click();

    await expect(page.getByText("Ajouter une transaction")).not.toBeVisible();

    await page.goto("/app/depenses");
    await expect(page.getByText(label)).toBeVisible();
  });
});
