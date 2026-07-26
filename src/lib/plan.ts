import type { Plan } from "@/types/budget";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Iwadu Free",
  essentiel: "Iwadu Essentiel",
  pro: "Iwadu Pro",
};

export const PLAN_ORDER: Plan[] = ["free", "essentiel", "pro"];

export const PLAN_PRICES: Record<Plan, string> = {
  free: "Gratuit",
  essentiel: "5 000 FCFA/mois",
  pro: "15 000 FCFA/mois",
};

/** Offres au-dessus du plan actuel, dans l'ordre. */
export function upgradeOptions(plan: Plan): Plan[] {
  return PLAN_ORDER.slice(PLAN_ORDER.indexOf(plan) + 1);
}

/** Objectifs financiers illimités : réservé aux offres payantes (voir tarifs).
 * Temporairement désactivé à la demande — accessible à tous les plans pour
 * l'instant. Remettre `return plan !== "free";` pour réactiver le gating. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAccessGoals(plan: Plan): boolean {
  return true;
}

/** Historique complet (rapports sur plusieurs mois) : réservé aux offres payantes. */
export function canAccessFullHistory(plan: Plan): boolean {
  return plan !== "free";
}
