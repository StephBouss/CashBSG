import { useMemo, useState } from "react";
import { isSameDay, isSameMonth, isSameYear, isWithinInterval, endOfWeek, startOfWeek } from "date-fns";
import { useTrackedExpenses } from "@/hooks/useExpenseTracker";
import { useCategories } from "@/hooks/useCategories";
import { useProfile } from "@/hooks/useProfile";
import { effectivePlan, TRACKER_ENTRY_LIMIT } from "@/lib/plan";
import { TrackerForm } from "@/components/tracker/TrackerForm";
import { TrackerSummary } from "@/components/tracker/TrackerSummary";
import { TrackerFilters, type PeriodFilter } from "@/components/tracker/TrackerFilters";
import { TrackerList } from "@/components/tracker/TrackerList";

export default function TrackerPage() {
  const { data: expenses = [], refetch } = useTrackedExpenses();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();

  const plan = profile ? effectivePlan(profile.plan, profile.planExpiresAt) : "free";
  const trackerLimit = TRACKER_ENTRY_LIMIT[plan];
  const limitReached = trackerLimit !== null && expenses.length >= trackerLimit;

  const [categoryFilter, setCategoryFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("tout");
  const [search, setSearch] = useState("");

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const weekInterval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    const searchLower = search.trim().toLowerCase();

    return expenses.filter((e) => {
      if (categoryFilter && e.categoryId !== categoryFilter) return false;

      if (periodFilter !== "tout") {
        const createdAt = new Date(e.createdAt);
        if (periodFilter === "aujourdhui" && !isSameDay(createdAt, now)) return false;
        if (periodFilter === "semaine" && !isWithinInterval(createdAt, weekInterval)) return false;
        if (periodFilter === "mois" && !(isSameYear(createdAt, now) && isSameMonth(createdAt, now))) return false;
      }

      if (searchLower && !e.nom.toLowerCase().includes(searchLower)) return false;

      return true;
    });
  }, [expenses, categoryFilter, periodFilter, search]);

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Tracker des dépenses</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Enregistrez vos dépenses en un instant, date et heure automatiques
        </p>
      </div>

      <TrackerForm
        categories={categories}
        onCreated={() => refetch()}
        limitReached={limitReached}
        limit={trackerLimit}
      />

      <TrackerSummary expenses={expenses} categories={categories} />

      <TrackerFilters
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        periodFilter={periodFilter}
        onPeriodFilterChange={setPeriodFilter}
        search={search}
        onSearchChange={setSearch}
      />

      <TrackerList expenses={filteredExpenses} categories={categories} onChanged={() => refetch()} />
    </div>
  );
}
