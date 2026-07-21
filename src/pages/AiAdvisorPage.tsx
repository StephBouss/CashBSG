import { AIAdvisorChat } from "@/components/ai-advisor/AIAdvisorChat";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AiAdvisorPage() {
  return (
    <div className="flex flex-col min-w-0 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Conseiller IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Obtenez des conseils financiers personnalisés
        </p>
      </div>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden" style={{ minHeight: "500px" }}>
        <AIAdvisorChat />
      </GlassCard>
    </div>
  );
}
