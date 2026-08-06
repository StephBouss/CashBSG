import { formatISO } from "date-fns";
import type { Expense } from "@/types/budget";

export type EffectiveExpenseStatus = "paye" | "a_venir" | "en_retard";

/**
 * Statut financier effectif d'une dépense (P0.6) : une dépense non payée
 * dont l'échéance est dépassée est en retard, même si la colonne `statut`
 * stockée en base dit encore "a_venir" (celle-ci n'est matérialisée
 * qu'une fois par jour côté serveur, voir materialize_overdue_expenses).
 * `reference` est injectable pour des tests déterministes, indépendants de
 * l'horloge réelle — même règle que la fonction SQL financial_summary().
 */
export function effectiveExpenseStatus(
  expense: Pick<Expense, "statut" | "dateEcheance">,
  reference: Date = new Date()
): EffectiveExpenseStatus {
  if (expense.statut === "paye") return "paye";
  const referenceDate = formatISO(reference, { representation: "date" });
  return expense.dateEcheance < referenceDate ? "en_retard" : "a_venir";
}
