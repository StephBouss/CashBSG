import { useProfile } from "@/hooks/useProfile";
import { useCreateUpgradeRequest, usePendingUpgradeRequest } from "@/hooks/useUpgradeRequest";
import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
import { PLAN_LABELS, PLAN_PRICES, PLAN_ORDER, planFeatureList, upgradeOptions } from "@/lib/plan";

export default function UpgradePage() {
  const { data: profile } = useProfile();
  const { data: pendingRequest, isLoading: loadingPending } = usePendingUpgradeRequest();
  const createRequest = useCreateUpgradeRequest();

  if (!profile) return null;

  const options = upgradeOptions(profile.plan);

  return (
    <div className="flex flex-col min-w-0 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Mettre à niveau votre offre</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vous êtes actuellement sur <strong>{PLAN_LABELS[profile.plan]}</strong>.
        </p>
      </div>

      {createRequest.isError && (
        <GlassCard className="mb-6 flex items-center gap-3 p-4" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
          <Icon i="alert-triangle" size={18} style={{ color: "#EF4444" }} />
          <p className="text-sm text-foreground">
            {(createRequest.error as { code?: string })?.code === "23505"
              ? "Vous avez déjà une demande en attente de traitement."
              : "Votre demande n'a pas pu être envoyée, réessayez dans un instant."}
          </p>
        </GlassCard>
      )}

      {pendingRequest && (
        <GlassCard className="mb-6 flex items-center gap-3 p-4" style={{ borderColor: "rgba(16,185,129,0.4)" }}>
          <Icon i="clock" size={18} style={{ color: "#10B981" }} />
          <p className="text-sm text-foreground">
            Votre demande de passage à <strong>{PLAN_LABELS[pendingRequest.requested_plan]}</strong> a bien été
            reçue et est en attente de traitement. Nous vous contacterons pour finaliser le paiement.
          </p>
        </GlassCard>
      )}

      {options.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Icon i="check-circle" size={28} style={{ color: "#10B981" }} className="mx-auto mb-3" />
          <p className="text-sm text-foreground">
            Vous êtes déjà sur l'offre la plus complète, {PLAN_LABELS[PLAN_ORDER[PLAN_ORDER.length - 1]]}.
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
          {options.map((plan) => (
            <GlassCard key={plan} className="p-6 flex flex-col">
              <p className="font-headings font-semibold text-foreground" style={{ fontSize: "18px" }}>
                {PLAN_LABELS[plan]}
              </p>
              <p className="text-sm mt-1" style={{ color: "#10B981" }}>
                {PLAN_PRICES[plan]}
              </p>
              <ul className="flex flex-col gap-2 my-5 flex-1">
                {planFeatureList(plan).map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-foreground">
                    <Icon i="check" size={14} style={{ color: "#10B981", marginTop: "3px", flexShrink: 0 }} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!!pendingRequest || loadingPending || createRequest.isPending}
                onClick={() => createRequest.mutate({ currentPlan: profile.plan, requestedPlan: plan })}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
              >
                Passer à {PLAN_LABELS[plan]}
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-6">
        Le paiement en ligne automatisé n'est pas encore disponible : après votre demande, notre équipe vous
        contacte pour organiser le règlement et activer votre nouvelle offre.
      </p>
    </div>
  );
}
