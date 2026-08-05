import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SavingsMovement } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";
import { LIVE_QUERY_OPTIONS } from "@/lib/queryConfig";

export function useSavingsMovements(accountId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["savings-movements", accountId];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!accountId,
    ...LIVE_QUERY_OPTIONS,
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

/** Solde total du compte, calculé côté serveur sur TOUS les mouvements —
 * contrairement à useSavingsMovements, qui applique la fenêtre d'historique
 * par plan (2 mois pour les comptes gratuits) et sous-évaluerait le solde
 * réel d'un compte Free ayant des mouvements plus anciens. */
export function useSavingsAccountBalance(accountId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["savings-account-balance", accountId];

  const query = useQuery({
    queryKey,
    enabled: !!user && !!accountId,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("savings_account_balance", {
        p_account_id: accountId,
      });

      if (error) throw error;

      return Number(data ?? 0);
    },
  });

  useEffect(() => {
    if (!user || !accountId) return;

    const channel = supabase
      .channel(`savings-account-balance-${accountId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings_movements", filter: `account_id=eq.${accountId}` },
        () => queryClient.invalidateQueries({ queryKey: ["savings-account-balance", accountId] })
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
