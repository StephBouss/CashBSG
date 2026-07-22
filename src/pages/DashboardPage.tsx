import { useMemo, useState } from "react";
import { useIncomes } from "@/hooks/useIncomes";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { useDimeAmount } from "@/hooks/useDimeAmount";
import { useGoals } from "@/hooks/useGoals";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { computeMonthFinancials } from "@/lib/calculations";
import { expensesByCategory } from "@/lib/expensesByCategory";
import { subMonths } from "date-fns";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { PieChart } from "@/components/dashboard/PieChart";
import { LineChart } from "@/components/dashboard/LineChart";
import { BarChart } from "@/components/dashboard/BarChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AIAdvisorWidget } from "@/components/dashboard/AIAdvisorWidget";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { HealthScore } from "@/components/dashboard/HealthScore";
import { AddTransactionModal } from "@/components/dashboard/AddTransactionModal";
import { GlassCard } from "@/components/ui/GlassCard";

const monthTitleFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: incomes = [], refetch: refetchIncomes } = useIncomes();
  const { data: expenses = [], refetch: refetchExpenses } = useExpenses();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useGoals();
  const { data: trend = [] } = useMonthlyTrend(6);
  const { data: dimeMontant = 0 } = useDimeAmount();

  const previousMonth = subMonths(new Date(), 1);
  const { data: prevIncomes = [] } = useIncomes(previousMonth, { realtime: false });
  const { data: prevExpenses = [] } = useExpenses(previousMonth, { realtime: false });
  const { data: prevDimeMontant = 0 } = useDimeAmount(previousMonth);

  const financials = useMemo(
    () => computeMonthFinancials(incomes, expenses, dimeMontant),
    [incomes, expenses, dimeMontant]
  );

  const previousFinancials = useMemo(
    () => computeMonthFinancials(prevIncomes, prevExpenses, prevDimeMontant),
    [prevIncomes, prevExpenses, prevDimeMontant]
  );

  const categoryTotals = useMemo(() => expensesByCategory(expenses, categories, 6), [expenses, categories]);
  const totalDepenses = useMemo(() => expenses.reduce((s, e) => s + e.montant, 0), [expenses]);

  const refetchAll = () => {
    refetchIncomes();
    refetchExpenses();
  };

  return (
    <div className="flex flex-col min-w-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headings font-semibold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {monthTitleFormatter.format(new Date())} · Aperçu général
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
          }}
        >
          + Ajouter
        </button>
      </div>

      {/* KPI Cards */}
      <SummaryCards financials={financials} previousFinancials={previousFinancials} />

      {/* Charts row */}
      <div className="flex gap-5 mt-6">
        <GlassCard className="flex-1">
          <div className="flex gap-8">
            <div className="flex-shrink-0" style={{ width: "260px" }}>
              <PieChart data={categoryTotals} total={totalDepenses} />
            </div>
            <div className="flex-1 min-w-0">
              <LineChart points={trend} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="flex gap-5 mt-5">
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <GlassCard>
            <BarChart data={categoryTotals} />
          </GlassCard>
          <GlassCard>
            <RecentTransactions incomes={incomes} expenses={expenses} categories={categories} />
          </GlassCard>
        </div>

        <div className="flex flex-col gap-5" style={{ width: "280px" }}>
          <GlassCard className="p-5">
            <HealthScore financials={financials} />
          </GlassCard>
          <GlassCard className="p-5">
            <GoalsWidget goals={goals} />
          </GlassCard>
          <AIAdvisorWidget
            expenses={expenses}
            categoryTotals={categoryTotals}
            totalDepenses={totalDepenses}
            goals={goals}
          />
        </div>
      </div>

      {modalOpen && (
        <AddTransactionModal onClose={() => setModalOpen(false)} onCreated={refetchAll} />
      )}
    </div>
  );
}
