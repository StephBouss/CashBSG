import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Goal } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";
import { LIVE_QUERY_OPTIONS } from "@/lib/queryConfig";

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["goals", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select(
          "id, user_id, label, icone, couleur, montant_cible, montant_epargne, date_cible, contribution_mensuelle"
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        label: row.label,
        icone: row.icone,
        couleur: row.couleur,
        montantCible: row.montant_cible,
        montantEpargne: row.montant_epargne,
        dateCible: row.date_cible,
        contributionMensuelle: row.contribution_mensuelle,
      }));
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`goals-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["goals", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export interface CreateGoalInput {
  label: string;
  icone: string;
  couleur: string;
  montantCible: number;
  montantEpargne?: number;
  dateCible?: string | null;
  contributionMensuelle?: number;
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const { error } = await supabase.from("goals").insert({
    user_id: userId,
    label: input.label,
    icone: input.icone,
    couleur: input.couleur,
    montant_cible: input.montantCible,
    montant_epargne: input.montantEpargne ?? 0,
    date_cible: input.dateCible || null,
    contribution_mensuelle: input.contributionMensuelle ?? 0,
  });

  if (error) throw error;
}

export async function updateGoal(goalId: string, input: CreateGoalInput) {
  const { error } = await supabase
    .from("goals")
    .update({
      label: input.label,
      icone: input.icone,
      couleur: input.couleur,
      montant_cible: input.montantCible,
      montant_epargne: input.montantEpargne ?? 0,
      date_cible: input.dateCible || null,
      contribution_mensuelle: input.contributionMensuelle ?? 0,
    })
    .eq("id", goalId);

  if (error) throw error;
}

export async function deleteGoal(goalId: string) {
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) throw error;
}

export async function addGoalContribution(goal: Goal, amount: number) {
  const { error } = await supabase.rpc("increment_goal_epargne", {
    p_goal_id: goal.id,
    p_amount: amount,
  });

  if (error) throw error;
}
