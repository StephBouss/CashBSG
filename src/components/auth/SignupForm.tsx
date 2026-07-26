import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Icon } from "@/components/ui/Icon";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import logoFull from "@/assets/logo-full.png";

const signupSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "6 caractères minimum"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signUpWithPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupFormValues) => {
    const { data, error } = await signUpWithPassword(values.email, values.password);
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    if (data.session) {
      navigate("/app");
      return;
    }
    setConfirmationEmail(values.email);
  };

  if (confirmationEmail) {
    return (
      <GlassCard className="w-full max-w-sm text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(16,185,129,0.12)" }}
        >
          <Icon i="mail" size={22} style={{ color: "#10B981" }} />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">Vérifiez votre boîte mail</h1>
        <p className="text-sm text-muted-foreground">
          Un email de confirmation vient d&apos;être envoyé à <strong>{confirmationEmail}</strong>.
          Cliquez sur le lien qu&apos;il contient pour activer votre compte, puis connectez-vous.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block w-full rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Retour à la connexion
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-sm">
      <Link to="/" className="mb-6 flex justify-center">
        <img src={logoFull} alt="Iwadu Cash" className="h-14" />
      </Link>
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Créer un compte</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
        />
        {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        <PasswordInput
          {...register("password")}
          placeholder="Mot de passe"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
        />
        {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        <PasswordInput
          {...register("confirmPassword")}
          placeholder="Confirmer le mot de passe"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
        />
        {errors.confirmPassword && <p className="text-sm text-danger">{errors.confirmPassword.message}</p>}
        {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Créer mon compte
        </button>
      </form>
      <button
        onClick={() => signInWithGoogle()}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 px-4 py-2 font-medium text-foreground hover:bg-black/5"
      >
        <GoogleIcon size={18} />
        Continuer avec Google
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà un compte ? <Link to="/login" className="text-primary">Se connecter</Link>
      </p>
    </GlassCard>
  );
}
