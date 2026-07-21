import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Category } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

export function useCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["categories", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, user_id, nom, type, couleur, icone")
        .order("nom");

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        nom: row.nom,
        type: row.type,
        couleur: row.couleur,
        icone: row.icone,
      }));
    },
  });
}
