import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { createExpense } from "@/hooks/useExpenses";
import { createIncome } from "@/hooks/useIncomes";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const schema = z.object({
  nom: z.string().min(1, "La description est requise"),
  montant: z.coerce.number().positive("Le montant doit être positif"),
  categoryId: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  frequence: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddTransactionModalProps {
  onClose: () => void;
  onCreated: () => void;
  defaultType?: "revenu" | "depense";
}

export function AddTransactionModal({ onClose, onCreated, defaultType = "depense" }: AddTransactionModalProps) {
  const [type, setType] = useState<"revenu" | "depense">(defaultType);
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const filteredCategories = categories.filter((c) => c.type === type);
  useEscapeKey(onClose);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    if (type === "revenu") {
      await createIncome(user.id, {
        nom: values.nom,
        montant: values.montant,
        categoryId: values.categoryId,
        date: values.date,
        frequence: values.frequence,
      });
    } else {
      await createExpense(user.id, {
        nom: values.nom,
        montant: values.montant,
        categoryId: values.categoryId,
        dateEcheance: values.date,
      });
    }

    reset();
    onCreated();
    onClose();
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- fond de fermeture au clic, équivalent clavier via Échap (useEscapeKey) et le bouton "x" ci-dessous
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.40)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg relative"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.95)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
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

        <h2 className="text-xl font-headings font-semibold text-foreground mb-1">
          Ajouter une transaction
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Revenu ou dépense</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setType("revenu")}
              className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
              style={{
                background: type === "revenu" ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.04)",
                color: type === "revenu" ? "var(--color-primary)" : "var(--color-ink)",
                border: type === "revenu" ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
              }}
            >
              + Revenu
            </button>
            <button
              type="button"
              onClick={() => setType("depense")}
              className="flex-1 py-2 px-4 rounded-lg font-medium text-sm"
              style={{
                background: type === "depense" ? "rgba(239,68,68,0.08)" : "rgba(0,0,0,0.04)",
                color: type === "depense" ? "#7F1D1D" : "var(--color-ink)",
                border: type === "depense" ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
              }}
            >
              - Dépense
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label htmlFor="tx-nom" className="text-xs font-semibold text-foreground block mb-1.5">Description</label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <Icon i="edit-2" size={14} />
                <input
                  id="tx-nom"
                  {...register("nom")}
                  placeholder="Ex: Salaire principal"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              {errors.nom && <p className="text-xs text-danger mt-1">{errors.nom.message}</p>}
            </div>

            <div>
              <label htmlFor="tx-montant" className="text-xs font-semibold text-foreground block mb-1.5">Montant (FCFA)</label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <Controller
                  control={control}
                  name="montant"
                  render={({ field }) => (
                    <AmountInput
                      id="tx-montant"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  )}
                />
                <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
              </div>
              {errors.montant && <p className="text-xs text-danger mt-1">{errors.montant.message}</p>}
            </div>

            <div>
              <label htmlFor="tx-category" className="text-xs font-semibold text-foreground block mb-1.5">Catégorie</label>
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <select
                  id="tx-category"
                  {...register("categoryId")}
                  className="flex-1 bg-transparent outline-none text-foreground"
                >
                  <option value="">Sélectionner</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
                <Icon i="chevron-down" size={14} />
              </div>
            </div>

            <div>
              <label htmlFor="tx-date" className="text-xs font-semibold text-foreground block mb-1.5">Date</label>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <Icon i="calendar" size={14} />
                <input
                  id="tx-date"
                  {...register("date")}
                  type="date"
                  className="flex-1 bg-transparent outline-none text-foreground"
                />
              </div>
              {errors.date && <p className="text-xs text-danger mt-1">{errors.date.message}</p>}
            </div>

            {type === "revenu" && (
              <div>
                <label htmlFor="tx-frequence" className="text-xs font-semibold text-foreground block mb-1.5">Fréquence</label>
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
                  style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <select
                    id="tx-frequence"
                    {...register("frequence")}
                    className="flex-1 bg-transparent outline-none text-foreground"
                  >
                    <option value="">Une seule fois</option>
                    <option value="mensuel">Mensuel</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
              </div>
            )}
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
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
              }}
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
