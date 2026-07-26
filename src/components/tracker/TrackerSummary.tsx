import { useMemo } from "react";
import { isSameDay, isSameMonth, isSameYear } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatMontant } from "@/lib/formatters";
import type { Category, TrackedExpense } from "@/types/budget";

interface TrackerSummaryProps {
  expenses: TrackedExpense[];
  categories: Category[];
}

export function TrackerSummary({ expenses, categories }: TrackerSummaryProps) {
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const now = useMemo(() => new Date(), []);

  const totalAujourdhui = useMemo(
    () => expenses.filter((e) => isSameDay(new Date(e.createdAt), now)).reduce((s, e) => s + e.montant, 0),
    [expenses, now]
  );

  const totalMois = useMemo(
    () =>
      expenses
        .filter((e) => isSameYear(new Date(e.createdAt), now) && isSameMonth(new Date(e.createdAt), now))
        .reduce((s, e) => s + e.montant, 0),
    [expenses, now]
  );

  const totalGeneral = useMemo(() => expenses.reduce((s, e) => s + e.montant, 0), [expenses]);

  const parCategorie = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + e.montant);
    }
    return Array.from(map.entries())
      .map(([categoryId, total]) => ({ categoryId, nom: categoryById.get(categoryId)?.nom ?? "Sans catégorie", total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, categoryById]);

  return (
    <div className="flex flex-col gap-5 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
          <p className="text-xl font-semibold text-foreground font-headings mt-1">{formatMontant(totalAujourdhui)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          <p className="text-xl font-semibold font-headings mt-1" style={{ color: "#F59E0B" }}>{formatMontant(totalMois)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Total général</p>
          <p className="text-xl font-semibold font-headings mt-1 text-danger">{formatMontant(totalGeneral)}</p>
        </GlassCard>
      </div>

      {parCategorie.length > 0 && (
        <GlassCard className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Total par catégorie</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {parCategorie.map((c) => (
              <div
                key={c.categoryId}
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="text-sm text-foreground truncate">{c.nom}</span>
                <span className="text-sm font-semibold text-foreground flex-shrink-0 ml-2">{formatMontant(c.total)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
