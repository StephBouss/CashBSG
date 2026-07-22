import { useQuery, useQueryClient } from "@tanstack/react-query";
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
        .select("id, nom, devise, langue, theme, pays, is_admin")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        nom: data.nom,
        devise: data.devise,
        langue: data.langue,
        theme: data.theme,
        pays: data.pays,
        isAdmin: data.is_admin,
      };
    },
  });
}

export async function updateProfileName(userId: string, nom: string) {
  const { error } = await supabase.from("profiles").update({ nom }).eq("id", userId);
  if (error) throw error;
}

export async function updateProfilePreferences(
  userId: string,
  patch: Partial<{ theme: string; langue: string; pays: string; devise: string }>
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export function useUpdateProfilePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return async (patch: Partial<{ theme: string; langue: string; pays: string; devise: string }>) => {
    if (!user) return;
    await updateProfilePreferences(user.id, patch);
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  };
}
