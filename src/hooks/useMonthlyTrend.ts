import { useQuery } from "@tanstack/react-query";
import { formatISO, startOfMonth, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { monthRange } from "@/lib/month";
import { isDimeAccountName } from "@/lib/dime";

export interface MonthlyTrendPoint {
  label: string;
  monthStart: string;
  totalRevenus: number;
  totalDepenses: number;
  dime: number;
  solde: number;
}

const monthLabelFormatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

/** Revenus/dépenses/dîme/solde des `months` derniers mois (mois courant inclus),
 * calculés à partir d'une seule requête par table sur toute la plage. La dîme
 * correspond aux mouvements réels des comptes épargne nommés "Dîme". */
export function useMonthlyTrend(months = 6) {
  const { user } = useAuth();

  const rangeStart = formatISO(startOfMonth(subMonths(new Date(), months - 1)), {
    representation: "date",
  });
  const rangeEnd = monthRange().end;

  return useQuery({
    queryKey: ["monthly-trend", user?.id, rangeStart, rangeEnd],
    enabled: !!user,
    queryFn: async (): Promise<MonthlyTrendPoint[]> => {
      const [
        { data: incomes, error: incomesError },
        { data: expenses, error: expensesError },
        { data: savingsAccounts, error: accountsError },
      ] = await Promise.all([
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
        supabase.from("savings_accounts").select("id, nom"),
      ]);

      if (incomesError) throw incomesError;
      if (expensesError) throw expensesError;
      if (accountsError) throw accountsError;

      const dimeAccountIds = (savingsAccounts ?? [])
        .filter((a) => isDimeAccountName(a.nom))
        .map((a) => a.id);

      let dimeMovements: { montant: number; date: string }[] = [];
      if (dimeAccountIds.length > 0) {
        const { data, error } = await supabase
          .from("savings_movements")
          .select("montant, date")
          .in("account_id", dimeAccountIds)
          .gte("date", rangeStart)
          .lte("date", rangeEnd);

        if (error) throw error;
        dimeMovements = data ?? [];
      }

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

        const dime = dimeMovements
          .filter((row) => row.date >= start && row.date <= end)
          .reduce((sum, row) => sum + Number(row.montant), 0);

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
