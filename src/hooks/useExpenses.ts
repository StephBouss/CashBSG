import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { monthRange } from "@/lib/month";
import type { Expense } from "@/types/budget";
import { useAuth } from "@/hooks/useAuth";
import { LIVE_QUERY_OPTIONS } from "@/lib/queryConfig";

export interface UseExpensesOptions {
  /** Désactivez pour les appels secondaires (ex: mois de comparaison) afin
   * d'éviter deux abonnements realtime simultanés sur le même canal. */
  realtime?: boolean;
  /**
   * P0.1 — `source` est une provenance de saisie (facture planifiée vs
   * pointage Tracker), pas un critère d'inclusion dans les totaux : par
   * défaut, on renvoie TOUTES les dépenses du mois, quelle que soit leur
   * provenance (nécessaire pour que Dashboard/Rapports/IA partent de la
   * même vérité financière). Seule la page Dépenses (échéances planifiées)
   * a une raison fonctionnelle de restreindre explicitement à `"facture"`.
   */
  source?: "facture" | "tracker";
  /**
   * P0.6 — un filtre borné au mois courant fait disparaître une facture
   * impayée d'un mois précédent dès que le calendrier tourne. Quand true,
   * la requête inclut aussi tout impayé antérieur à `start` (backlog non
   * soldé), en plus des échéances du mois — sans borne basse, comme
   * financial_summary(). Pertinent seulement pour une vue "mois courant" ;
   * ne l'activez pas pour un mois de comparaison passé.
   */
  includeBacklog?: boolean;
}

export function useExpenses(month: Date = new Date(), options: UseExpensesOptions = {}) {
  const { realtime = true, source, includeBacklog = false } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { start, end } = monthRange(month);
  const queryKey = ["expenses", user?.id, start, source ?? "all", includeBacklog];

  const query = useQuery({
    queryKey,
    enabled: !!user,
    ...LIVE_QUERY_OPTIONS,
    queryFn: async (): Promise<Expense[]> => {
      let request = supabase
        .from("expenses")
        .select(
          "id, user_id, category_id, nom, montant, date_echeance, priorite, statut, date_paiement"
        )
        .lte("date_echeance", end);

      request = includeBacklog
        ? request.or(`date_echeance.gte.${start},statut.neq.paye`)
        : request.gte("date_echeance", start);

      if (source) {
        request = request.eq("source", source);
      }

      const { data, error } = await request.order("date_echeance");

      if (error) throw error;

      return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        nom: row.nom,
        montant: row.montant,
        dateEcheance: row.date_echeance,
        priorite: row.priorite,
        statut: row.statut,
        datePaiement: row.date_paiement,
      }));
    },
  });

  useEffect(() => {
    if (!user || !realtime) return;

    const channel = supabase
      .channel(`expenses-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["expenses", user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, realtime]);

  return query;
}

export async function markExpensePaid(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .update({ statut: "paye", date_paiement: new Date().toISOString() })
    .eq("id", expenseId);

  if (error) throw error;
}

export interface CreateExpenseInput {
  nom: string;
  montant: number;
  categoryId?: string | null;
  dateEcheance: string;
  priorite?: string | null;
}

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    nom: input.nom,
    montant: input.montant,
    category_id: input.categoryId || null,
    date_echeance: input.dateEcheance,
    priorite: input.priorite || null,
  });

  if (error) throw error;
}

export async function deleteExpense(expenseId: string) {
  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", expenseId);
  if (error) throw error;
}

export interface UpdateExpenseInput {
  nom: string;
  montant: number;
  dateEcheance: string;
}

export async function updateExpense(expenseId: string, input: UpdateExpenseInput) {
  const { error } = await supabase
    .from("expenses")
    .update({ nom: input.nom, montant: input.montant, date_echeance: input.dateEcheance })
    .eq("id", expenseId);

  if (error) throw error;
}
