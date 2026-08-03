import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Config dédiée à `npm run test:security` : n'exécute QUE le test
 * d'isolation/escalade de privilèges (C1.7). Ce test a besoin de vraies
 * credentials réseau (service_role) et crée/supprime de vrais comptes sur
 * le projet Supabase lié — il ne doit jamais tourner via `npm run test`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/lib/security.integration.test.ts"],
    exclude: [],
    testTimeout: 30_000,
    setupFiles: ["./scripts/load-test-env.ts"],
  },
});
