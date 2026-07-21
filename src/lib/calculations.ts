import type { Expense, Income } from "@/types/budget";

export interface MonthFinancials {
  totalRevenus: number;
  pourcentageDime: number;
  dime: number;
  totalDepensesPayees: number;
  totalDepensesAVenir: number;
  totalDepensesEnRetard: number;
  solde: number;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Calcule dîme, totaux et solde pour un mois donné.
 * Module pur (aucun import React/Supabase) afin d'être réutilisable
 * tel quel côté client et côté Edge Function.
 */
export function computeMonthFinancials(
  incomes: Income[],
  expenses: Expense[],
  pourcentageDime: number
): MonthFinancials {
  const totalRevenus = sum(incomes.map((income) => income.montant));
  const dime = totalRevenus * (pourcentageDime / 100);

  const totalDepensesPayees = sum(
    expenses.filter((expense) => expense.statut === "paye").map((expense) => expense.montant)
  );
  const totalDepensesAVenir = sum(
    expenses.filter((expense) => expense.statut === "a_venir").map((expense) => expense.montant)
  );
  const totalDepensesEnRetard = sum(
    expenses.filter((expense) => expense.statut === "en_retard").map((expense) => expense.montant)
  );

  const solde = totalRevenus - totalDepensesPayees - dime;

  return {
    totalRevenus,
    pourcentageDime,
    dime,
    totalDepensesPayees,
    totalDepensesAVenir,
    totalDepensesEnRetard,
    solde,
  };
}
