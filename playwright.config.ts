import { defineConfig, devices } from "@playwright/test";
import "./scripts/load-test-env";

/**
 * C7.3 — Parcours Playwright versionnés (remplace les scripts jetables des
 * sessions précédentes). Tourne contre le projet Supabase lié (pas de
 * staging, cf. C4.5 non traité) : chaque parcours nettoie les données qu'il
 * crée. Nécessite .env.test (voir scripts/load-test-env.ts) et un serveur
 * de dev sur le port 5173 — lancé automatiquement si absent.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
