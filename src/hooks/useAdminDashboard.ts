import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LIVE_QUERY_OPTIONS } from "@/lib/queryConfig";

export type AdminPlan = "free" | "essentiel" | "pro" | "business";
export type AdminStatus = "actif" | "inactif";

export interface AdminUserRow {
  id: string;
  nom: string | null;
  email: string | null;
  pays: string | null;
  devise: string;
  plan: AdminPlan;
  isAdmin: boolean;
  status: AdminStatus;
  createdAt: string;
  lastSignInAt: string | null;
  revenusMois: number;
  depensesMois: number;
  messagesIaMois: number;
  tokensIaTotal: number;
  objectifs: number;
  objectifsAtteints: number;
}

export interface AdminGoalRow {
  id: string;
  userId: string;
  userNom: string | null;
  userEmail: string | null;
  label: string;
  icone: string;
  montantCible: number;
  montantEpargne: number;
  dateCible: string | null;
  atteint: boolean;
}

export interface AdminDashboardData {
  kpis: {
    totalComptes: number;
    totalRevenusMois: number;
    totalDepensesMois: number;
    totalMessagesIaMois: number;
    totalTokensIa: number;
    totalObjectifs: number;
    objectifsAtteints: number;
    activeCount: number;
    inactiveCount: number;
  };
  users: AdminUserRow[];
  recentSignups: AdminUserRow[];
  deviseBreakdown: { devise: string; count: number }[];
  planBreakdown: { plan: AdminPlan; count: number }[];
  goalsDetail: AdminGoalRow[];
}

export function useAdminDashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["admin-dashboard", user?.id],
    enabled: !!user && !!profile?.isAdmin,
    // Pas d'abonnement realtime (agrégation coûteuse côté Edge Function,
    // cf. C7.7) : on réutilise le palier LIVE pour éviter de la relancer à
    // chaque focus d'onglet, la fraîcheur à la minute près n'étant pas
    // critique pour des KPIs administrateur.
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<AdminDashboardData> => {
      const { data, error } = await supabase.functions.invoke<AdminDashboardData>("admin-dashboard");
      if (error) throw error;
      if (!data) throw new Error("Réponse vide du tableau de bord administrateur.");
      return data;
    },
  });
}
