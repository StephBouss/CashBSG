import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export interface AdminUserRow {
  id: string;
  nom: string | null;
  email: string | null;
  devise: string;
  isAdmin: boolean;
  createdAt: string;
  revenusMois: number;
  depensesMois: number;
  messagesIaMois: number;
  objectifs: number;
}

export interface AdminDashboardData {
  kpis: {
    totalComptes: number;
    totalRevenusMois: number;
    totalDepensesMois: number;
    totalMessagesIaMois: number;
    totalObjectifs: number;
    objectifsAtteints: number;
  };
  users: AdminUserRow[];
  recentSignups: AdminUserRow[];
  deviseBreakdown: { devise: string; count: number }[];
}

export function useAdminDashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["admin-dashboard", user?.id],
    enabled: !!user && !!profile?.isAdmin,
    queryFn: async (): Promise<AdminDashboardData> => {
      const { data, error } = await supabase.functions.invoke<AdminDashboardData>("admin-dashboard");
      if (error) throw error;
      if (!data) throw new Error("Réponse vide du tableau de bord administrateur.");
      return data;
    },
  });
}
