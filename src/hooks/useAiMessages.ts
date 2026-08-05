import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AiMessage } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";
import { LIVE_QUERY_OPTIONS } from "@/lib/queryConfig";

export function useAiMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["ai-messages", user?.id];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<AiMessage[]> => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, user_id, role, content, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
      }));
    },
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`ai-messages-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_messages", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["ai-messages", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export async function sendAdvisorMessage(message: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ reply: string }>("ai-advisor", {
    body: { message },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  if (!data) throw new Error("Réponse vide du conseiller IA.");

  return data.reply;
}
