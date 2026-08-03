import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Charge .env.test (jamais committé) dans process.env pour les tests
 * d'intégration sécurité, qui tournent en Node et n'ont pas accès aux
 * variables VITE_* injectées côté client.
 */
const envPath = resolve(process.cwd(), ".env.test");

if (!existsSync(envPath)) {
  throw new Error(
    ".env.test introuvable — requis pour npm run test:security (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)."
  );
}

for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!(key in process.env)) process.env[key] = value;
}
