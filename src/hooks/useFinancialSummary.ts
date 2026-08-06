import { useQuery } from "@tanstack/react-query";
import { formatISO, startOfMonth, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { monthRange } from "@/lib/month";
import { VOLATILE_QUERY_OPTIONS } from "@/lib/queryConfig";

export interface FinancialSummary {
  revenusEncaisses: number;
  depensesPayees: number;
  chargesAVenir: number;
  chargesEnRetard: number;
  chargesRestantes: number;
  fluxEpargneNet: number;
  soldeLiquide: number;
  resteAVivrePrevisionnel: number;
  epargnePeriode: number;
  epargneCumulee: number;
}

/** Valeur affichée pendant le chargement initial de la requête. */
export const ZERO_FINANCIAL_SUMMARY: FinancialSummary = {
  revenusEncaisses: 0,
  depensesPayees: 0,
  chargesAVenir: 0,
  chargesEnRetard: 0,
  chargesRestantes: 0,
  fluxEpargneNet: 0,
  soldeLiquide: 0,
  resteAVivrePrevisionnel: 0,
  epargnePeriode: 0,
  epargneCumulee: 0,
};

interface FinancialSummaryRow {
  revenus_encaisses: number;
  depenses_payees: number;
  charges_a_venir: number;
  charges_en_retard: number;
  charges_restantes: number;
  flux_epargne_net: number;
  solde_liquide: number;
  reste_a_vivre_previsionnel: number;
  epargne_periode: number;
  epargne_cumulee: number;
}

/**
 * Vérité financière canonique (P0.1→P0.4/P0.6) : un seul appel RPC
 * (financial_summary, supabase/migrations/20260806090000_...) consommé
 * identiquement par le Dashboard et les Rapports. L'edge function
 * ai-advisor appelle la même fonction côté serveur — aucune formule
 * financière n'est dupliquée en TypeScript.
 *
 * `months` étend la fenêtre en arrière (1 = le mois de `reference` seul,
 * 3/12 = trimestre/année glissants se terminant à `reference`) — même
 * convention que useMonthlyTrend/useCategoryTotalsRange.
 */
export function useFinancialSummary(reference: Date = new Date(), months = 1) {
  const { user } = useAuth();
  const start =
    months <= 1
      ? monthRange(reference).start
      : formatISO(startOfMonth(subMonths(reference, months - 1)), { representation: "date" });
  const { end } = monthRange(reference);

  return useQuery({
    queryKey: ["financial-summary", user?.id, start, end],
    enabled: !!user,
    ...VOLATILE_QUERY_OPTIONS,
    queryFn: async (): Promise<FinancialSummary> => {
      const { data, error } = await supabase
        .rpc("financial_summary", { p_start: start, p_end: end })
        .single<FinancialSummaryRow>();

      if (error) throw error;

      return {
        revenusEncaisses: Number(data.revenus_encaisses),
        depensesPayees: Number(data.depenses_payees),
        chargesAVenir: Number(data.charges_a_venir),
        chargesEnRetard: Number(data.charges_en_retard),
        chargesRestantes: Number(data.charges_restantes),
        fluxEpargneNet: Number(data.flux_epargne_net),
        soldeLiquide: Number(data.solde_liquide),
        resteAVivrePrevisionnel: Number(data.reste_a_vivre_previsionnel),
        epargnePeriode: Number(data.epargne_periode),
        epargneCumulee: Number(data.epargne_cumulee),
      };
    },
  });
}
