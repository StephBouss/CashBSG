import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { monthRange } from "@/lib/month";
import { fetchDimeMontant } from "@/lib/dime";

/** Montant total versé sur les comptes épargne nommés "Dîme" pour le mois donné. */
export function useDimeAmount(month: Date = new Date()) {
  const { user } = useAuth();
  const { start, end } = monthRange(month);

  return useQuery({
    queryKey: ["dime-amount", user?.id, start],
    enabled: !!user,
    queryFn: () => fetchDimeMontant(start, end),
  });
}
