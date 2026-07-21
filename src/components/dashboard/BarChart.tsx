import type { CategoryTotal } from "@/lib/expensesByCategory";

interface BarChartProps {
  data: CategoryTotal[];
}

const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function fmt(v: number) {
  return numberFormatter.format(Math.round(v));
}

export function BarChart({ data }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.montant));

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-4">Dépenses par catégorie</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune dépense ce mois-ci.</p>
      ) : (
        <div className="flex items-end gap-3" style={{ height: "120px" }}>
          {data.map((b) => {
            const pct = (b.montant / max) * 100;
            return (
              <div key={b.nom} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <span className="text-foreground font-semibold" style={{ fontSize: "10px" }}>
                  {fmt(b.montant)}
                </span>
                <div
                  className="w-full"
                  style={{
                    height: `${(pct / 100) * 84}px`,
                    background: `linear-gradient(180deg, ${b.couleur} 0%, ${b.couleur}99 100%)`,
                    minHeight: "6px",
                    borderRadius: "4px 4px 2px 2px",
                  }}
                />
                <span
                  className="text-muted-foreground text-center leading-tight truncate w-full"
                  style={{ fontSize: "9px" }}
                >
                  {b.nom}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
