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
  dateCible?: string | null;
  contributionMensuelle?: number;
}

/**
 * Crée l'objectif à montant_epargne = 0, puis enregistre le "déjà épargné"
 * comme une contribution tracée (via contribute_to_goal) plutôt que comme
 * une valeur d'insertion directe — montant_epargne doit toujours être
 * dérivable de goal_contributions (P0.5).
 */
export async function createGoal(userId: string, input: CreateGoalInput, soldeDepart?: number) {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      label: input.label,
      icone: input.icone,
      couleur: input.couleur,
      montant_cible: input.montantCible,
      date_cible: input.dateCible || null,
      contribution_mensuelle: input.contributionMensuelle ?? 0,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (soldeDepart && soldeDepart > 0) {
    await contributeToGoal(data.id, soldeDepart, "Solde de départ");
  }
}

/** montant_epargne n'est plus modifiable ici : voir contributeToGoal(). */
export async function updateGoal(goalId: string, input: CreateGoalInput) {
  const { error } = await supabase
    .from("goals")
    .update({
      label: input.label,
      icone: input.icone,
      couleur: input.couleur,
      montant_cible: input.montantCible,
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

/** Enregistre une contribution réelle et tracée (montant positif ou négatif
 * pour un retrait/correction) via le ledger goal_contributions. */
export async function contributeToGoal(goalId: string, amount: number, note?: string) {
  const { error } = await supabase.rpc("contribute_to_goal", {
    p_goal_id: goalId,
    p_amount: amount,
    p_note: note ?? null,
  });

  if (error) throw error;
}
