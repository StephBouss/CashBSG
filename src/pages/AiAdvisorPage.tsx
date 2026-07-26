import { AIAdvisorChat } from "@/components/ai-advisor/AIAdvisorChat";
import { GlassCard } from "@/components/ui/GlassCard";
import { OnboardingLock } from "@/components/onboarding/OnboardingLock";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

export default function AiAdvisorPage() {
  const status = useOnboardingStatus();

  return (
    <div className="flex flex-col min-w-0 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Iwadu</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Votre conseiller financier IA — obtenez des conseils personnalisés
        </p>
      </div>

      {!status.loading && !status.isComplete ? (
        <OnboardingLock status={status} />
      ) : (
        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden" style={{ minHeight: "500px" }}>
          <AIAdvisorChat />
        </GlassCard>
      )}
    </div>
  );
}
