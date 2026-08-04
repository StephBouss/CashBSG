import type { CategoryTotal } from "@/lib/expensesByCategory";
import { formatMontant } from "@/lib/formatters";

interface PieChartProps {
  data: CategoryTotal[];
  total: number;
  devise?: string;
}

function buildConicGradient(segments: CategoryTotal[], total: number) {
  if (total === 0) return "rgba(0,0,0,0.06)";
  let acc = 0;
  const parts = segments.map((s) => {
    const start = acc;
    acc += (s.montant / total) * 100;
    return `${s.couleur} ${start}% ${acc}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

export function PieChart({ data, total, devise = "FCFA" }: PieChartProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-4">Répartition des dépenses</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune dépense ce mois-ci.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0" style={{ width: "120px", height: "120px" }}>
            <div
              className="w-full h-full rounded-full"
              style={{ background: buildConicGradient(data, total) }}
            />
            <div
              className="absolute rounded-full flex flex-col items-center justify-center"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "94px",
                height: "94px",
                background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.9)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-xs font-semibold text-foreground leading-tight text-center px-1">
                {formatMontant(total, devise)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {data.map((s) => (
              <div key={s.nom} className="flex items-start gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-0.5"
                  style={{ background: s.couleur }}
                />
                <div className="flex items-baseline justify-between gap-2 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground break-words">{s.nom}</span>
                  <span className="text-xs font-semibold text-foreground flex-shrink-0">
                    {Math.round((s.montant / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
