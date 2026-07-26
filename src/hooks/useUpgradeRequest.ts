import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Plan } from "@/types/budget";

interface UpgradeRequest {
  id: string;
  requested_plan: Plan;
  status: string;
  created_at: string;
}

export function usePendingUpgradeRequest() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["upgrade_requests", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UpgradeRequest | null> => {
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select("id, requested_plan, status, created_at")
        .eq("status", "en_attente")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUpgradeRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ currentPlan, requestedPlan }: { currentPlan: Plan; requestedPlan: Plan }) => {
      if (!user) throw new Error("Non authentifié.");
      const { error } = await supabase.from("upgrade_requests").insert({
        user_id: user.id,
        current_plan: currentPlan,
        requested_plan: requestedPlan,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upgrade_requests", user?.id] });
    },
  });
}
