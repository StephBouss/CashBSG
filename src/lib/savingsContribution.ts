interface IncomeLike {
  categoryId: string | null;
  montant: number;
}

interface PercentageAccountLike {
  mode: "montant" | "pourcentage";
  pourcentage: number | null;
  categoryId: string | null;
}

/** Montant suggéré pour un compte d'épargne en mode "pourcentage" : une part
 * des revenus (filtrés par catégorie si le compte en cible une, sinon tous
 * les revenus). Retourne 0 pour un compte en mode "montant fixe". */
export function computeSuggestedContribution(
  incomes: IncomeLike[],
  account: PercentageAccountLike
): number {
  if (account.mode !== "pourcentage" || !account.pourcentage) return 0;
  const base = account.categoryId
    ? incomes.filter((i) => i.categoryId === account.categoryId)
    : incomes;
  const total = base.reduce((s, i) => s + i.montant, 0);
  return Math.round(total * (account.pourcentage / 100));
}
