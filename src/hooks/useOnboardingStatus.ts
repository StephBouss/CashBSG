import { useEffect, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export interface OnboardingStatus {
  hasName: boolean;
  hasWhatsapp: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
  requiredDone: number;
  requiredTotal: number;
  /** Conditionne le déblocage d'Iwadu : nom + un revenu + une dépense. Le
   * numéro WhatsApp reste facultatif et n'entre pas dans ce calcul. */
  isComplete: boolean;
  loading: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  // Suffixe unique par instance : ce hook est monté simultanément par la
  // Sidebar, le widget dashboard et la page Iwadu — sans ça, plusieurs
  // canaux realtime portant le même nom entrent en conflit ("cannot add
  // postgres_changes callbacks after subscribe()").
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");

  const query = useQuery({
    queryKey: ["onboarding-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ count: incomeCount }, { count: expenseCount }] = await Promise.all([
        supabase.from("incomes").select("id", { count: "exact", head: true }),
        supabase.from("expenses").select("id", { count: "exact", head: true }),
      ]);
      return { incomeCount: incomeCount ?? 0, expenseCount: expenseCount ?? 0 };
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`onboarding-${user.id}-${instanceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "incomes", filter: `user_id=eq.${user.id}` }, () =>
        queryClient.invalidateQueries({ queryKey: ["onboarding-counts", user.id] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` }, () =>
        queryClient.invalidateQueries({ queryKey: ["onboarding-counts", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, instanceId]);

  const hasName = !!profile?.nom?.trim();
  const hasWhatsapp = !!profile?.whatsapp?.trim();
  const hasIncome = (query.data?.incomeCount ?? 0) > 0;
  const hasExpense = (query.data?.expenseCount ?? 0) > 0;
  const requiredDone = [hasName, hasIncome, hasExpense].filter(Boolean).length;

  return {
    hasName,
    hasWhatsapp,
    hasIncome,
    hasExpense,
    requiredDone,
    requiredTotal: 3,
    isComplete: requiredDone === 3,
    loading: profileLoading || query.isLoading,
  };
}
