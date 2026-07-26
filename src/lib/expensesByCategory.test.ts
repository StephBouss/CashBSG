import { describe, expect, it } from "vitest";
import { expensesByCategory } from "@/lib/expensesByCategory";
import type { Category, Expense } from "@/types/budget";

function category(id: string, nom: string): Category {
  return { id, userId: "u1", nom, type: "depense", couleur: null, icone: null };
}

function expense(categoryId: string | null, montant: number): Expense {
  return {
    id: crypto.randomUUID(),
    userId: "u1",
    categoryId,
    nom: "Dépense",
    montant,
    dateEcheance: "2026-07-05",
    priorite: null,
    statut: "paye",
    datePaiement: null,
  };
}

describe("expensesByCategory", () => {
  const categories = [category("c1", "Alimentation"), category("c2", "Transport")];

  it("groups and sums expenses by category, sorted descending", () => {
    const expenses = [expense("c1", 1000), expense("c1", 3500), expense("c2", 2000)];

    const result = expensesByCategory(expenses, categories);

    expect(result).toEqual([
      { nom: "Alimentation", montant: 4500, couleur: expect.any(String) },
      { nom: "Transport", montant: 2000, couleur: expect.any(String) },
    ]);
  });

  it("groups expenses without a known category under 'Autres'", () => {
    const expenses = [expense(null, 500), expense("unknown-id", 700)];

    const result = expensesByCategory(expenses, categories);

    expect(result).toEqual([{ nom: "Autres", montant: 1200, couleur: expect.any(String) }]);
  });

  it("respects the limit parameter", () => {
    const expenses = [expense("c1", 100), expense("c2", 900)];

    const result = expensesByCategory(expenses, categories, 1);

    expect(result).toHaveLength(1);
    expect(result[0].nom).toBe("Transport");
  });

  it("returns an empty array when there are no expenses", () => {
    expect(expensesByCategory([], categories)).toEqual([]);
  });
});
