import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import logoFull from "@/assets/logo-full.png";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-gradient, #F5F6FA)" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src={logoFull} alt="Iwadu Cash" className="h-9" />
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
          style={{ color: "var(--color-primary)" }}
        >
          <Icon i="chevron-right" size={14} style={{ transform: "rotate(180deg)" }} />
          Retour à l&apos;accueil
        </Link>

        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
          }}
        >
          <h1 className="text-2xl font-headings font-semibold text-foreground mb-1">{title}</h1>
          <p className="text-xs text-muted-foreground mb-8">Dernière mise à jour : {updatedAt}</p>

          <div className="flex flex-col gap-6 text-sm leading-relaxed text-foreground" style={{ opacity: 0.85 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-headings font-semibold text-foreground mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
