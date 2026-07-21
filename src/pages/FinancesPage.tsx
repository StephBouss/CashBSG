import { useState } from "react";
import { TitheSection } from "@/components/finances/TitheSection";
import { SavingsSection } from "@/components/finances/SavingsSection";

const TABS = [
  { key: "dime", label: "Dîme" },
  { key: "epargne", label: "Épargne" },
  { key: "investissement", label: "Investissement" },
] as const;

export default function FinancesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("dime");

  return (
    <div className="flex flex-col min-w-0">
      <div className="mb-6">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Finances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Dîme, épargne et investissements</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={
              tab === t.key
                ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }
                : { background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.08)", color: "#1a1a2e" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dime" && <TitheSection />}
      {tab === "epargne" && <SavingsSection type="epargne" title="Mes épargnes" color="#3B82F6" />}
      {tab === "investissement" && (
        <SavingsSection type="investissement" title="Mes investissements" color="#6366F1" />
      )}
    </div>
  );
}
