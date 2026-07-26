import { useMemo } from "react";
import { formatDate } from "@/lib/formatters";
import { formatDevise } from "@/components/admin/AdminBadges";
import type { AdminGoalRow } from "@/hooks/useAdminDashboard";

interface AdminGoalsDetailProps {
  goals: AdminGoalRow[];
}

function SummaryStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.06)" }}>
      <p className="text-lg font-semibold font-headings leading-tight" style={{ color: color ?? undefined }}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export function AdminGoalsDetail({ goals }: AdminGoalsDetailProps) {
  const sorted = useMemo(() => {
    return [...goals].sort((a, b) => {
      const pctA = a.montantCible > 0 ? a.montantEpargne / a.montantCible : 0;
      const pctB = b.montantCible > 0 ? b.montantEpargne / b.montantCible : 0;
      return pctB - pctA;
    });
  }, [goals]);

  const atteints = goals.filter((g) => g.atteint).length;
  const tauxReussite = goals.length > 0 ? Math.round((atteints / goals.length) * 100) : 0;
  const montantCibleTotal = goals.reduce((s, g) => s + g.montantCible, 0);
  const montantEpargneTotal = goals.reduce((s, g) => s + g.montantEpargne, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat label="Objectifs créés" value={`${goals.length}`} />
        <SummaryStat label="Objectifs atteints" value={`${atteints}`} color="var(--color-primary)" />
        <SummaryStat label="Taux de réussite" value={`${tauxReussite}%`} color="#EC4899" />
        <SummaryStat label="Épargné / ciblé (agrégé)" value={`${formatDevise(montantEpargneTotal, "FCFA")} / ${formatDevise(montantCibleTotal, "FCFA")}`} />
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="min-w-[720px]">
          <div
            className="flex items-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "#949494" }}
          >
            <div style={{ flex: 1.4 }}>Objectif</div>
            <div style={{ flex: 1 }}>Utilisateur</div>
            <div style={{ width: "160px", flexShrink: 0 }}>Progression</div>
            <div style={{ width: "90px", flexShrink: 0 }}>Statut</div>
            <div style={{ width: "110px", flexShrink: 0 }}>Échéance</div>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {sorted.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Aucun objectif pour l&apos;instant.</p>
            ) : (
              sorted.map((g) => {
                const pct = g.montantCible > 0 ? Math.min(100, Math.round((g.montantEpargne / g.montantCible) * 100)) : 0;
                return (
                  <div key={g.id} className="flex items-center px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0" style={{ flex: 1.4 }}>
                      <span className="text-base flex-shrink-0">{g.icone}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{g.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatDevise(g.montantEpargne, "FCFA")} / {formatDevise(g.montantCible, "FCFA")}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0" style={{ flex: 1 }}>
                      <p className="text-xs text-foreground truncate">{g.userNom || "Sans nom"}</p>
                      <p className="text-xs text-muted-foreground truncate">{g.userEmail}</p>
                    </div>
                    <div style={{ width: "160px", flexShrink: 0 }}>
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: "5px", background: "rgba(236,72,153,0.12)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: g.atteint ? "var(--color-primary)" : "#EC4899", borderRadius: "3px", width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0" style={{ width: "32px" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ width: "90px", flexShrink: 0 }}>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: g.atteint ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.15)",
                          color: g.atteint ? "var(--color-primary)" : "#64748B",
                        }}
                      >
                        {g.atteint ? "Atteint" : "En cours"}
                      </span>
                    </div>
                    <div style={{ width: "110px", flexShrink: 0 }}>
                      <p className="text-xs text-muted-foreground">{g.dateCible ? formatDate(g.dateCible) : "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
