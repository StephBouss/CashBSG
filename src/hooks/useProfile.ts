import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";

function extractOAuthName(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  if (!meta) return null;
  const fullName = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
  if (fullName?.trim()) return fullName.trim();
  const given = (meta.given_name as string | undefined) ?? "";
  const family = (meta.family_name as string | undefined) ?? "";
  const combined = `${given} ${family}`.trim();
  return combined || null;
}

export function useProfile() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nom, devise, langue, theme, pays, is_admin, plan, plan_expires_at, whatsapp")
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
        plan: data.plan,
        planExpiresAt: data.plan_expires_at,
        whatsapp: data.whatsapp,
      };
    },
  });

  const fetchedNom = query.data?.nom;

  // Un compte connecté via Google n'a pas de nom tant qu'on ne le récupère pas
  // depuis les métadonnées OAuth fournies par Supabase — on le fait une seule
  // fois, dès qu'on détecte un profil sans nom.
  useEffect(() => {
    if (!user || fetchedNom) return;
    const oauthName = extractOAuthName(user);
    if (!oauthName) return;
    updateProfileName(user.id, oauthName).then(() => query.refetch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, fetchedNom]);

  return query;
}

export async function updateProfileName(userId: string, nom: string) {
  const { error } = await supabase.from("profiles").update({ nom }).eq("id", userId);
  if (error) throw error;
}

export async function updateProfileWhatsapp(userId: string, whatsapp: string) {
  const { error } = await supabase.from("profiles").update({ whatsapp: whatsapp || null }).eq("id", userId);
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
