import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { SavingsAccount, SavingsAccountType, SavingsContributionMode } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useSavingsAccounts(type: SavingsAccountType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["savings-accounts", user?.id, type];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<SavingsAccount[]> => {
      const { data, error } = await supabase
        .from("savings_accounts")
        .select("id, user_id, type, nom, mode, montant_fixe, pourcentage, category_id, created_at")
        .eq("type", type)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        nom: row.nom,
        mode: row.mode,
        montantFixe: row.montant_fixe,
        pourcentage: row.pourcentage,
        categoryId: row.category_id,
        createdAt: row.created_at,
      }));
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`savings-accounts-${type}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings_accounts", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["savings-accounts", user.id, type] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, type]);

  return query;
}

export interface CreateSavingsAccountInput {
  nom: string;
  mode: SavingsContributionMode;
  montantFixe?: number | null;
  pourcentage?: number | null;
  categoryId?: string | null;
}

export async function createSavingsAccount(
  userId: string,
  type: SavingsAccountType,
  input: CreateSavingsAccountInput
) {
  const { error } = await supabase.from("savings_accounts").insert({
    user_id: userId,
    type,
    nom: input.nom,
    mode: input.mode,
    montant_fixe: input.mode === "montant" ? input.montantFixe ?? null : null,
    pourcentage: input.mode === "pourcentage" ? input.pourcentage ?? null : null,
    category_id: input.mode === "pourcentage" ? input.categoryId ?? null : null,
  });

  if (error) throw error;
}

export async function deleteSavingsAccount(accountId: string) {
  const { error } = await supabase.from("savings_accounts").delete().eq("id", accountId);
  if (error) throw error;
}
