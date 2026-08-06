import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { effectiveExpenseStatus } from "@/lib/expenseStatus";
import type { CategoryTotal } from "@/lib/expensesByCategory";
import type { Expense, Goal } from "@/types/budget";

interface AIAdvisorWidgetProps {
  expenses: Expense[];
  categoryTotals: CategoryTotal[];
  totalDepenses: number;
  goals: Goal[];
}

interface Suggestion {
  icon: string;
  color: string;
  text: string;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function buildSuggestions(
  expenses: Expense[],
  categoryTotals: CategoryTotal[],
  totalDepenses: number,
  goals: Goal[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const late = expenses.filter((e) => effectiveExpenseStatus(e) === "en_retard");
  if (late.length > 0) {
    suggestions.push({
      icon: "alert-triangle",
      color: "#EF4444",
      text: `Vous avez ${late.length} dépense${late.length > 1 ? "s" : ""} en retard à régulariser.`,
    });
  }

  const topCategory = categoryTotals[0];
  if (topCategory && totalDepenses > 0) {
    const pct = Math.round((topCategory.montant / totalDepenses) * 100);
    if (pct >= 25) {
      suggestions.push({
        icon: "piggy-bank",
        color: "#F59E0B",
        text: `${pct}% de vos dépenses ce mois-ci concernent "${topCategory.nom}".`,
      });
    }
  }

  const upcoming = expenses
    .filter((e) => effectiveExpenseStatus(e) === "a_venir")
    .sort((a, b) => (a.dateEcheance < b.dateEcheance ? -1 : 1))[0];
  if (upcoming) {
    const days = daysUntil(upcoming.dateEcheance);
    suggestions.push({
      icon: "calendar-clock",
      color: "#6366F1",
      text: `Prochain paiement : ${upcoming.nom} dans ${days} jour${days > 1 ? "s" : ""}.`,
    });
  }

  const closestGoal = [...goals]
    .filter((g) => g.contributionMensuelle > 0 && g.montantEpargne < g.montantCible)
    .sort(
      (a, b) =>
        (a.montantCible - a.montantEpargne) / a.contributionMensuelle -
        (b.montantCible - b.montantEpargne) / b.contributionMensuelle
    )[0];
  if (closestGoal) {
    const months = Math.ceil(
      (closestGoal.montantCible - closestGoal.montantEpargne) / closestGoal.contributionMensuelle
    );
    suggestions.push({
      icon: "target",
      color: "var(--color-secondary)",
      text: `Votre objectif "${closestGoal.label}" sera atteint dans ~${months} mois au rythme actuel.`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      icon: "sparkles",
      color: "var(--color-primary)",
      text: "Tout est sous contrôle ce mois-ci. Ajoutez un objectif pour des conseils personnalisés.",
    });
  }

  return suggestions.slice(0, 4);
}

export function AIAdvisorWidget({ expenses, categoryTotals, totalDepenses, goals }: AIAdvisorWidgetProps) {
  const suggestions = buildSuggestions(expenses, categoryTotals, totalDepenses, goals);

  return (
    <div
      className="p-5 rounded-lg"
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
        boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
            boxShadow: "0 0 16px rgba(16,185,129,0.35)",
          }}
        >
          <Icon i="sparkles" size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">IA Conseillère</p>
          <p className="text-xs text-muted-foreground">Suggestions personnalisées</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-md"
            style={{ background: `${s.color}0D`, border: `1px solid ${s.color}22` }}
          >
            <div style={{ color: s.color, marginTop: "1px" }}>
              <Icon i={s.icon} size={14} />
            </div>
            <p className="text-xs text-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
      <Link
        to="/app/conseiller-ia"
        className="block text-center text-xs font-medium mt-4"
        style={{ color: "var(--color-primary)" }}
      >
        Discuter avec Iwadu →
      </Link>
    </div>
  );
}
