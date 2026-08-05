import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TrendLineChart } from "@/components/ui/TrendLineChart";
import { formatMontant } from "@/lib/formatters";
import { useSavingsMovements, useSavingsAccountBalance, createSavingsMovement } from "@/hooks/useSavingsMovements";
import { deleteSavingsAccount } from "@/hooks/useSavingsAccounts";
import { useIncomes } from "@/hooks/useIncomes";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { AddMovementModal } from "@/components/finances/AddMovementModal";
import { NewSavingsAccountModal } from "@/components/finances/NewSavingsAccountModal";
import type { SavingsAccount } from "@/types/budget";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

interface SavingsAccountCardProps {
  account: SavingsAccount;
  color: string;
  onChanged: () => void;
}

export function SavingsAccountCard({ account, color, onChanged }: SavingsAccountCardProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const devise = profile?.devise ?? "FCFA";
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addingSuggested, setAddingSuggested] = useState(false);
  const { data: movements = [], refetch } = useSavingsMovements(account.id);
  const { data: balance = 0 } = useSavingsAccountBalance(account.id);
  const { data: incomes = [] } = useIncomes(undefined, { realtime: false });
  const { data: categories = [] } = useCategories();

  const evolutionPoints = useMemo(() => {
    let running = 0;
    return movements.map((m) => {
      running += m.montant;
      return { label: dateFormatter.format(new Date(m.date)), value: running };
    });
  }, [movements]);

  const categoryNom = account.categoryId
    ? categories.find((c) => c.id === account.categoryId)?.nom
    : null;

  const suggestedAmount = useMemo(() => {
    if (account.mode !== "pourcentage" || !account.pourcentage) return 0;
    const base = account.categoryId
      ? incomes.filter((i) => i.categoryId === account.categoryId)
      : incomes;
    const total = base.reduce((s, i) => s + i.montant, 0);
    return Math.round(total * (account.pourcentage / 100));
  }, [account.mode, account.pourcentage, account.categoryId, incomes]);

  const ruleLabel =
    account.mode === "montant"
      ? account.montantFixe
        ? `Objectif : ${formatMontant(account.montantFixe, devise)}/mois`
        : null
      : `${account.pourcentage}% de ${categoryNom ?? "tous les revenus"}`;

  const addSuggested = async () => {
    if (!user || suggestedAmount <= 0) return;
    setAddingSuggested(true);
    try {
      await createSavingsMovement(user.id, account.id, suggestedAmount, new Date().toISOString().slice(0, 10));
      refetch();
      onChanged();
    } finally {
      setAddingSuggested(false);
    }
  };

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.58)",
        backdropFilter: "blur(32px)",
        border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
        boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{account.nom}</h3>
          <p className="text-lg font-semibold mt-1" style={{ color }}>
            {formatMontant(balance, devise)}
          </p>
          {ruleLabel && <p className="text-xs text-muted-foreground mt-0.5">{ruleLabel}</p>}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setModalOpen(true)}
            className="p-1.5 rounded text-xs"
            style={{ background: `${color}20`, color }}
          >
            <Icon i="plus" size={14} />
          </button>
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-1.5 rounded text-xs"
            style={{ background: "rgba(0,0,0,0.06)", color: "var(--color-ink)" }}
          >
            <Icon i="edit-2" size={13} />
          </button>
          <button
            onClick={() => deleteSavingsAccount(account.id).then(onChanged)}
            className="p-1.5 rounded text-xs"
            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
          >
            <Icon i="trash-2" size={13} />
          </button>
        </div>
      </div>

      {evolutionPoints.length > 0 ? (
        <TrendLineChart points={evolutionPoints} color={color} height={100} />
      ) : (
        <p className="text-xs text-muted-foreground">Aucun mouvement pour l'instant.</p>
      )}

      {account.mode === "pourcentage" && suggestedAmount > 0 && (
        <button
          onClick={addSuggested}
          disabled={addingSuggested}
          className="w-full mt-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60"
          style={{ background: color, boxShadow: `0 2px 8px ${color}40` }}
        >
          + Ajouter {formatMontant(suggestedAmount, devise)} (suggéré ce mois-ci)
        </button>
      )}

      {modalOpen && (
        <AddMovementModal
          accountId={account.id}
          accountNom={account.nom}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            refetch();
            onChanged();
          }}
        />
      )}

      {editModalOpen && (
        <NewSavingsAccountModal
          type={account.type}
          account={account}
          onClose={() => setEditModalOpen(false)}
          onCreated={onChanged}
        />
      )}
    </div>
  );
}
