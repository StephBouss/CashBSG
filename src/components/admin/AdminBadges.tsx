import { COUNTRIES } from "@/lib/preferences";
import type { AdminPlan, AdminStatus } from "@/hooks/useAdminDashboard";

const countryByCode = new Map(COUNTRIES.map((c) => [c.code, c]));

const numberFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatDevise(montant: number, devise: string) {
  return `${numberFormatter.format(Math.round(montant))} ${devise}`;
}

export function initials(nom: string | null, email: string | null) {
  const source = nom || email || "?";
  return source.charAt(0).toUpperCase();
}

export function firstName(nom: string | null) {
  if (!nom) return null;
  return nom.split(" ")[0];
}

export function CountryTag({ pays }: { pays: string | null }) {
  const country = pays ? countryByCode.get(pays) : undefined;
  if (!country) {
    return <span className="text-xs text-muted-foreground">Non renseigné</span>;
  }
  return (
    <span className="text-xs text-foreground whitespace-nowrap">
      {country.flag} {country.label}
    </span>
  );
}

const PLAN_META: Record<AdminPlan, { label: string; color: string }> = {
  free: { label: "Iwadu Free", color: "#64748B" },
  essentiel: { label: "Iwadu Essentiel", color: "var(--color-secondary)" },
  pro: { label: "Iwadu Pro", color: "#7C3AED" },
};

export function PlanBadge({ plan }: { plan: AdminPlan }) {
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: `${meta.color}18`, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: AdminStatus }) {
  const active = status === "actif";
  const color = active ? "#10B981" : "#94A3B8";
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1"
      style={{ background: `${color}18`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {active ? "Actif" : "Inactif"}
    </span>
  );
}
