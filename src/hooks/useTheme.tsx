import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfilePreferences } from "@/hooks/useProfile";

export const THEMES = [
  { id: "vert-clair", label: "Vert clair", gradient: "linear-gradient(135deg, #EEF0F5, #E8EBF2)", accent: "#10B981" },
  { id: "vert-nuit", label: "Vert nuit", gradient: "linear-gradient(135deg, #0B1F1A, #0E2620)", accent: "#34D399" },
  { id: "bleu-clair", label: "Bleu clair", gradient: "linear-gradient(135deg, #EAF1FB, #E2EDFA)", accent: "#3B82F6" },
  { id: "gris-nuit", label: "Gris nuit", gradient: "linear-gradient(135deg, #17181C, #1C1D22)", accent: "#10B981" },
  { id: "orange-clair", label: "Orangé clair", gradient: "linear-gradient(135deg, #FDF3EA, #FBEBDD)", accent: "#F59E0B" },
  { id: "violet-clair", label: "Violet clair", gradient: "linear-gradient(135deg, #F3F0FB, #ECE7F9)", accent: "#8B5CF6" },
  { id: "violet-nuit", label: "Violet nuit", gradient: "linear-gradient(135deg, #150F26, #190F2E)", accent: "#A78BFA" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const DEFAULT_THEME: ThemeId = "vert-clair";
const STORAGE_KEY = "iwadu-theme";

function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value);
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updatePreferences = useUpdateProfilePreferences();

  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (profile?.theme && isThemeId(profile.theme) && profile.theme !== theme) {
      setThemeState(profile.theme);
      window.localStorage.setItem(STORAGE_KEY, profile.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    if (user) updatePreferences({ theme: next }).catch(() => {});
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé à l'intérieur d'un ThemeProvider.");
  return ctx;
}
