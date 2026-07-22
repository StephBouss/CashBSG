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
        .select("id, nom, devise, langue")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        nom: data.nom,
        devise: data.devise,
        langue: data.langue,
      };
    },
  });
}

export async function updateProfileName(userId: string, nom: string) {
  const { error } = await supabase.from("profiles").update({ nom }).eq("id", userId);
  if (error) throw error;
}
