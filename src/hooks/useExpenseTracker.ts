import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TrackedExpense } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useTrackedExpenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["expense-tracker", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<TrackedExpense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, user_id, nom, category_id, montant, created_at")
        .eq("source", "tracker")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        nom: row.nom,
        categoryId: row.category_id ?? "",
        montant: row.montant,
        createdAt: row.created_at,
      }));
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`expense-tracker-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["expense-tracker", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export interface TrackedExpenseInput {
  nom: string;
  montant: number;
  categoryId: string;
}

export async function createTrackedExpense(userId: string, input: TrackedExpenseInput) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    nom: input.nom,
    montant: input.montant,
    category_id: input.categoryId,
    source: "tracker",
    statut: "paye",
    date_echeance: today,
    date_paiement: today,
  });

  if (error) throw error;
}

export async function updateTrackedExpense(id: string, input: TrackedExpenseInput) {
  const { error } = await supabase
    .from("expenses")
    .update({ nom: input.nom, montant: input.montant, category_id: input.categoryId })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteTrackedExpense(id: string) {
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
