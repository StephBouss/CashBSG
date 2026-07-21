import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/auth/PasswordInput";

const schema = z
  .object({
    password: z.string().min(6, "6 caractères minimum"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await updatePassword(values.password);
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {success ? (
          <p className="text-sm text-primary">Mot de passe mis à jour. Redirection…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <PasswordInput
              {...register("password")}
              placeholder="Nouveau mot de passe"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
            />
            {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
            <PasswordInput
              {...register("confirmPassword")}
              placeholder="Confirmer le mot de passe"
              className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
            )}
            {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
            >
              Mettre à jour le mot de passe
            </button>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
