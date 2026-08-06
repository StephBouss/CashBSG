import { Icon } from "@/components/ui/Icon";
import { formatMontant } from "@/lib/formatters";
import type { FinancialSummary } from "@/hooks/useFinancialSummary";

interface SummaryCardsProps {
  financials: FinancialSummary;
  previousFinancials?: FinancialSummary;
  devise?: string;
}

function trendPct(current: number, previous?: number): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

interface CardDef {
  icon: string;
  label: string;
  value: number;
  trend?: number | null;
  sub?: string;
  accent: string;
  featured?: boolean;
}

export function SummaryCards({ financials, previousFinancials, devise = "FCFA" }: SummaryCardsProps) {
  const cards: CardDef[] = [
    {
      icon: "💰",
      label: "Revenus encaissés",
      value: financials.revenusEncaisses,
      trend: trendPct(financials.revenusEncaisses, previousFinancials?.revenusEncaisses),
      accent: "var(--color-primary)",
    },
    {
      icon: "💳",
      label: "Dépenses payées",
      value: financials.depensesPayees,
      trend: trendPct(financials.depensesPayees, previousFinancials?.depensesPayees),
      accent: "var(--color-secondary)",
    },
    {
      icon: "⏳",
      label: "Charges restantes",
      value: financials.chargesRestantes,
      sub: "À venir ou en retard",
      accent: "#EC4899",
    },
    {
      icon: "🏦",
      label: "Épargne de la période",
      value: financials.epargnePeriode,
      sub: "Dépôts − retraits",
      accent: "#6366F1",
    },
    {
      icon: "💎",
      label: "Reste à vivre prévisionnel",
      value: financials.resteAVivrePrevisionnel,
      sub: "Solde liquide − charges restantes",
      accent: financials.resteAVivrePrevisionnel >= 0 ? "var(--color-primary)" : "#EF4444",
      featured: true,
    },
  ];

  return (
    <div className="flex gap-4 flex-wrap">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex-1 p-5 rounded-lg relative overflow-hidden"
          style={{
            background: card.featured
              ? "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(59,130,246,0.14) 100%)"
              : "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
            border: card.featured
              ? "1px solid rgba(16,185,129,0.35)"
              : "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
            boxShadow: card.featured
              ? "0 0 32px rgba(16,185,129,0.12), 0 8px 32px rgba(120,120,180,0.10)"
              : "0 8px 32px rgba(120,120,180,0.09)",
            minWidth: card.featured ? "220px" : "160px",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
          }}
        >
          {card.featured && (
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
            />
          )}

          <div className="text-2xl mb-3">{card.icon}</div>
          <p className="text-xs text-muted-foreground font-medium mb-1">{card.label}</p>
          <p
            className="font-headings font-semibold leading-tight mb-1"
            style={{
              fontSize: card.featured ? "22px" : "16px",
              color: card.featured ? card.accent : "var(--color-ink)",
            }}
          >
            {formatMontant(card.value, devise)}
          </p>
          {card.trend !== null && card.trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="text-xs font-semibold"
                style={{ color: card.trend >= 0 ? "var(--color-primary)" : "#EF4444" }}
              >
                {card.trend >= 0 ? "+" : ""}
                {card.trend}%
              </span>
              <Icon i={card.trend >= 0 ? "trending-up" : "trending-down"} size={11} />
            </div>
          )}
          {card.sub && (
            <p className="text-xs mt-1" style={{ color: "rgba(var(--ink-r),var(--ink-g),var(--ink-b),0.4)" }}>
              {card.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
