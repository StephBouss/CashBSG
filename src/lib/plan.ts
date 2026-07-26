import type { Plan } from "@/types/budget";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Iwadu Free",
  essentiel: "Iwadu Essentiel",
  pro: "Iwadu Pro",
};

/** Objectifs financiers illimités : réservé aux offres payantes (voir tarifs). */
export function canAccessGoals(plan: Plan): boolean {
  return plan !== "free";
}

/** Historique complet (rapports sur plusieurs mois) : réservé aux offres payantes. */
export function canAccessFullHistory(plan: Plan): boolean {
  return plan !== "free";
}
