import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { monthRange } from "@/lib/month";
import type { Income } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export interface UseIncomesOptions {
  /** Désactivez pour les appels secondaires (ex: mois de comparaison) afin
   * d'éviter deux abonnements realtime simultanés sur le même canal. */
  realtime?: boolean;
}

export function useIncomes(month: Date = new Date(), options: UseIncomesOptions = {}) {
  const { realtime = true } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { start, end } = monthRange(month);
  const queryKey = ["incomes", user?.id, start];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<Income[]> => {
      const { data, error } = await supabase
        .from("incomes")
        .select("id, user_id, category_id, nom, montant, frequence, date")
        .gte("date", start)
        .lte("date", end)
        .order("date");

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        nom: row.nom,
        montant: row.montant,
        frequence: row.frequence,
        date: row.date,
      }));
    },
  });

  useEffect(() => {
    if (!user || !realtime) return;

    const channel = supabase
      .channel(`incomes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incomes", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["incomes", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, realtime]);

  return query;
}

export interface CreateIncomeInput {
  nom: string;
  montant: number;
  categoryId?: string | null;
  date: string;
  frequence?: string | null;
}

export async function createIncome(userId: string, input: CreateIncomeInput) {
  const { error } = await supabase.from("incomes").insert({
    user_id: userId,
    nom: input.nom,
    montant: input.montant,
    category_id: input.categoryId || null,
    date: input.date,
    frequence: input.frequence || null,
  });

  if (error) throw error;
}

export async function deleteIncome(incomeId: string) {
  const { error } = await supabase.from("incomes").delete().eq("id", incomeId);
  if (error) throw error;
}
