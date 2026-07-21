import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { monthRange } from "@/lib/month";
import type { Tithe } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useTithe(month: Date = new Date()) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { start } = monthRange(month);
  const queryKey = ["tithe", user?.id, start];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<Tithe | null> => {
      const { data, error } = await supabase
        .from("tithes")
        .select("id, user_id, revenu_brut, pourcentage, montant, statut, date")
        .eq("date", start)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        revenuBrut: data.revenu_brut,
        pourcentage: data.pourcentage,
        montant: data.montant,
        statut: data.statut,
        date: data.date,
      };
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`tithes-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tithes", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["tithe", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export async function markTithePaid(titheId: string) {
  const { error } = await supabase.from("tithes").update({ statut: "paye" }).eq("id", titheId);
  if (error) throw error;
}
