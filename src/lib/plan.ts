import type { Plan, SavingsAccountType } from "@/types/budget";

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Iwadu Free",
  essentiel: "Iwadu Essentiel",
  pro: "Iwadu Pro",
  business: "Iwadu Business",
};

export const PLAN_ORDER: Plan[] = ["free", "essentiel", "pro", "business"];

export const PLAN_PRICES: Record<Plan, string> = {
  free: "Gratuit",
  essentiel: "5 000 FCFA/mois",
  pro: "15 000 FCFA/mois",
  business: "25 000 FCFA/mois",
};

/** Offres au-dessus du plan actuel, dans l'ordre. */
export function upgradeOptions(plan: Plan): Plan[] {
  return PLAN_ORDER.slice(PLAN_ORDER.indexOf(plan) + 1);
}

/** Objectifs financiers illimités : réservé aux offres payantes (voir tarifs).
 * Temporairement désactivé à la demande — accessible à tous les plans pour
 * l'instant. Remettre `return plan !== "free";` pour réactiver le gating. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canAccessGoals(_plan: Plan): boolean {
  return true;
}

/** Historique complet (rapports sur plusieurs mois) : réservé aux offres payantes. */
export function canAccessFullHistory(plan: Plan): boolean {
  return plan !== "free";
}

/** Quota mensuel de messages au conseiller IA (C3.1) — Pro/Business plafonnés
 * "raisonnablement" plutôt qu'illimités, pour borner le coût DeepSeek. */
export const AI_MESSAGE_QUOTA: Record<Plan, number> = {
  free: 25,
  essentiel: 100,
  pro: 1000,
  business: 3000,
};

/** Le plan réellement actif compte tenu de l'expiration — même règle que
 * has_paid_plan() côté serveur (supabase/migrations/20260803135011_...). */
export function effectivePlan(plan: Plan, planExpiresAt: string | null): Plan {
  if (plan !== "free" && planExpiresAt && new Date(planExpiresAt) <= new Date()) {
    return "free";
  }
  return plan;
}

/** Nombre d'entrées Tracker autorisées (expenses.source = 'tracker'),
 * null = illimité. Appliqué aussi côté serveur (trigger enforce_tracker_limit). */
export const TRACKER_ENTRY_LIMIT: Record<Plan, number | null> = {
  free: 5,
  essentiel: 10,
  pro: null,
  business: null,
};

/** Nombre de comptes savings_accounts autorisés par type (épargne /
 * investissement), null = illimité. Appliqué aussi côté serveur (trigger
 * enforce_savings_account_limit). */
export const SAVINGS_ACCOUNT_LIMIT: Record<Plan, Record<SavingsAccountType, number | null>> = {
  free: { epargne: 1, investissement: 1 },
  essentiel: { epargne: 2, investissement: 1 },
  pro: { epargne: null, investissement: null },
  business: { epargne: null, investissement: null },
};
