import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatMontant, formatDate } from "@/lib/formatters";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());

function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
        boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
      }}
    >
      {children}
    </div>
  );
}

function initials(nom: string | null, email: string | null) {
  const source = nom || email || "?";
  return source.charAt(0).toUpperCase();
}

export default function AdminPage() {
  const { data, isLoading, error } = useAdminDashboard();

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}
          >
            <Icon i="shield" size={18} style={{ color: "white" }} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-headings font-semibold text-foreground">Panneau d&apos;administration</h1>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">Vue globale · {monthLabel}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#7C3AED" }}
        >
          <Icon i="shield" size={14} />
          Administrateur
        </div>
      </div>

      {error && (
        <GlassCard className="p-6 mb-6">
          <p className="text-sm" style={{ color: "#EF4444" }}>
            {(error as Error).message || "Impossible de charger les données administrateur."}
          </p>
        </GlassCard>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { icon: "users", label: "Comptes totaux", value: `${data.kpis.totalComptes}`, color: "var(--color-secondary)" },
              { icon: "trending-up", label: "Revenus agrégés (mois)", value: formatMontant(data.kpis.totalRevenusMois), color: "var(--color-primary)" },
              { icon: "credit-card", label: "Dépenses agrégées (mois)", value: formatMontant(data.kpis.totalDepensesMois), color: "#F59E0B" },
              { icon: "bot", label: "Messages IA (mois)", value: `${data.kpis.totalMessagesIaMois}`, color: "#A855F7" },
              { icon: "target", label: "Objectifs (atteints)", value: `${data.kpis.totalObjectifs} (${data.kpis.objectifsAtteints})`, color: "#EC4899" },
            ].map((kpi) => (
              <GlassCard key={kpi.label} className="p-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}30` }}
                >
                  <Icon i={kpi.icon} size={16} style={{ color: kpi.color }} />
                </div>
                <p className="text-lg font-semibold text-foreground font-headings leading-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Users table */}
          <GlassCard className="overflow-hidden mb-5">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div>
                <p className="text-sm font-semibold text-foreground">Tous les comptes</p>
                <p className="text-xs text-muted-foreground mt-0.5">Revenus, dépenses et activité IA du mois en cours</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div
                  className="flex items-center px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "#949494" }}
                >
                  <div style={{ flex: 1 }}>Utilisateur</div>
                  <div style={{ width: "70px" }}>Devise</div>
                  <div style={{ width: "120px", textAlign: "right" }}>Revenus</div>
                  <div style={{ width: "120px", textAlign: "right" }}>Dépenses</div>
                  <div style={{ width: "90px", textAlign: "right" }}>Msg. IA</div>
                  <div style={{ width: "80px", textAlign: "right" }}>Objectifs</div>
                  <div style={{ width: "110px" }}>Inscription</div>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {data.users.length === 0 ? (
                    <p className="px-6 py-6 text-sm text-muted-foreground">Aucun compte pour l&apos;instant.</p>
                  ) : (
                    data.users.map((u) => (
                      <div key={u.id} className="flex items-center px-6 py-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                          >
                            {initials(u.nom, u.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.nom || "Sans nom"}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          </div>
                          {u.isAdmin && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}
                            >
                              Admin
                            </span>
                          )}
                        </div>
                        <div style={{ width: "70px" }}>
                          <span className="text-xs font-medium text-muted-foreground">{u.devise}</span>
                        </div>
                        <div style={{ width: "120px", textAlign: "right" }}>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>{formatMontant(u.revenusMois)}</p>
                        </div>
                        <div style={{ width: "120px", textAlign: "right" }}>
                          <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>{formatMontant(u.depensesMois)}</p>
                        </div>
                        <div style={{ width: "90px", textAlign: "right" }}>
                          <p className="text-sm text-muted-foreground">{u.messagesIaMois}</p>
                        </div>
                        <div style={{ width: "80px", textAlign: "right" }}>
                          <p className="text-sm text-muted-foreground">{u.objectifs}</p>
                        </div>
                        <div style={{ width: "110px" }}>
                          <p className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon i="globe" size={16} style={{ color: "var(--color-secondary)" }} />
                <p className="text-sm font-semibold text-foreground">Répartition par devise</p>
              </div>
              <div className="space-y-3">
                {data.deviseBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune donnée.</p>
                ) : (
                  data.deviseBreakdown.map((d) => {
                    const pct = data.kpis.totalComptes > 0 ? Math.round((d.count / data.kpis.totalComptes) * 100) : 0;
                    return (
                      <div key={d.devise}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-foreground">{d.devise}</span>
                          <span className="text-xs font-semibold" style={{ color: "var(--color-secondary)" }}>{d.count} compte{d.count > 1 ? "s" : ""}</span>
                        </div>
                        <div style={{ height: "5px", background: "rgba(59,130,246,0.12)", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "var(--color-secondary)", borderRadius: "3px", width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon i="users" size={16} style={{ color: "var(--color-primary)" }} />
                <p className="text-sm font-semibold text-foreground">Derniers inscrits</p>
              </div>
              <div className="space-y-3">
                {data.recentSignups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune inscription pour l&apos;instant.</p>
                ) : (
                  data.recentSignups.map((u) => (
                    <div key={u.id} className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                      >
                        {initials(u.nom, u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{u.nom || u.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{formatDate(u.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon i="target" size={16} style={{ color: "#EC4899" }} />
                <p className="text-sm font-semibold text-foreground">Objectifs financiers</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Objectifs créés (tous comptes)</span>
                  <span className="text-sm font-semibold text-foreground">{data.kpis.totalObjectifs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Objectifs atteints</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>{data.kpis.objectifsAtteints}</span>
                </div>
                <div style={{ height: "5px", background: "rgba(236,72,153,0.12)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: "#EC4899",
                      borderRadius: "3px",
                      width: `${data.kpis.totalObjectifs > 0 ? Math.round((data.kpis.objectifsAtteints / data.kpis.totalObjectifs) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
