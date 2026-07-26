import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { GlassCard } from "@/components/ui/GlassCard";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface Step {
  key: string;
  label: string;
  done: boolean;
  to: string;
  optional?: boolean;
}

function StepRow({ step }: { step: Step }) {
  return (
    <Link key={step.key} to={step.to} className="flex items-center gap-2.5 text-sm group">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        style={{
          background: step.done ? "var(--color-primary)" : "transparent",
          border: step.done ? "none" : "1.5px solid rgba(0,0,0,0.2)",
        }}
      >
        {step.done && <Icon i="check" size={12} style={{ color: "white" }} />}
      </span>
      <span
        className="flex-1"
        style={{
          color: step.done ? "var(--color-muted-foreground, #9CA3AF)" : "var(--color-foreground)",
          textDecoration: step.done ? "line-through" : "none",
        }}
      >
        {step.label}
      </span>
      {step.optional && !step.done && (
        <span className="text-xs text-muted-foreground flex-shrink-0">Facultatif</span>
      )}
      {!step.done && <Icon i="chevron-right" size={14} style={{ color: "#B0B0C0" }} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
    </Link>
  );
}

export function OnboardingChecklist() {
  const status = useOnboardingStatus();

  if (status.loading || status.isComplete) return null;

  const steps: Step[] = [
    { key: "nom", label: "Ajoutez votre nom", done: status.hasName, to: "/app/parametres" },
    { key: "revenu", label: "Ajoutez un revenu", done: status.hasIncome, to: "/app/revenus" },
    { key: "depense", label: "Ajoutez une dépense", done: status.hasExpense, to: "/app/depenses" },
    { key: "whatsapp", label: "Numéro WhatsApp", done: status.hasWhatsapp, to: "/app/parametres", optional: true },
  ];

  const pct = Math.round((status.requiredDone / status.requiredTotal) * 100);

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-foreground">Complétez votre profil</p>
        <span className="text-xs font-medium text-muted-foreground flex-shrink-0">
          {status.requiredDone}/{status.requiredTotal} étapes
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "#DC2626" }}>
        🔒 Iwadu, votre conseiller IA, se débloque une fois ces étapes terminées.
      </p>
      <div style={{ height: "6px", background: "rgba(0,0,0,0.06)", borderRadius: "3px", overflow: "hidden" }} className="mb-4">
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <div className="flex flex-col gap-2.5">
        {steps.map((step) => (
          <StepRow key={step.key} step={step} />
        ))}
      </div>
    </GlassCard>
  );
}
