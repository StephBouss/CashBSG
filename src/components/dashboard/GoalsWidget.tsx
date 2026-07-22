import { Link } from "react-router-dom";
import type { Goal } from "@/types/budget";

interface GoalsWidgetProps {
  goals: Goal[];
}

function pct(saved: number, target: number) {
  return target > 0 ? Math.round((saved / target) * 100) : 0;
}

const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function fmt(v: number) {
  return numberFormatter.format(Math.round(v));
}

export function GoalsWidget({ goals }: GoalsWidgetProps) {
  const top = [...goals]
    .sort((a, b) => pct(b.montantEpargne, b.montantCible) - pct(a.montantEpargne, a.montantCible))
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Objectifs financiers</p>
        <Link to="/objectifs" className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
          Voir tout
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun objectif pour l'instant.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {top.map((g) => {
            const p = pct(g.montantEpargne, g.montantCible);
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{g.icone}</span>
                    <span className="text-xs font-medium text-foreground truncate">{g.label}</span>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: g.couleur }}>
                    {p}%
                  </span>
                </div>
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{ height: "6px", background: `${g.couleur}20` }}
                >
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: g.couleur }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{fmt(g.montantEpargne)} FCFA</span>
                  <span className="text-xs text-muted-foreground">{fmt(g.montantCible)} FCFA</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
