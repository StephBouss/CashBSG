import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { createSavingsAccount, updateSavingsAccount } from "@/hooks/useSavingsAccounts";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { SavingsAccount, SavingsAccountType, SavingsContributionMode } from "@/types/budget";

interface NewSavingsAccountModalProps {
  type: SavingsAccountType;
  account?: SavingsAccount;
  onClose: () => void;
  onCreated: () => void;
}

const labels: Record<SavingsAccountType, { title: string; placeholder: string }> = {
  epargne: { title: "Nouvelle épargne", placeholder: "Ex: Épargne de précaution" },
  investissement: { title: "Nouvel investissement", placeholder: "Ex: Actions, Immobilier locatif" },
};

export function NewSavingsAccountModal({ type, account, onClose, onCreated }: NewSavingsAccountModalProps) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const revenuCategories = categories.filter((c) => c.type === "revenu");
  const isEditing = !!account;

  const [nom, setNom] = useState(account?.nom ?? "");
  const [mode, setMode] = useState<SavingsContributionMode>(account?.mode ?? "montant");
  const [montantFixe, setMontantFixe] = useState<number | undefined>(account?.montantFixe ?? undefined);
  const [pourcentage, setPourcentage] = useState<number | undefined>(account?.pourcentage ?? undefined);
  const [categoryId, setCategoryId] = useState<string>(account?.categoryId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { placeholder } = labels[type];
  const title = isEditing ? "Modifier l'entrée" : labels[type].title;
  useEscapeKey(onClose);

  const onSubmit = async () => {
    if (!user) return;
    if (!nom.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (mode === "montant" && (!montantFixe || montantFixe <= 0)) {
      setError("Le montant doit être positif");
      return;
    }
    if (mode === "pourcentage" && (!pourcentage || pourcentage <= 0)) {
      setError("Le pourcentage doit être positif");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const input = {
        nom: nom.trim(),
        mode,
        montantFixe,
        pourcentage,
        categoryId: categoryId || null,
      };
      if (isEditing) {
        await updateSavingsAccount(account.id, input);
      } else {
        await createSavingsAccount(user.id, type, input);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- fond de fermeture au clic, équivalent clavier via Échap (useEscapeKey) et le bouton "x" ci-dessous
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.40)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-sm p-6 rounded-lg relative max-h-[90vh] overflow-y-auto"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.85)",
          boxShadow: "0 24px 64px rgba(120,120,180,0.20)",
        }}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          <Icon i="x" size={16} />
        </button>

        <h2 className="text-xl font-headings font-semibold text-foreground mb-6">{title}</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="savings-nom" className="text-xs font-semibold text-foreground block mb-1.5">Nom</label>
            <input
              id="savings-nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10 text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground block mb-1.5">
              Comment alimenter ce compte ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode("montant")}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
                style={{
                  background: mode === "montant" ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.04)",
                  color: mode === "montant" ? "var(--color-primary)" : "var(--color-ink)",
                  border: mode === "montant" ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
                }}
              >
                Montant fixe
              </button>
              <button
                type="button"
                onClick={() => setMode("pourcentage")}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
                style={{
                  background: mode === "pourcentage" ? "rgba(59,130,246,0.15)" : "rgba(0,0,0,0.04)",
                  color: mode === "pourcentage" ? "var(--color-secondary)" : "var(--color-ink)",
                  border: mode === "pourcentage" ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                }}
              >
                % d'un revenu
              </button>
            </div>
          </div>

          {mode === "montant" ? (
            <div>
              <label htmlFor="savings-montant-fixe" className="text-xs font-semibold text-foreground block mb-1.5">
                Montant mensuel visé
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                <AmountInput
                  id="savings-montant-fixe"
                  value={montantFixe}
                  onChange={setMontantFixe}
                  placeholder="0"
                  className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
                />
                <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="savings-pourcentage" className="text-xs font-semibold text-foreground block mb-1.5">Pourcentage</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                  <input
                    id="savings-pourcentage"
                    value={pourcentage ?? ""}
                    onChange={(e) => setPourcentage(e.target.value ? Number(e.target.value) : undefined)}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <label htmlFor="savings-category" className="text-xs font-semibold text-foreground block mb-1.5">Source du revenu</label>
                <div className="flex items-center justify-between px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                  <select
                    id="savings-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-foreground"
                  >
                    <option value="">Tous les revenus</option>
                    {revenuCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                  <Icon i="chevron-down" size={14} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Le montant suggéré chaque mois sera calculé sur ce revenu précis, ou sur l'ensemble de
                  vos revenus si vous laissez "Tous les revenus".
                </p>
              </div>
            </>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
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
            {isEditing ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
