import { GlassCard } from "@/components/ui/GlassCard";
import { IncomeForm } from "@/components/incomes/IncomeForm";
import { useIncomes } from "@/hooks/useIncomes";
import { useCategories } from "@/hooks/useCategories";
import { formatDate, formatMontant } from "@/lib/formatters";

export default function IncomesPage() {
  const { data: incomes = [], refetch } = useIncomes();
  const { data: categories = [] } = useCategories();
  const revenuCategories = categories.filter((category) => category.type === "revenu");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-headings font-semibold text-foreground">Revenus</h1>
      <GlassCard>
        <IncomeForm categories={revenuCategories} onCreated={() => refetch()} />
      </GlassCard>
      <div className="flex flex-col gap-3">
        {incomes.map((income) => (
          <GlassCard key={income.id} className="flex items-center justify-between py-4">
            <div>
              <div className="font-medium text-foreground">{income.nom}</div>
              <div className="text-sm text-muted-foreground">{formatDate(income.date)}</div>
            </div>
            <div className="font-semibold text-primary">{formatMontant(income.montant)}</div>
          </GlassCard>
        ))}
        {incomes.length === 0 && <p className="text-muted-foreground">Aucun revenu ce mois-ci.</p>}
      </div>
    </div>
  );
}
