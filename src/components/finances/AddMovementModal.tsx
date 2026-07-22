import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { useAuth } from "@/hooks/useAuth";
import { createSavingsMovement } from "@/hooks/useSavingsMovements";

interface AddMovementModalProps {
  accountId: string;
  accountNom: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AddMovementModal({ accountId, accountNom, onClose, onCreated }: AddMovementModalProps) {
  const { user } = useAuth();
  const [sens, setSens] = useState<"depot" | "retrait">("depot");
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!user) return;
    const value = montant ?? 0;
    if (!value || value <= 0) {
      setError("Le montant doit être positif");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createSavingsMovement(user.id, accountId, sens === "depot" ? value : -value, date);
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.40)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm p-6 rounded-lg relative"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.85)",
          boxShadow: "0 24px 64px rgba(120,120,180,0.20)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <Icon i="x" size={16} />
        </button>

        <h2 className="text-xl font-headings font-semibold text-foreground mb-1">Ajouter un mouvement</h2>
        <p className="text-sm text-muted-foreground mb-6">{accountNom}</p>

        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSens("depot")}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
            style={{
              background: sens === "depot" ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.04)",
              color: sens === "depot" ? "var(--color-primary)" : "var(--color-ink)",
              border: sens === "depot" ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
            }}
          >
            + Dépôt
          </button>
          <button
            type="button"
            onClick={() => setSens("retrait")}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
            style={{
              background: sens === "retrait" ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.04)",
              color: sens === "retrait" ? "#7F1D1D" : "var(--color-ink)",
              border: sens === "retrait" ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
            }}
          >
            - Retrait
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Montant</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
              <AmountInput
                value={montant}
                onChange={setMontant}
                placeholder="0"
                className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
              />
              <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Date</label>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              className="w-full px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10 text-foreground outline-none"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm"
            style={{ background: "rgba(0,0,0,0.06)", color: "var(--color-ink)" }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm text-white disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
            }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
