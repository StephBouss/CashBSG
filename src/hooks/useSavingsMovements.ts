import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SavingsMovement } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useSavingsMovements(accountId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["savings-movements", accountId];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!accountId,
    queryFn: async (): Promise<SavingsMovement[]> => {
      const { data, error } = await supabase
        .from("savings_movements")
        .select("id, user_id, account_id, montant, date")
        .eq("account_id", accountId)
        .order("date");

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        accountId: row.account_id,
        montant: row.montant,
        date: row.date,
      }));
    },
  });

  useEffect(() => {
    if (!user || !accountId) return;

    const channel = supabase
      .channel(`savings-movements-${accountId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings_movements", filter: `account_id=eq.${accountId}` },
        () => queryClient.invalidateQueries({ queryKey: ["savings-movements", accountId] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, accountId, queryClient]);

  return query;
}

export async function createSavingsMovement(
  userId: string,
  accountId: string,
  montant: number,
  date: string
) {
  const { error } = await supabase
    .from("savings_movements")
    .insert({ user_id: userId, account_id: accountId, montant, date });

  if (error) throw error;
}
