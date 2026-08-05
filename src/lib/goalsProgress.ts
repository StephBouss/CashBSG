/** Pourcentage de progression d'un objectif (0-100, borné). */
export function goalProgressPct(montantEpargne: number, montantCible: number): number {
  return montantCible > 0 ? Math.round((montantEpargne / montantCible) * 100) : 0;
}

export function isGoalAchieved(montantEpargne: number, montantCible: number): boolean {
  return montantEpargne >= montantCible;
}
