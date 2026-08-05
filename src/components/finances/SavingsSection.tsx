import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useSavingsAccounts } from "@/hooks/useSavingsAccounts";
import { useProfile } from "@/hooks/useProfile";
import { effectivePlan, SAVINGS_ACCOUNT_LIMIT } from "@/lib/plan";
import { SavingsAccountCard } from "@/components/finances/SavingsAccountCard";
import { NewSavingsAccountModal } from "@/components/finances/NewSavingsAccountModal";
import type { SavingsAccountType } from "@/types/budget";

interface SavingsSectionProps {
  type: SavingsAccountType;
  title: string;
  color: string;
}

export function SavingsSection({ type, title, color }: SavingsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: accounts = [], refetch } = useSavingsAccounts(type);
  const { data: profile } = useProfile();

  const plan = profile ? effectivePlan(profile.plan, profile.planExpiresAt) : "free";
  const limit = SAVINGS_ACCOUNT_LIMIT[plan][type];
  const limitReached = limit !== null && accounts.length >= limit;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <button
          onClick={() => setModalOpen(true)}
          disabled={limitReached}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color} 100%)`,
            boxShadow: `0 4px 16px ${color}40`,
          }}
        >
          <Icon i="plus" size={14} className="text-white" />
          Ajouter
        </button>
      </div>

      {limitReached && (
        <p className="text-xs mb-4 px-2" style={{ color: "#EF4444" }}>
          Vous avez atteint la limite de {limit} compte{limit > 1 ? "s" : ""} pour votre formule.{" "}
          <Link to="/app/mise-a-niveau" className="underline font-medium">
            Passez à un plan supérieur
          </Link>
          .
        </p>
      )}

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground px-2">Aucune entrée pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {accounts.map((account) => (
            <SavingsAccountCard key={account.id} account={account} color={color} onChanged={refetch} />
          ))}
        </div>
      )}

      {modalOpen && (
        <NewSavingsAccountModal type={type} onClose={() => setModalOpen(false)} onCreated={refetch} />
      )}
    </div>
  );
}
