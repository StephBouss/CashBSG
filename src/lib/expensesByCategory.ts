import type { Category, Expense } from "@/types/budget";
import { categoryColor } from "@/lib/categoryStyle";

export interface CategoryTotal {
  nom: string;
  montant: number;
  couleur: string;
}

/** Regroupe les dépenses par catégorie, triées par montant décroissant. */
export function expensesByCategory(
  expenses: Expense[],
  categories: Category[],
  limit?: number
): CategoryTotal[] {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const category = categoryById.get(expense.categoryId ?? "");
    const nom = category?.nom ?? "Autres";
    totals.set(nom, (totals.get(nom) ?? 0) + expense.montant);
  }

  const result = Array.from(totals, ([nom, montant]) => {
    const category = categories.find((c) => c.nom === nom);
    return { nom, montant, couleur: categoryColor(nom, category?.couleur) };
  }).sort((a, b) => b.montant - a.montant);

  return limit ? result.slice(0, limit) : result;
}
