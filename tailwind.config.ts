import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        headings: ["Inter", "sans-serif"],
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        border: "var(--color-border)",
        input: "var(--color-input)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
        glass: {
          DEFAULT: "var(--color-glass)",
          border: "var(--color-glass-border)",
          shadow: "var(--color-glass-shadow)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg)",
        },
        card: {
          bg: "var(--color-card-bg)",
        },
        surface: "var(--color-surface)",
      },
      borderRadius: {
        "3xl": "24px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      backdropBlur: {
        glass: "36px",
      },
    },
  },
  plugins: [],
} satisfies Config;
