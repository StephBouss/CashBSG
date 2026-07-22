import { supabase } from "@/lib/supabase";

/** Normalise accents/casse pour repérer un compte "Dîme" quel que soit son orthographe. */
export function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function isDimeAccountName(nom: string): boolean {
  return normalizeForMatch(nom).includes("dime");
}

/** Somme des mouvements des comptes épargne nommés "Dîme" sur une période donnée. */
export async function fetchDimeMontant(start: string, end: string): Promise<number> {
  const { data: accounts, error: accountsError } = await supabase
    .from("savings_accounts")
    .select("id, nom");

  if (accountsError) throw accountsError;

  const dimeAccountIds = (accounts ?? []).filter((a) => isDimeAccountName(a.nom)).map((a) => a.id);
  if (dimeAccountIds.length === 0) return 0;

  const { data: movements, error: movementsError } = await supabase
    .from("savings_movements")
    .select("montant, date")
    .in("account_id", dimeAccountIds)
    .gte("date", start)
    .lte("date", end);

  if (movementsError) throw movementsError;

  return (movements ?? []).reduce((total, m) => total + Number(m.montant), 0);
}
