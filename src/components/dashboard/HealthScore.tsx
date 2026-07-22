import type { MonthFinancials } from "@/lib/calculations";

interface HealthScoreProps {
  financials: MonthFinancials;
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function computeScore(financials: MonthFinancials) {
  const { totalRevenus, solde, totalDepensesPayees, totalDepensesAVenir, totalDepensesEnRetard } =
    financials;
  const totalDepenses = totalDepensesPayees + totalDepensesAVenir + totalDepensesEnRetard;

  const tauxEpargne = totalRevenus > 0 ? clamp((solde / totalRevenus) * 100) : 0;
  const depensesATemps =
    totalDepenses > 0 ? clamp(100 - (totalDepensesEnRetard / totalDepenses) * 100) : 100;
  const couverture = totalDepenses > 0 ? clamp((solde / totalDepenses) * 100) : 100;

  const score = Math.round((tauxEpargne + depensesATemps + couverture) / 3);

  return {
    score: clamp(score),
    metrics: [
      { label: "Taux d'épargne", value: `${Math.round(tauxEpargne)}%`, color: "var(--color-primary)" },
      { label: "Dépenses à temps", value: `${Math.round(depensesATemps)}%`, color: "var(--color-secondary)" },
      { label: "Couverture mensuelle", value: `${Math.round(couverture)}%`, color: "#6366F1" },
    ],
  };
}

export function HealthScore({ financials }: HealthScoreProps) {
  const { score, metrics } = computeScore(financials);
  const status = score >= 80 ? "Excellent" : score >= 60 ? "Bon" : "À améliorer";
  const statusColor = score >= 80 ? "var(--color-primary)" : score >= 60 ? "#F59E0B" : "#EF4444";

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col">
      <p className="text-sm font-semibold text-foreground mb-3">Santé financière</p>

      <div className="flex justify-center mb-4">
        <div className="relative flex-shrink-0" style={{ width: "110px", height: "110px" }}>
          <svg width={110} height={110} viewBox="0 0 110 110" className="absolute inset-0">
            <circle cx={55} cy={55} r={35} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={7} />
            <circle
              cx={55}
              cy={55}
              r={35}
              fill="none"
              stroke={statusColor}
              strokeWidth={7}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-headings font-semibold leading-tight" style={{ color: statusColor }}>
              {score}
            </p>
            <p className="text-xs text-muted-foreground">sur 100</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="text-xs text-muted-foreground">Statut</p>
        <p className="text-sm font-semibold" style={{ color: statusColor }}>
          {status}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="text-xs text-muted-foreground truncate">{m.label}</span>
            </div>
            <span className="text-xs font-semibold text-foreground flex-shrink-0">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
