import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import logoFull from "@/assets/logo-full.png";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signInWithPassword, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await signInWithPassword(values.email, values.password);
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    navigate("/app");
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <GlassCard className="w-full max-w-sm">
      <Link to="/" className="mb-6 flex justify-center">
        <img src={logoFull} alt="Iwadu Cash" className="h-14" />
      </Link>
      <h1 className="mb-6 text-center text-2xl font-bold text-foreground">Bienvenue</h1>
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
        {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
        <button
          type="button"
          onClick={() => setShowForgotPassword(true)}
          className="text-right text-xs text-primary"
        >
          Mot de passe oublié ?
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Se connecter
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
        Pas de compte ? <Link to="/signup" className="text-primary">Créer un compte</Link>
      </p>
    </GlassCard>
  );
}
