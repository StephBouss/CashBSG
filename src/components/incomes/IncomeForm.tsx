import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Category } from "@/types/budget";

const incomeSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  montant: z.coerce.number().positive("Le montant doit être positif"),
  categoryId: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

interface IncomeFormProps {
  categories: Category[];
  onCreated: () => void;
}

export function IncomeForm({ categories, onCreated }: IncomeFormProps) {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({ resolver: zodResolver(incomeSchema) });

  const onSubmit = async (values: IncomeFormValues) => {
    if (!user) return;
    const { error } = await supabase.from("incomes").insert({
      user_id: user.id,
      nom: values.nom,
      montant: values.montant,
      category_id: values.categoryId || null,
      date: values.date,
    });
    if (error) throw error;
    reset();
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <input
        {...register("nom")}
        placeholder="Nom du revenu"
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
      />
      <input
        {...register("montant")}
        type="number"
        placeholder="Montant (FCFA)"
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
      />
      <select
        {...register("categoryId")}
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground"
      >
        <option value="">Catégorie</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nom}
          </option>
        ))}
      </select>
      <input
        {...register("date")}
        type="date"
        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90 sm:col-span-4"
      >
        Ajouter le revenu
      </button>
      {Object.values(errors).map((error, i) => (
        <p key={i} className="text-sm text-danger sm:col-span-4">
          {error?.message as string}
        </p>
      ))}
    </form>
  );
}
