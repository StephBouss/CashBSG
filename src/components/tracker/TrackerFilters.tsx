import { Icon } from "@/components/ui/Icon";
import type { Category } from "@/types/budget";

export type PeriodFilter = "tout" | "aujourdhui" | "semaine" | "mois";

interface TrackerFiltersProps {
  categories: Category[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  periodFilter: PeriodFilter;
  onPeriodFilterChange: (value: PeriodFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const inputStyle = {
  background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)",
  border: "1px solid rgba(0,0,0,0.08)",
};

export function TrackerFilters({
  categories,
  categoryFilter,
  onCategoryFilterChange,
  periodFilter,
  onPeriodFilterChange,
  search,
  onSearchChange,
}: TrackerFiltersProps) {
  const depenseCategories = categories.filter((c) => c.type === "depense");

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm flex-1 min-w-0"
        style={inputStyle}
      >
        <Icon i="search" size={14} className="flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une dépense…"
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
        />
      </div>

      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm sm:w-52"
        style={inputStyle}
      >
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-foreground min-w-0"
        >
          <option value="">Toutes catégories</option>
          {depenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <Icon i="chevron-down" size={14} className="flex-shrink-0" />
      </div>

      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm sm:w-52"
        style={inputStyle}
      >
        <select
          value={periodFilter}
          onChange={(e) => onPeriodFilterChange(e.target.value as PeriodFilter)}
          className="flex-1 bg-transparent outline-none text-foreground min-w-0"
        >
          <option value="tout">Toute période</option>
          <option value="aujourdhui">Aujourd&apos;hui</option>
          <option value="semaine">Cette semaine</option>
          <option value="mois">Ce mois-ci</option>
        </select>
        <Icon i="calendar" size={14} className="flex-shrink-0" />
      </div>
    </div>
  );
}
