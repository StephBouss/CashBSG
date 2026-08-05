import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Rapport HTML (dist/bundle-stats.html, non commité) généré à chaque
  // `npm run build` — C7.4 : mesurer le poids du bundle avant/après.
  plugins: [react(), visualizer({ filename: "dist/bundle-stats.html", gzipSize: true })],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    // security.integration.test.ts a besoin de vraies credentials réseau
    // (service_role) et crée de vrais comptes sur le projet Supabase lié :
    // exclu du run par défaut, lancé explicitement via `npm run test:security`.
    // e2e/**/*.spec.ts sont des parcours Playwright (npm run test:e2e), pas
    // des tests Vitest — le glob par défaut de Vitest les confondrait sinon.
    exclude: [...configDefaults.exclude, "src/lib/security.integration.test.ts", ".claude/worktrees/**", "e2e/**"],
  },
});
