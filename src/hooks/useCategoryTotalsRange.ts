import { useQuery } from "@tanstack/react-query";
import { formatISO, startOfMonth, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { expensesByCategory } from "@/lib/expensesByCategory";
import { monthRange } from "@/lib/month";
import type { Expense } from "@/types/budget";

/** Totaux de dépenses par catégorie sur les `months` derniers mois. */
export function useCategoryTotalsRange(months = 1) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();

  const rangeStart = formatISO(startOfMonth(subMonths(new Date(), months - 1)), {
    representation: "date",
  });
  const rangeEnd = monthRange().end;

  const query = useQuery({
    queryKey: ["category-totals-range", user?.id, rangeStart, rangeEnd],
    enabled: !!user,
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, user_id, category_id, nom, montant, date_echeance, priorite, statut, date_paiement")
        .gte("date_echeance", rangeStart)
        .lte("date_echeance", rangeEnd);

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

  const totals = expensesByCategory(query.data ?? [], categories);

  return { ...query, totals };
}
