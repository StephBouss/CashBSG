import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const EXPIRY_MILESTONES = [15, 10, 5, 0] as const;
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

function daysUntil(dateISO: string): number {
  const now = new Date();
  const target = new Date(dateISO);
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startOfTarget = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  return Math.round((startOfTarget - startOfToday) / (24 * 60 * 60 * 1000));
}

export function useNotifications() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const queryKey = ["notifications", user?.id];
  const generatedFor = useRef<string | null>(null);

  const query = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.message,
        read: row.read,
        createdAt: row.created_at,
      }));
    },
  });

  // Rappels d'échéance d'abonnement (15/10/5/0 jours avant expiration). Il
  // n'y a pas de tâche planifiée côté serveur : c'est la connexion de
  // l'utilisateur qui déclenche la vérification, une fois par session. La
  // clé de dédoublonnage (user_id, dedupe_key) empêche tout doublon même si
  // la vérification est relancée plusieurs fois.
  useEffect(() => {
    if (!user || !profile) return;
    if (profile.plan === "free" || !profile.planExpiresAt) return;
    if (generatedFor.current === profile.planExpiresAt) return;
    generatedFor.current = profile.planExpiresAt;

    const expiresAt = profile.planExpiresAt;
    const remaining = daysUntil(expiresAt);
    const dueMilestones = EXPIRY_MILESTONES.filter((m) => remaining <= m);
    if (dueMilestones.length === 0) return;

    const formattedDate = dateFormatter.format(new Date(expiresAt));
    const rows = dueMilestones.map((milestone) => ({
      user_id: user.id,
      type: "plan_expiry",
      title: milestone === 0 ? "Votre abonnement expire aujourd'hui" : `Votre abonnement expire dans ${milestone} jours`,
      message:
        milestone === 0
          ? "Renouvelez votre offre dès maintenant pour continuer à en profiter sans interruption."
          : `Pensez à renouveler votre offre avant le ${formattedDate}.`,
      dedupe_key: `plan_expiry_${expiresAt}_${milestone}`,
    }));

    supabase
      .from("notifications")
      .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .then(({ error }) => {
        if (!error) queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      });
  }, [user, profile, queryClient]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}
