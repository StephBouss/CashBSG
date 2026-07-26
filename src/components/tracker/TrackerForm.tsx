import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@/components/ui/Icon";
import { AmountInput } from "@/components/ui/AmountInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { createTrackedExpense } from "@/hooks/useExpenseTracker";
import type { Category } from "@/types/budget";

const schema = z.object({
  nom: z.string().min(1, "Le nom de la dépense est requis"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  montant: z.coerce.number().positive("Le coût doit être positif"),
});

type FormValues = z.infer<typeof schema>;

interface TrackerFormProps {
  categories: Category[];
  onCreated: () => void;
}

export function TrackerForm({ categories, onCreated }: TrackerFormProps) {
  const { user } = useAuth();
  const depenseCategories = categories.filter((c) => c.type === "depense");

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    await createTrackedExpense(user.id, {
      nom: values.nom,
      categoryId: values.categoryId,
      montant: values.montant,
    });
    reset({ nom: "", categoryId: "", montant: undefined });
    onCreated();
  };

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon i="zap" size={16} style={{ color: "var(--color-primary)" }} />
        <p className="text-sm font-semibold text-foreground">Nouvelle dépense</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-semibold text-foreground block mb-1.5">Nom de la dépense</label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
            style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <Icon i="edit-2" size={14} />
            <input
              {...register("nom")}
              placeholder="Ex: Déjeuner"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>
          {errors.nom && <p className="text-xs text-danger mt-1">{errors.nom.message}</p>}
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-xs font-semibold text-foreground block mb-1.5">Catégorie</label>
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg text-sm"
            style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <select
              {...register("categoryId")}
              defaultValue=""
              className="flex-1 bg-transparent outline-none text-foreground min-w-0"
            >
              <option value="" disabled>
                Sélectionner
              </option>
              {depenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            <Icon i="chevron-down" size={14} />
          </div>
          {errors.categoryId && <p className="text-xs text-danger mt-1">{errors.categoryId.message}</p>}
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-xs font-semibold text-foreground block mb-1.5">Coût total (FCFA)</label>
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
            style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <Controller
              control={control}
              name="montant"
              render={({ field }) => (
                <AmountInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="0"
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
                />
              )}
            />
            <span className="text-xs font-semibold text-muted-foreground">FCFA</span>
          </div>
          {errors.montant && <p className="text-xs text-danger mt-1">{errors.montant.message}</p>}
        </div>

        <div className="flex-shrink-0 sm:pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm text-white disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              boxShadow: "0 4px 16px rgba(16,185,129,0.25)",
            }}
          >
            <Icon i="zap" size={14} className="text-white" />
            Tracker dépense
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
