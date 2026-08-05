import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { monthRange } from "@/lib/month";
import type { Expense } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export interface UseExpensesOptions {
  /** Désactivez pour les appels secondaires (ex: mois de comparaison) afin
   * d'éviter deux abonnements realtime simultanés sur le même canal. */
  realtime?: boolean;
}

export function useExpenses(month: Date = new Date(), options: UseExpensesOptions = {}) {
  const { realtime = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { start, end } = monthRange(month);
  const queryKey = ["expenses", user?.id, start];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          "id, user_id, category_id, nom, montant, date_echeance, priorite, statut, date_paiement"
        )
        .eq("source", "facture")
        .gte("date_echeance", start)
        .lte("date_echeance", end)
        .order("date_echeance");

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        nom: row.nom,
        montant: row.montant,
        dateEcheance: row.date_echeance,
        priorite: row.priorite,
        statut: row.statut,
        datePaiement: row.date_paiement,
      }));
    },
  });

  useEffect(() => {
    if (!user || !realtime) return;

    const channel = supabase
      .channel(`expenses-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["expenses", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, realtime]);

  return query;
}

export async function markExpensePaid(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .update({ statut: "paye", date_paiement: new Date().toISOString() })
    .eq("id", expenseId);

  if (error) throw error;
}

export interface CreateExpenseInput {
  nom: string;
  montant: number;
  categoryId?: string | null;
  dateEcheance: string;
  priorite?: string | null;
}

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    nom: input.nom,
    montant: input.montant,
    category_id: input.categoryId || null,
    date_echeance: input.dateEcheance,
    priorite: input.priorite || null,
  });

  if (error) throw error;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId);
  if (error) throw error;
}

export interface UpdateExpenseInput {
  nom: string;
  montant: number;
  dateEcheance: string;
}

export async function updateExpense(expenseId: string, input: UpdateExpenseInput) {
  const { error } = await supabase
    .from("expenses")
    .update({ nom: input.nom, montant: input.montant, date_echeance: input.dateEcheance })
    .eq("id", expenseId);

  if (error) throw error;
}
