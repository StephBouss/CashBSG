import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { GlassCard } from "@/components/ui/GlassCard";
import type { OnboardingStatus } from "@/hooks/useOnboardingStatus";

interface OnboardingLockProps {
  status: OnboardingStatus;
}

const REQUIRED_STEPS = [
  { key: "nom", label: "Ajouter votre nom", to: "/app/parametres" },
  { key: "revenu", label: "Ajouter un revenu", to: "/app/revenus" },
  { key: "depense", label: "Ajouter une dépense", to: "/app/depenses" },
] as const;

/** Écran affiché à la place du chat Iwadu tant que le profil de base
 * (nom, un revenu, une dépense) n'est pas complété. */
export function OnboardingLock({ status }: OnboardingLockProps) {
  const doneMap: Record<string, boolean> = {
    nom: status.hasName,
    revenu: status.hasIncome,
    depense: status.hasExpense,
  };

  return (
    <GlassCard className="p-10 flex flex-col items-center text-center max-w-xl mx-auto">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
      >
        <Icon i="lock" size={22} style={{ color: "white" }} />
      </div>
      <h2 className="text-lg font-headings font-semibold text-foreground mb-2">Iwadu n&apos;est pas encore débloqué</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Complétez votre profil pour activer votre conseiller financier IA personnalisé.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs mb-2">
        {REQUIRED_STEPS.map((step) => {
          const done = doneMap[step.key];
          return (
            <Link
              key={step.key}
              to={step.to}
              className="flex items-center gap-2.5 text-sm px-4 py-2.5 rounded-lg"
              style={{ background: done ? "rgba(16,185,129,0.06)" : "rgba(0,0,0,0.03)" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? "var(--color-primary)" : "transparent",
                  border: done ? "none" : "1.5px solid rgba(0,0,0,0.2)",
                }}
              >
                {done && <Icon i="check" size={12} style={{ color: "white" }} />}
              </span>
              <span
                className="flex-1 text-left"
                style={{
                  color: done ? "var(--color-muted-foreground, #9CA3AF)" : "var(--color-foreground)",
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
    </GlassCard>
  );
}
