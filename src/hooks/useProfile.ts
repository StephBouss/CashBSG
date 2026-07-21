import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, devise, langue, pourcentage_dime, dime_active")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        nom: data.nom,
        devise: data.devise,
        langue: data.langue,
        pourcentageDime: data.pourcentage_dime,
        dimeActive: data.dime_active,
      };
    },
  });
}

export async function updateTithePercentage(userId: string, pourcentageDime: number) {
  const { error } = await supabase
    .from("profiles")
    .update({ pourcentage_dime: pourcentageDime })
    .eq("id", userId);

  if (error) throw error;
}

export async function setTitheActive(userId: string, active: boolean) {
  const { error } = await supabase.from("profiles").update({ dime_active: active }).eq("id", userId);
  if (error) throw error;
}
