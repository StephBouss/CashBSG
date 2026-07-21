import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { TrendLineChart } from "@/components/ui/TrendLineChart";
import { formatMontant, formatDate } from "@/lib/formatters";
import { useTithe, markTithePaid } from "@/hooks/useTithe";
import { useMonthlyTrend } from "@/hooks/useMonthlyTrend";
import { useProfile, updateTithePercentage, setTitheActive } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

export function TitheSection() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: tithe } = useTithe();
  const { data: trend = [] } = useMonthlyTrend(6);

  const [editingPct, setEditingPct] = useState(false);
  const [pctValue, setPctValue] = useState(profile?.pourcentageDime ?? 15);
  const [toggling, setToggling] = useState(false);

  const dimeActive = profile?.dimeActive ?? false;

  const savePct = async () => {
    if (!user) return;
    await updateTithePercentage(user.id, pctValue);
    setEditingPct(false);
  };

  const toggleActive = async (next: boolean) => {
    if (!user) return;
    setToggling(true);
    await setTitheActive(user.id, next);
    setToggling(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Suivi de la dîme</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dimeActive
              ? "Activée — un pourcentage de vos revenus est réservé chaque mois."
              : "Désactivée — la dîme n'affecte aucun calcul tant qu'elle n'est pas activée."}
          </p>
        </div>
        <button
          onClick={() => toggleActive(!dimeActive)}
          disabled={toggling}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={
            dimeActive
              ? { background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }
              : { background: "rgba(16,185,129,0.15)", color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }
          }
        >
          {dimeActive ? "Désactiver" : "Activer"}
        </button>
      </GlassCard>

      {dimeActive ? (
        <>
          <div className="flex gap-5">
            <GlassCard className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-4">Dîme du mois</p>
              {tithe ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Dîme de {formatDate(tithe.date)}</div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{formatMontant(tithe.montant)}</div>
                    <div className="text-xs text-muted-foreground">
                      {tithe.pourcentage}% de {formatMontant(tithe.revenuBrut)}
                    </div>
                  </div>
                  {tithe.statut === "paye" ? (
                    <span className="rounded-2xl bg-primary/15 px-4 py-2 text-sm text-primary">Payée</span>
                  ) : (
                    <button
                      onClick={() => markTithePaid(tithe.id)}
                      className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Marquer comme payée
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Aucun revenu enregistré ce mois-ci, la dîme n'est pas encore calculée.
                </p>
              )}
            </GlassCard>

            <GlassCard style={{ width: "260px" }}>
              <p className="text-sm font-semibold text-foreground mb-4">Pourcentage de dîme</p>
              {editingPct ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="number"
                    value={pctValue}
                    onChange={(e) => setPctValue(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="rounded-lg border border-black/10 bg-white/70 px-4 py-2 text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={savePct}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingPct(false)}
                      className="flex-1 rounded-lg bg-black/5 px-3 py-2 text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">{profile?.pourcentageDime ?? 15}%</span>
                  <button
                    onClick={() => {
                      setPctValue(profile?.pourcentageDime ?? 15);
                      setEditingPct(true);
                    }}
                    className="text-xs font-medium text-primary"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard>
            <p className="text-sm font-semibold text-foreground mb-4">Évolution de la dîme (6 mois)</p>
            <TrendLineChart
              points={trend.map((p) => ({ label: p.label, value: p.dime }))}
              color="#F59E0B"
            />
          </GlassCard>
        </>
      ) : (
        <GlassCard>
          <p className="text-sm text-muted-foreground">
            Activez le suivi ci-dessus pour définir un pourcentage, voir le montant du mois et son
            évolution.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
