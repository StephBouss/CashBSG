import { useQuery } from "@tanstack/react-query";
import { formatISO, startOfMonth, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { monthRange } from "@/lib/month";

export interface MonthlyTrendPoint {
  label: string;
  monthStart: string;
  totalRevenus: number;
  totalDepenses: number;
  dime: number;
  solde: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/** Revenus/dépenses/solde des `months` derniers mois (mois courant inclus),
 * calculés à partir d'une seule requête par table sur toute la plage. */
export function useMonthlyTrend(months = 6) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const pourcentageDime = profile?.dimeActive ? profile.pourcentageDime : 0;

  const rangeStart = formatISO(startOfMonth(subMonths(new Date(), months - 1)), {
    representation: "date",
  });
  const rangeEnd = monthRange().end;

  return useQuery({
    queryKey: ["monthly-trend", user?.id, rangeStart, rangeEnd, pourcentageDime],
    enabled: !!user,
    queryFn: async (): Promise<MonthlyTrendPoint[]> => {
      const [{ data: incomes, error: incomesError }, { data: expenses, error: expensesError }] =
        await Promise.all([
          supabase
            .from("incomes")
            .select("montant, date")
            .gte("date", rangeStart)
            .lte("date", rangeEnd),
          supabase
            .from("expenses")
            .select("montant, date_echeance, statut")
            .gte("date_echeance", rangeStart)
            .lte("date_echeance", rangeEnd),
        ]);

      if (incomesError) throw incomesError;
      if (expensesError) throw expensesError;

      const points: MonthlyTrendPoint[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const reference = subMonths(new Date(), i);
        const { start, end } = monthRange(reference);

        const monthRevenus = (incomes ?? [])
          .filter((row) => row.date >= start && row.date <= end)
          .reduce((sum, row) => sum + Number(row.montant), 0);

        const monthDepenses = (expenses ?? [])
          .filter(
            (row) => row.date_echeance >= start && row.date_echeance <= end && row.statut === "paye"
          )
          .reduce((sum, row) => sum + Number(row.montant), 0);

        const dime = monthRevenus * (pourcentageDime / 100);

        points.push({
          label: monthLabelFormatter.format(reference),
          monthStart: start,
          totalRevenus: monthRevenus,
          totalDepenses: monthDepenses,
          dime,
          solde: monthRevenus - monthDepenses - dime,
        });
      }

      return points;
    },
  });
}
