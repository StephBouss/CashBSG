import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/auth/PasswordInput";

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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values: SignupFormValues) => {
    const { error } = await signUpWithPassword(values.email, values.password);
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    navigate("/");
  };

  return (
    <GlassCard className="w-full max-w-sm">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Créer un compte Budget+</h1>
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
        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-2 text-foreground hover:bg-black/5"
      >
        Continuer avec Google
      </button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Déjà un compte ? <a href="/login" className="text-primary">Se connecter</a>
      </p>
    </GlassCard>
  );
}
