import { describe, expect, it } from "vitest";
import { computeMonthFinancials } from "@/lib/calculations";
import type { Expense, Income } from "@/types/budget";

function income(montant: number): Income {
  return {
    id: crypto.randomUUID(),
    userId: "u1",
    categoryId: null,
    nom: "Revenu",
    montant,
    frequence: null,
    date: "2026-07-01",
  };
}

function expense(montant: number, statut: Expense["statut"]): Expense {
  return {
    id: crypto.randomUUID(),
    userId: "u1",
    categoryId: null,
    nom: "Dépense",
    montant,
    dateEcheance: "2026-07-05",
    priorite: null,
    statut,
    datePaiement: statut === "paye" ? "2026-07-05T00:00:00Z" : null,
  };
}

describe("computeMonthFinancials", () => {
  it("compte la dîme comme une dépense dans le solde", () => {
    const result = computeMonthFinancials(
      [income(900_000)],
      [expense(600_000, "paye")],
      135_000
    );

    expect(result.totalRevenus).toBe(900_000);
    expect(result.dime).toBe(135_000);
    expect(result.totalDepensesPayees).toBe(600_000);
    expect(result.solde).toBe(900_000 - 600_000 - 135_000);
  });

  it("ignore les dépenses non payées dans le solde mais les compte à part", () => {
    const result = computeMonthFinancials(
      [income(500_000)],
      [expense(100_000, "a_venir"), expense(50_000, "en_retard"), expense(200_000, "paye")],
      75_000
    );

    expect(result.totalDepensesPayees).toBe(200_000);
    expect(result.totalDepensesAVenir).toBe(100_000);
    expect(result.totalDepensesEnRetard).toBe(50_000);
    expect(result.solde).toBe(500_000 - 200_000 - 75_000);
  });

  it("retourne un solde négatif quand les sorties dépassent les revenus", () => {
    const result = computeMonthFinancials(
      [income(300_000)],
      [expense(280_000, "paye")],
      60_000
    );

    expect(result.dime).toBe(60_000);
    expect(result.solde).toBe(300_000 - 280_000 - 60_000);
    expect(result.solde).toBeLessThan(0);
  });

  it("gère l'absence de revenus, de dépenses et de dîme", () => {
    const result = computeMonthFinancials([], [], 0);

    expect(result).toEqual({
      totalRevenus: 0,
      dime: 0,
      totalDepensesPayees: 0,
      totalDepensesAVenir: 0,
      totalDepensesEnRetard: 0,
      solde: 0,
    });
  });

  it("le montant de dîme est optionnel et vaut 0 par défaut", () => {
    const result = computeMonthFinancials([income(100_000)], []);
    expect(result.dime).toBe(0);
    expect(result.solde).toBe(100_000);
  });
});
