import { useState } from "react";
import { SavingsSection } from "@/components/finances/SavingsSection";

const TABS = [
  { key: "epargne", label: "Épargne" },
  { key: "investissement", label: "Investissement" },
] as const;

export default function FinancesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("epargne");

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Finances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Épargne et investissements — créez un compte « Dîme » pour la suivre ici.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={
              tab === t.key
                ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "var(--color-primary)" }
                : { background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(0,0,0,0.08)", color: "var(--color-ink)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "epargne" && <SavingsSection type="epargne" title="Mes épargnes" color="var(--color-secondary)" />}
      {tab === "investissement" && (
        <SavingsSection type="investissement" title="Mes investissements" color="#6366F1" />
      )}
    </div>
  );
}
