import { Icon } from "@/components/ui/Icon";
import { addGoalContribution, deleteGoal } from "@/hooks/useGoals";
import type { Goal } from "@/types/budget";

interface GoalsGalleryProps {
  goals: Goal[];
  onChanged: () => void;
  onAddClick: () => void;
}

function pct(saved: number, target: number) {
  return target > 0 ? Math.round((saved / target) * 100) : 0;
}

const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function fmt(v: number) {
  return numberFormatter.format(Math.round(v));
}

function daysLeft(dateCible: string | null): number | null {
  if (!dateCible) return null;
  const diff = new Date(dateCible).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function GoalsGallery({ goals, onChanged, onAddClick }: GoalsGalleryProps) {
  const totalTarget = goals.reduce((s, g) => s + g.montantCible, 0);
  const totalSaved = goals.reduce((s, g) => s + g.montantEpargne, 0);
  const avgCompletion = goals.length
    ? Math.round(goals.reduce((s, g) => s + pct(g.montantEpargne, g.montantCible), 0) / goals.length)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Objectifs financiers</p>
          <p className="text-xs text-muted-foreground mt-0.5">Suivi de vos économies et progression</p>
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
            boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
          }}
        >
          <Icon i="plus" size={14} className="text-white" />
          Nouvel objectif
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2">Aucun objectif pour l'instant. Créez-en un pour commencer à épargner.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5" style={{ gridAutoRows: "max-content" }}>
          {goals.map((goal) => {
            const p = pct(goal.montantEpargne, goal.montantCible);
            const remaining = daysLeft(goal.dateCible);
            return (
              <div
                key={goal.id}
                className="p-6 rounded-lg"
                style={{
                  background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
                  backdropFilter: "blur(32px)",
                  WebkitBackdropFilter: "blur(32px)",
                  border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
                  boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{goal.icone}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{goal.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {remaining !== null ? `Atteint dans ${remaining} jours` : "Aucune échéance"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteGoal(goal.id).then(onChanged)}
                      className="p-1.5 rounded text-xs"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                    >
                      <Icon i="trash-2" size={13} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Progression</span>
                    <span className="text-sm font-semibold" style={{ color: goal.couleur }}>
                      {p}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{ height: "8px", background: `${goal.couleur}20` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p}%`, background: goal.couleur }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg" style={{ background: `${goal.couleur}10`, border: `1px solid ${goal.couleur}20` }}>
                    <p className="text-xs text-muted-foreground">Économisé</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: goal.couleur }}>
                      {fmt(goal.montantEpargne)} FCFA
                    </p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                    <p className="text-xs text-muted-foreground">Objectif</p>
                    <p className="text-sm font-semibold mt-1 text-foreground">{fmt(goal.montantCible)} FCFA</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                    <p className="text-xs text-muted-foreground">Reste</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: "var(--color-secondary)" }}>
                      {fmt(Math.max(0, goal.montantCible - goal.montantEpargne))} FCFA
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <div>
                    <p className="text-xs text-muted-foreground">Épargne mensuelle</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {fmt(goal.contributionMensuelle)} FCFA/mois
                    </p>
                  </div>
                  {goal.contributionMensuelle > 0 && goal.montantEpargne < goal.montantCible && (
                    <button
                      onClick={() => addGoalContribution(goal, goal.contributionMensuelle).then(onChanged)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: goal.couleur, boxShadow: `0 2px 8px ${goal.couleur}40` }}
                    >
                      + Ajouter {fmt(goal.contributionMensuelle)} FCFA
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="p-5 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon i="target" size={16} style={{ color: "var(--color-primary)" }} />
              <p className="text-xs text-muted-foreground">Objectifs totaux</p>
            </div>
            <p className="text-xl font-semibold text-primary">{fmt(totalTarget)} FCFA</p>
          </div>
          <div className="p-5 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon i="piggy-bank" size={16} style={{ color: "var(--color-secondary)" }} />
              <p className="text-xs text-muted-foreground">Total économisé</p>
            </div>
            <p className="text-xl font-semibold" style={{ color: "var(--color-secondary)" }}>{fmt(totalSaved)} FCFA</p>
          </div>
          <div className="p-5 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon i="trending-up" size={16} style={{ color: "#F59E0B" }} />
              <p className="text-xs text-muted-foreground">Taux completion moy.</p>
            </div>
            <p className="text-xl font-semibold" style={{ color: "#F59E0B" }}>{avgCompletion}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
