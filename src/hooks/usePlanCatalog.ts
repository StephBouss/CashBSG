import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { REFERENCE_QUERY_OPTIONS } from "@/lib/queryConfig";
import type { Plan } from "@/types/budget";

export interface PlanCatalogEntry {
  plan: Plan;
  sortOrder: number;
  label: string;
  priceDisplay: string;
  aiQuota: number;
  trackerLimit: number | null;
  savingsEpargneLimit: number | null;
  savingsInvestissementLimit: number | null;
  historyWindowMonths: number | null;
  commercialisable: boolean;
}

interface PlanCatalogRow {
  plan: Plan;
  sort_order: number;
  label: string;
  price_display: string;
  ai_quota: number;
  tracker_limit: number | null;
  savings_epargne_limit: number | null;
  savings_investissement_limit: number | null;
  history_window_months: number | null;
  commercialisable: boolean;
}

/** P2.3/P1.1 — catalogue serveur des plans (supabase/migrations/20260806120000_plan_catalog.sql).
 * Seul consommateur pour l'instant : filtrer les offres réellement
 * commercialisables (masquer Business sans le supprimer, cf. P2.3) — les
 * quotas/prix affichés ailleurs restent dérivés des constantes statiques de
 * src/lib/plan.ts (synchronisation vérifiée par un test d'intégration dédié). */
export function usePlanCatalog() {
  return useQuery({
    queryKey: ["plan-catalog"],
    ...REFERENCE_QUERY_OPTIONS,
    queryFn: async (): Promise<PlanCatalogEntry[]> => {
      const { data, error } = await supabase.rpc("get_plan_catalog");
      if (error) throw error;

      return (data as PlanCatalogRow[]).map((row) => ({
        plan: row.plan,
        sortOrder: row.sort_order,
        label: row.label,
        priceDisplay: row.price_display,
        aiQuota: row.ai_quota,
        trackerLimit: row.tracker_limit,
        savingsEpargneLimit: row.savings_epargne_limit,
        savingsInvestissementLimit: row.savings_investissement_limit,
        historyWindowMonths: row.history_window_months,
        commercialisable: row.commercialisable,
      }));
    },
  });
}
