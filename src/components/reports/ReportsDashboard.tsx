import { useState } from "react";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useCategoryTotalsRange } from "@/hooks/useCategoryTotalsRange";
import { useGoals } from "@/hooks/useGoals";
import { Icon } from "@/components/ui/Icon";
import { formatMontant } from "@/lib/formatters";

const PERIODS = [
  { key: "mois", label: "Mois", months: 1 },
  { key: "trimestre", label: "Trimestre", months: 3 },
  { key: "annee", label: "Année", months: 12 },
] as const;

export function ReportsDashboard() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["key"]>("trimestre");
  const months = PERIODS.find((p) => p.key === period)!.months;

  const { data: trend = [] } = useMonthlyTrend(months);
  const { totals: categoryTotals } = useCategoryTotalsRange(months);
  const { data: goals = [] } = useGoals();

  const totalRevenus = trend.reduce((s, p) => s + p.totalRevenus, 0);
  const totalDepenses = trend.reduce((s, p) => s + p.totalDepenses, 0);
  const epargneNette = totalRevenus - totalDepenses;
  const tauxEpargne = totalRevenus > 0 ? Math.round((epargneNette / totalRevenus) * 100) : 0;

  const soldeDebut = trend[0]?.solde ?? 0;
  const soldeFin = trend[trend.length - 1]?.solde ?? 0;
  const variation = trend.reduce((s, p) => s + p.solde, 0);

  const maxBar = Math.max(1, ...trend.flatMap((p) => [p.totalRevenus, p.totalDepenses]));
  const totalCategorized = categoryTotals.reduce((s, c) => s + c.montant, 0);

  const previousHalf = trend.slice(0, Math.floor(trend.length / 2));
  const recentHalf = trend.slice(Math.floor(trend.length / 2));
  const previousAvgSolde =
    previousHalf.length > 0 ? previousHalf.reduce((s, p) => s + p.solde, 0) / previousHalf.length : 0;
  const recentAvgSolde =
    recentHalf.length > 0 ? recentHalf.reduce((s, p) => s + p.solde, 0) / recentHalf.length : 0;
  const soldeEvolutionPct =
    previousAvgSolde !== 0 ? Math.round(((recentAvgSolde - previousAvgSolde) / Math.abs(previousAvgSolde)) * 100) : null;

  const goalCandidate = [...goals]
    .filter((g) => g.contributionMensuelle > 0 && g.montantEpargne < g.montantCible)
    .sort(
      (a, b) =>
        (a.montantCible - a.montantEpargne) / a.contributionMensuelle -
        (b.montantCible - b.montantEpargne) / b.contributionMensuelle
    )[0];

  return (
    <div>
      {/* Header with period selector */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Rapports financiers</p>
          <p className="text-xs text-muted-foreground mt-0.5">Analyses détaillées et tendances</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={
                period === p.key
                  ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--color-primary)" }
                  : { background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--color-ink)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Revenus totaux</p>
              <p className="text-lg font-semibold text-primary mt-2">{formatMontant(totalRevenus)}</p>
            </div>
            <Icon i="trending-up" size={24} style={{ color: "var(--color-primary)" }} />
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dépenses totales</p>
              <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>{formatMontant(totalDepenses)}</p>
            </div>
            <Icon i="trending-down" size={24} style={{ color: "#EF4444" }} />
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Épargne nette</p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-secondary)" }}>{formatMontant(epargneNette)}</p>
            </div>
            <Icon i="bar-chart-2" size={24} style={{ color: "var(--color-secondary)" }} />
          </div>
        </div>
        <div className="p-4 rounded-lg" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Taux épargne</p>
              <p className="text-lg font-semibold" style={{ color: "#A855F7" }}>{tauxEpargne}%</p>
            </div>
            <Icon i="pie-chart" size={24} style={{ color: "#A855F7" }} />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div
          className="p-6 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)", backdropFilter: "blur(32px)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)", boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenus vs Dépenses</h3>
          <div className="flex items-end justify-around gap-3 px-4" style={{ height: "240px", background: "rgba(0,0,0,0.04)", borderRadius: "8px", padding: "16px" }}>
            {trend.map((p) => (
              <div key={p.monthStart} className="flex flex-col items-center gap-1 flex-1">
                <div className="flex items-end gap-1" style={{ height: "180px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: `${Math.max(4, (p.totalRevenus / maxBar) * 180)}px`,
                      background: "linear-gradient(180deg, var(--color-primary), var(--color-primary-dark))",
                      borderRadius: "4px",
                    }}
                  />
                  <div
                    style={{
                      width: "10px",
                      height: `${Math.max(4, (p.totalDepenses / maxBar) * 180)}px`,
                      background: "linear-gradient(180deg, #EF4444, #DC2626)",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "10px" }}>{p.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "var(--color-primary)" }} />
              <span className="text-muted-foreground">Revenus</span>
            </div>
            <div className="flex items-center gap-2">
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#EF4444" }} />
              <span className="text-muted-foreground">Dépenses</span>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)", backdropFilter: "blur(32px)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)", boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Tendance d'épargne</h3>
          <div className="flex items-end justify-around gap-3" style={{ height: "240px", background: "rgba(0,0,0,0.04)", borderRadius: "8px", padding: "16px" }}>
            {trend.map((p) => {
              const maxSolde = Math.max(1, ...trend.map((t) => Math.abs(t.solde)));
              return (
                <div key={p.monthStart} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    style={{
                      width: "60%",
                      height: `${Math.max(4, (Math.abs(p.solde) / maxSolde) * 190)}px`,
                      background: p.solde >= 0 ? "linear-gradient(180deg, var(--color-secondary), var(--color-secondary-dark))" : "linear-gradient(180deg, #EF4444, #DC2626)",
                      borderRadius: "4px",
                    }}
                  />
                  <span className="text-muted-foreground" style={{ fontSize: "10px" }}>{p.label}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            {soldeEvolutionPct === null
              ? "Pas assez de données pour une tendance."
              : `Progression : ${soldeEvolutionPct >= 0 ? "+" : ""}${soldeEvolutionPct}% vs première moitié de la période`}
          </p>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          className="p-6 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)", backdropFilter: "blur(32px)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)", boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top catégories</h3>
          {categoryTotals.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune dépense sur la période.</p>
          ) : (
            <div className="space-y-3">
              {categoryTotals.slice(0, 4).map((cat) => {
                const pct = totalCategorized > 0 ? Math.round((cat.montant / totalCategorized) * 100) : 0;
                return (
                  <div key={cat.nom}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{cat.nom}</span>
                      <span className="text-xs font-semibold" style={{ color: cat.couleur }}>{pct}%</span>
                    </div>
                    <div style={{ height: "6px", background: `${cat.couleur}20`, borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: cat.couleur, borderRadius: "3px", width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)", backdropFilter: "blur(32px)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)", boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Flux de trésorerie</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Solde début de période</span>
              <span className="text-sm font-semibold text-foreground">{formatMontant(soldeDebut)}</span>
            </div>
            <div style={{ padding: "2px", borderRadius: "4px", background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }}>
              <div style={{ padding: "8px", background: "white", borderRadius: "3px", textAlign: "center" }}>
                <p className="text-xs font-medium text-primary">
                  {variation >= 0 ? "+" : ""}
                  {formatMontant(variation)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Solde fin de période</span>
              <span className="text-sm font-semibold" style={{ color: soldeFin >= 0 ? "var(--color-primary)" : "#EF4444" }}>
                {formatMontant(soldeFin)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)", backdropFilter: "blur(32px)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)", boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Insights</h3>
          <div className="space-y-3 text-xs">
            {soldeEvolutionPct !== null && (
              <div
                className="p-2.5 rounded"
                style={{
                  background: soldeEvolutionPct >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${soldeEvolutionPct >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <p className="font-medium text-foreground">
                  {soldeEvolutionPct >= 0 ? "Épargne en hausse" : "Épargne en baisse"}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {soldeEvolutionPct >= 0 ? "+" : ""}
                  {soldeEvolutionPct}% vs début de période
                </p>
              </div>
            )}
            {categoryTotals[0] && (
              <div className="p-2.5 rounded" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="font-medium text-foreground">Dépense principale</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {categoryTotals[0].nom} ({formatMontant(categoryTotals[0].montant)})
                </p>
              </div>
            )}
            {goalCandidate && (
              <div className="p-2.5 rounded" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p className="font-medium text-foreground">Objectif le plus proche</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {goalCandidate.label} en{" "}
                  {Math.ceil(
                    (goalCandidate.montantCible - goalCandidate.montantEpargne) / goalCandidate.contributionMensuelle
                  )}{" "}
                  mois
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
