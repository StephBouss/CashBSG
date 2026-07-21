import type { MonthlyTrendPoint } from "@/hooks/useMonthlyTrend";

interface LineChartProps {
  points: MonthlyTrendPoint[];
}

const W = 380;
const H = 120;
const PAD = 18;

function xPercent(i: number, count: number) {
  const x = PAD + (i / Math.max(1, count - 1)) * (W - 2 * PAD);
  return (x / W) * 100;
}

export function LineChart({ points }: LineChartProps) {
  const values = points.map((p) => p.solde);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  function norm(v: number) {
    return H - PAD - ((v - min) / range) * (H - 2 * PAD);
  }

  function buildPath() {
    return values
      .map((v, i) => {
        const x = PAD + (i / Math.max(1, values.length - 1)) * (W - 2 * PAD);
        const y = norm(v);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }

  function buildArea() {
    const x0 = PAD;
    const xN = PAD + (W - 2 * PAD);
    return `${buildPath()} L ${xN} ${H - PAD} L ${x0} ${H - PAD} Z`;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-4">
        Évolution du solde ({points.length} mois)
      </p>
      <div className="relative">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ height: `${H}px` }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={buildArea()} fill="url(#lineGrad)" />
          <path
            d={buildPath()}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {values.map((v, i) => {
            const x = PAD + (i / Math.max(1, values.length - 1)) * (W - 2 * PAD);
            const y = norm(v);
            return <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#10B981" strokeWidth="2" />;
          })}
        </svg>
        <div className="relative mt-1" style={{ height: "14px" }}>
          {points.map((p, i) => {
            const isCurrent = i === points.length - 1;
            return (
              <span
                key={p.monthStart}
                className={`absolute top-0 whitespace-nowrap ${isCurrent ? "" : "text-muted-foreground"}`}
                style={{
                  left: `${xPercent(i, points.length)}%`,
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  color: isCurrent ? "#10B981" : undefined,
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {p.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
