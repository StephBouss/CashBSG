import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
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
    exclude: [...configDefaults.exclude, "src/lib/security.integration.test.ts"],
  },
});
