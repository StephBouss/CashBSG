import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: Session["user"] | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signUpWithPassword: (email: string, password: string) => ReturnType<typeof supabase.auth.signUp>;
  signInWithGoogle: () => ReturnType<typeof supabase.auth.signInWithOAuth>;
  signOut: () => ReturnType<typeof supabase.auth.signOut>;
  resetPasswordForEmail: (email: string) => ReturnType<typeof supabase.auth.resetPasswordForEmail>;
  updatePassword: (password: string) => ReturnType<typeof supabase.auth.updateUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    signInWithPassword: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUpWithPassword: (email, password) =>
      supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app` },
      }),
    signOut: () => supabase.auth.signOut(),
    resetPasswordForEmail: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
      }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
  return ctx;
}
