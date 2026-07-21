import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { useAuth } from "@/hooks/useAuth";
import { createGoal } from "@/hooks/useGoals";

const EMOJIS = ["🎯", "🚗", "🏠", "✈️", "📚", "💻", "🎓", "💍", "🏥", "🎁"];
const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#6366F1", "#14B8A6"];

const schema = z.object({
  label: z.string().min(1, "Le nom de l'objectif est requis"),
  montantCible: z.coerce.number().positive("Le montant doit être positif"),
  montantEpargne: z.coerce.number().min(0).optional(),
  contributionMensuelle: z.coerce.number().min(0).optional(),
  dateCible: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface NewGoalModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function NewGoalModal({ onClose, onCreated }: NewGoalModalProps) {
  const { user } = useAuth();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [selectedIcone, setSelectedIcone] = useState(EMOJIS[0]);
  const [selectedCouleur, setSelectedCouleur] = useState(COLORS[0]);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    await createGoal(user.id, {
      label: values.label,
      icone: selectedIcone,
      couleur: selectedCouleur,
      montantCible: values.montantCible,
      montantEpargne: values.montantEpargne ?? 0,
      contributionMensuelle: values.contributionMensuelle ?? 0,
      dateCible: values.dateCible || null,
    });
    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.40)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg relative"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.85)",
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

        <h2 className="text-xl font-headings font-semibold text-foreground mb-1">Nouvel objectif</h2>
        <p className="text-sm text-muted-foreground mb-6">Définissez une cible d'épargne</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Icône</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedIcone(e)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    background: selectedIcone === e ? "rgba(16,185,129,0.15)" : "rgba(0,0,0,0.04)",
                    border: selectedIcone === e ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCouleur(c)}
                  className="w-7 h-7 rounded-full"
                  style={{
                    background: c,
                    outline: selectedCouleur === c ? "2px solid #1a1a2e" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Nom de l'objectif</label>
            <input
              {...register("label")}
              placeholder="Ex: Acheter une voiture"
              className="w-full px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10 text-foreground placeholder:text-muted-foreground outline-none"
            />
            {errors.label && <p className="text-xs text-danger mt-1">{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Montant cible</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                <Controller
                  control={control}
                  name="montantCible"
                  render={({ field }) => (
                    <AmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
                    />
                  )}
                />
                <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
              </div>
              {errors.montantCible && <p className="text-xs text-danger mt-1">{errors.montantCible.message}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Déjà épargné</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                <Controller
                  control={control}
                  name="montantEpargne"
                  render={({ field }) => (
                    <AmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
                    />
                  )}
                />
                <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Épargne mensuelle</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10">
                <Controller
                  control={control}
                  name="contributionMensuelle"
                  render={({ field }) => (
                    <AmountInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0"
                      className="flex-1 min-w-0 bg-transparent outline-none text-foreground"
                    />
                  )}
                />
                <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">Date cible</label>
              <input
                {...register("dateCible")}
                type="date"
                className="w-full px-4 py-3 rounded-lg text-sm bg-white/70 border border-black/10 text-foreground outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm"
              style={{ background: "rgba(0,0,0,0.06)", color: "#1a1a2e" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-sm text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
              }}
            >
              Créer l'objectif
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
