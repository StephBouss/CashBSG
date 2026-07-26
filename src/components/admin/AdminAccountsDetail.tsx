import { useMemo } from "react";
import { formatDate } from "@/lib/formatters";
import { CountryTag, PlanBadge, StatusBadge, firstName, formatDevise, initials } from "@/components/admin/AdminBadges";
import type { AdminUserRow } from "@/hooks/useAdminDashboard";

export type AccountsDetailMode = "comptes" | "revenus" | "depenses" | "messages" | "tokens";

interface AdminAccountsDetailProps {
  users: AdminUserRow[];
  mode: AccountsDetailMode;
}

const MIN_TABLE_WIDTH: Record<AccountsDetailMode, number> = {
  comptes: 1080,
  revenus: 820,
  depenses: 860,
  messages: 760,
  tokens: 760,
};

// Colonnes à largeur fixe : flexShrink 0 partout pour empêcher le
// tassement/chevauchement du texte quand le tableau est plus large que
// la modale (le défilement horizontal du conteneur prend le relais).
const userColStyle = { flex: "1 1 220px", minWidth: "220px" } as const;
const fixedCol = (width: number, align?: "right") => ({
  width: `${width}px`,
  flexShrink: 0,
  ...(align === "right" ? { textAlign: "right" as const } : {}),
});

function SummaryStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3"
      style={{ background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <p className="text-lg font-semibold font-headings leading-tight" style={{ color: color ?? "var(--color-ink, #1F2937)" }}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export function AdminAccountsDetail({ users, mode }: AdminAccountsDetailProps) {
  const actifs = useMemo(() => users.filter((u) => u.status === "actif"), [users]);
  const inactifs = users.length - actifs.length;

  const sorted = useMemo(() => {
    const copy = [...users];
    if (mode === "revenus") return copy.sort((a, b) => b.revenusMois - a.revenusMois);
    if (mode === "depenses") return copy.sort((a, b) => b.depensesMois - a.depensesMois);
    if (mode === "messages") return copy.sort((a, b) => b.messagesIaMois - a.messagesIaMois);
    if (mode === "tokens") return copy.sort((a, b) => b.tokensIaTotal - a.tokensIaTotal);
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, mode]);

  const totalRevenus = useMemo(() => users.reduce((s, u) => s + u.revenusMois, 0), [users]);
  const totalDepenses = useMemo(() => users.reduce((s, u) => s + u.depensesMois, 0), [users]);
  const totalMessages = useMemo(() => users.reduce((s, u) => s + u.messagesIaMois, 0), [users]);
  const totalTokens = useMemo(() => users.reduce((s, u) => s + u.tokensIaTotal, 0), [users]);
  const contributeursRevenus = users.filter((u) => u.revenusMois > 0).length;
  const contributeursDepenses = users.filter((u) => u.depensesMois > 0).length;
  const atRisk = users.filter((u) => u.revenusMois > 0 && u.depensesMois / u.revenusMois >= 0.9).length;
  const adoptionGap = actifs.filter((u) => u.messagesIaMois === 0).length;
  const topContributeur = mode === "revenus" ? sorted[0] : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Résumé selon le contexte */}
      {mode === "comptes" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Comptes actifs (30 j)" value={`${actifs.length}`} color="#10B981" />
          <SummaryStat label="Comptes inactifs" value={`${inactifs}`} color="#94A3B8" />
          <SummaryStat label="Offre gratuite" value={`${users.filter((u) => u.plan === "free").length}`} />
          <SummaryStat label="Offres payantes" value={`${users.filter((u) => u.plan !== "free").length}`} color="#7C3AED" />
        </div>
      )}
      {mode === "revenus" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Total agrégé (mois)" value={formatDevise(totalRevenus, "FCFA")} color="var(--color-primary)" />
          <SummaryStat label="Comptes contributeurs" value={`${contributeursRevenus} / ${users.length}`} />
          <SummaryStat
            label="Moyenne / contributeur"
            value={contributeursRevenus > 0 ? formatDevise(totalRevenus / contributeursRevenus, "FCFA") : "—"}
          />
          <SummaryStat label="Premier contributeur" value={topContributeur?.nom || topContributeur?.email || "—"} color="var(--color-primary)" />
        </div>
      )}
      {mode === "depenses" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Total agrégé (mois)" value={formatDevise(totalDepenses, "FCFA")} color="#EF4444" />
          <SummaryStat label="Comptes avec dépenses" value={`${contributeursDepenses} / ${users.length}`} />
          <SummaryStat
            label="Moyenne / compte"
            value={contributeursDepenses > 0 ? formatDevise(totalDepenses / contributeursDepenses, "FCFA") : "—"}
          />
          <SummaryStat label="Comptes à risque (≥90% des revenus)" value={`${atRisk}`} color={atRisk > 0 ? "#EF4444" : undefined} />
        </div>
      )}
      {mode === "messages" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Messages ce mois" value={`${totalMessages}`} color="#A855F7" />
          <SummaryStat label="Utilisateurs ayant échangé" value={`${users.filter((u) => u.messagesIaMois > 0).length} / ${users.length}`} />
          <SummaryStat
            label="Moyenne / actif"
            value={actifs.length > 0 ? (totalMessages / actifs.length).toFixed(1) : "—"}
          />
          <SummaryStat
            label="Actifs sans message ce mois"
            value={`${adoptionGap}`}
            color={adoptionGap > 0 ? "#F59E0B" : undefined}
          />
        </div>
      )}
      {mode === "tokens" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Tokens consommés (total)" value={totalTokens.toLocaleString("fr-FR")} color="#0EA5E9" />
          <SummaryStat label="Utilisateurs ayant utilisé Iwadu" value={`${users.filter((u) => u.tokensIaTotal > 0).length} / ${users.length}`} />
          <SummaryStat
            label="Moyenne / utilisateur actif"
            value={
              users.filter((u) => u.tokensIaTotal > 0).length > 0
                ? Math.round(totalTokens / users.filter((u) => u.tokensIaTotal > 0).length).toLocaleString("fr-FR")
                : "—"
            }
          />
          <SummaryStat label="Plus gros consommateur" value={sorted[0]?.tokensIaTotal ? sorted[0].nom || sorted[0].email || "—" : "—"} color="#0EA5E9" />
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ minWidth: `${MIN_TABLE_WIDTH[mode]}px` }}>
          <div
            className="flex items-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "rgba(0,0,0,0.03)", borderBottom: "1px solid rgba(0,0,0,0.06)", color: "#949494" }}
          >
            <div style={userColStyle}>Utilisateur</div>
            <div style={fixedCol(130)}>Pays</div>
            <div style={fixedCol(90)}>Statut</div>
            <div style={fixedCol(120)}>Offre</div>
            {mode === "comptes" && (
              <>
                <div style={fixedCol(110, "right")}>Revenus</div>
                <div style={fixedCol(110, "right")}>Dépenses</div>
                <div style={fixedCol(80, "right")}>Objectifs</div>
                <div style={fixedCol(70, "right")}>Msg IA</div>
                <div style={fixedCol(120)}>Dern. connexion</div>
              </>
            )}
            {mode === "revenus" && (
              <>
                <div style={fixedCol(130, "right")}>Revenus (mois)</div>
                <div style={fixedCol(100, "right")}>% du total</div>
              </>
            )}
            {mode === "depenses" && (
              <>
                <div style={fixedCol(130, "right")}>Dépenses (mois)</div>
                <div style={fixedCol(140, "right")}>Ratio / revenus</div>
              </>
            )}
            {mode === "messages" && <div style={fixedCol(160, "right")}>Messages (mois)</div>}
            {mode === "tokens" && <div style={fixedCol(160, "right")}>Tokens IA (total)</div>}
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {sorted.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">Aucune donnée.</p>
            ) : (
              sorted.map((u) => {
                const ratio = u.revenusMois > 0 ? u.depensesMois / u.revenusMois : null;
                const pctOfTotal = totalRevenus > 0 ? Math.round((u.revenusMois / totalRevenus) * 100) : 0;
                return (
                  <div key={u.id} className="flex items-center px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0" style={userColStyle}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                      >
                        {initials(u.nom, u.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {u.nom || "Sans nom"} {u.isAdmin && <span className="text-xs" style={{ color: "#7C3AED" }}>(admin)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {firstName(u.nom) ? `${firstName(u.nom)} · ` : ""}
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div style={fixedCol(130)}>
                      <CountryTag pays={u.pays} />
                    </div>
                    <div style={fixedCol(90)}>
                      <StatusBadge status={u.status} />
                    </div>
                    <div style={fixedCol(120)}>
                      <PlanBadge plan={u.plan} />
                    </div>

                    {mode === "comptes" && (
                      <>
                        <div style={fixedCol(110, "right")}>
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-primary)" }}>{formatDevise(u.revenusMois, u.devise)}</p>
                        </div>
                        <div style={fixedCol(110, "right")}>
                          <p className="text-sm font-medium truncate" style={{ color: "#EF4444" }}>{formatDevise(u.depensesMois, u.devise)}</p>
                        </div>
                        <div style={fixedCol(80, "right")}>
                          <p className="text-sm text-muted-foreground">{u.objectifsAtteints}/{u.objectifs}</p>
                        </div>
                        <div style={fixedCol(70, "right")}>
                          <p className="text-sm text-muted-foreground">{u.messagesIaMois}</p>
                        </div>
                        <div style={fixedCol(120)}>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.lastSignInAt ? formatDate(u.lastSignInAt) : "Jamais connecté"}
                          </p>
                        </div>
                      </>
                    )}

                    {mode === "revenus" && (
                      <>
                        <div style={fixedCol(130, "right")}>
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-primary)" }}>{formatDevise(u.revenusMois, u.devise)}</p>
                        </div>
                        <div style={fixedCol(100, "right")}>
                          <p className="text-sm text-muted-foreground">{pctOfTotal}%</p>
                        </div>
                      </>
                    )}

                    {mode === "depenses" && (
                      <>
                        <div style={fixedCol(130, "right")}>
                          <p className="text-sm font-semibold truncate" style={{ color: "#EF4444" }}>{formatDevise(u.depensesMois, u.devise)}</p>
                        </div>
                        <div style={fixedCol(140, "right")}>
                          {ratio === null ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                background: ratio >= 0.9 ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                                color: ratio >= 0.9 ? "#EF4444" : "var(--color-primary)",
                              }}
                            >
                              {Math.round(ratio * 100)}%
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {mode === "messages" && (
                      <div style={fixedCol(160, "right")}>
                        <p className="text-sm font-semibold" style={{ color: "#A855F7" }}>{u.messagesIaMois}</p>
                      </div>
                    )}

                    {mode === "tokens" && (
                      <div style={fixedCol(160, "right")}>
                        <p className="text-sm font-semibold" style={{ color: "#0EA5E9" }}>{u.tokensIaTotal.toLocaleString("fr-FR")}</p>
                      </div>
                    )}
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
