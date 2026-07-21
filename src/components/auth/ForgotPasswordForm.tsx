import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/GlassCard";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

type FormValues = z.infer<typeof schema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPasswordForEmail } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await resetPasswordForEmail(values.email);
    if (error) {
      setError("root", { message: error.message });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <GlassCard className="w-full max-w-sm">
        <h1 className="mb-3 text-2xl font-bold text-foreground">Email envoyé</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez
          votre boîte de réception (et vos spams).
        </p>
        <button
          onClick={onBack}
          className="rounded-2xl border border-black/10 px-4 py-2 text-foreground hover:bg-black/5 w-full"
        >
          Retour à la connexion
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Mot de passe oublié</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-foreground placeholder:text-muted-foreground"
        />
        {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
        {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-primary px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Envoyer le lien
        </button>
      </form>
      <button
        onClick={onBack}
        className="mt-3 w-full rounded-2xl border border-black/10 px-4 py-2 text-foreground hover:bg-black/5"
      >
        Retour à la connexion
      </button>
    </GlassCard>
  );
}
