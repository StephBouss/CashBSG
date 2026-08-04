import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";
import logoIcon from "@/assets/logo-icon.png";

const testimonials = [
  { name: "Aminata Diallo", job: "Entrepreneur", text: "Grâce à Iwadu Cash, j'épargne chaque mois sans effort. En 3 mois j'ai atteint mon fonds d'urgence." },
  { name: "Kofi Mensah", job: "Ingénieur salarié", text: "J'avais toujours des surprises en fin de mois. Maintenant je sais exactement où va chaque franc." },
  { name: "Fatou Ba", job: "Freelance designer", text: "La fonction objectifs m'a aidée à financer mon voyage en 6 mois. Je recommande à tous les jeunes actifs." },
];

const forWho = [
  { icon: "briefcase", label: "Salariés" },
  { icon: "trending-up", label: "Entrepreneurs" },
  { icon: "laptop", label: "Freelances" },
  { icon: "users", label: "Couples" },
  { icon: "home", label: "Familles" },
  { icon: "book-open", label: "Étudiants" },
  { icon: "bar-chart-2", label: "Investisseurs" },
  { icon: "zap", label: "Jeunes actifs" },
];

const faqs = [
  { q: "Puis-je gérer plusieurs comptes ?", a: "Oui, Iwadu Cash supporte plusieurs comptes d'épargne et d'investissement en simultané." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont hébergées de façon sécurisée via Supabase et ne sont jamais revendues." },
  { q: "Existe-t-il une application mobile ?", a: "Iwadu Cash est disponible en version Web, accessible depuis n'importe quel navigateur mobile." },
  { q: "Puis-je exporter mes rapports ?", a: "L'export PDF et Excel de vos rapports est prévu dans une prochaine mise à jour." },
];

interface PricingItem {
  label: string;
  valeur: number;
}

const essentielItems: PricingItem[] = [
  { label: "Gestion illimitée des revenus", valeur: 50000 },
  { label: "Gestion des dépenses & échéances", valeur: 35000 },
  { label: "Épargne & investissement personnels", valeur: 40000 },
  { label: "Objectifs financiers illimités", valeur: 35000 },
  { label: "Rapports & statistiques détaillés", valeur: 25000 },
  { label: "Historique complet & synchronisation cloud", valeur: 25000 },
  { label: "Sauvegarde sécurisée des données", valeur: 15000 },
];

const gratuitLabels = new Set([
  "Gestion illimitée des revenus",
  "Gestion des dépenses & échéances",
  "Épargne & investissement personnels",
  "Rapports & statistiques détaillés",
  "Sauvegarde sécurisée des données",
]);
const gratuitItems: PricingItem[] = essentielItems.filter((item) => gratuitLabels.has(item.label));

const iaItem: PricingItem = { label: "Assistant IA personnalisé (conseils & analyses)", valeur: 25000 };

const businessItems: PricingItem[] = [
  { label: "Accompagnement prioritaire", valeur: 20000 },
  { label: "Accès anticipé aux nouvelles fonctionnalités", valeur: 10000 },
];

const priceFormatter = new Intl.NumberFormat("fr-FR");

function totalValeur(items: PricingItem[]) {
  return items.reduce((sum, item) => sum + item.valeur, 0);
}

interface Plan {
  key: string;
  title: string;
  subtitle: string;
  items: PricingItem[];
  prixAppel: number;
  /** Prix "avant réduction" affiché barré — uniquement sur l'offre populaire. */
  prixBarre?: number;
  featured: boolean;
  free: boolean;
}

const plans: Plan[] = [
  {
    key: "gratuit",
    title: "Iwadu Free",
    subtitle: "Pour découvrir Iwadu Cash",
    items: gratuitItems,
    prixAppel: 0,
    featured: false,
    free: true,
  },
  {
    key: "essentiel",
    title: "Iwadu Essentiel",
    subtitle: "Tout ce qu'il faut pour démarrer",
    items: essentielItems,
    prixAppel: 5000,
    featured: false,
    free: false,
  },
  {
    key: "complet",
    title: "Iwadu Pro",
    subtitle: "Tout l'essentiel + l'IA",
    items: [...essentielItems, iaItem],
    prixAppel: 15000,
    prixBarre: 20000,
    featured: true,
    free: false,
  },
  {
    key: "business",
    title: "Iwadu Business",
    subtitle: "Pour aller plus loin, en priorité",
    items: [...essentielItems, iaItem, ...businessItems],
    prixAppel: 25000,
    featured: false,
    free: false,
  },
];

function GlassSection({
  children,
  background,
  id,
  dark = false,
}: {
  children: ReactNode;
  background: string;
  id?: string;
  dark?: boolean;
}) {
  return (
    <div
      id={id}
      className="relative overflow-hidden px-8 md:px-16 py-24"
      style={{ background, colorScheme: dark ? "dark" : "light" }}
    >
      {children}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}
    >
      {initials}
    </div>
  );
}

export function LandingSocialProof() {
  return (
    <>
      {/* Comparison */}
      <GlassSection id="comparaison" background="linear-gradient(160deg, #EAF0FA 0%, #E1EBF8 100%)">
        <Reveal className="text-center mb-14 relative z-10">
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Pourquoi choisir Iwadu Cash ?
          </h2>
        </Reveal>

        <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto relative z-10">
          <Reveal className="flex-1">
            <div className="rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1" style={{ boxShadow: "0 8px 32px rgba(120,120,180,0.09)" }}>
              <div className="px-6 py-4 text-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "16px 16px 0 0" }}>
                <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>Sans Iwadu Cash</p>
              </div>
              <div className="p-6 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(32px)", border: "1px solid rgba(239,68,68,0.12)", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                {["Excel", "Calculs manuels", "Factures oubliées", "Vision floue", "Stress"].map((v) => (
                  <div key={v} className="flex items-center gap-3">
                    <Icon i="x" size={14} style={{ color: "#EF4444" }} />
                    <p className="text-sm text-foreground" style={{ opacity: 0.65 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="flex-1" delay={120}>
            <div className="rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1" style={{ boxShadow: "0 8px 32px rgba(16,185,129,0.12)" }}>
              <div className="px-6 py-4 text-center" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: "16px 16px 0 0" }}>
                <p className="text-sm font-semibold" style={{ color: "#10B981" }}>Avec Iwadu Cash ✨</p>
              </div>
              <div className="p-6 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(32px)", border: "1px solid rgba(16,185,129,0.18)", borderTop: "none", borderRadius: "0 0 16px 16px" }}>
                {["Automatisation complète", "Calculs en temps réel", "Alertes intelligentes", "Tableau de bord clair", "Contrôle total"].map((v) => (
                  <div key={v} className="flex items-center gap-3">
                    <Icon i="check" size={14} style={{ color: "#10B981" }} />
                    <p className="text-sm font-medium text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </GlassSection>

      {/* Pricing */}
      <GlassSection id="tarifs" dark background="linear-gradient(160deg, #0F1C2B 0%, #16283C 100%)">
        <div
          className="absolute pointer-events-none animate-blob"
          style={{ top: "-100px", left: "50%", transform: "translateX(-50%)", width: "560px", height: "560px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)" }}
        />
        <Reveal>
          <div className="text-center mb-14 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5" style={{ background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.35)", color: "#34D399" }}>
              Tarifs
            </div>
            <h2 className="font-headings font-semibold mb-3" style={{ fontSize: "36px", color: "#FFFFFF" }}>
              La valeur de votre abonnement
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
              Chaque fonctionnalité a une valeur. Additionnées, elles valent bien plus que ce que vous
              payez réellement. Choisissez la formule qui vous ressemble.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto relative z-10 items-start">
          {plans.map((plan, planIndex) => {
            const valeurTotale = totalValeur(plan.items);
            const reduction = plan.prixBarre
              ? Math.round((1 - plan.prixAppel / plan.prixBarre) * 100)
              : null;

            return (
              <Reveal key={plan.key} delay={planIndex * 140}>
                <div
                  className={`rounded-3xl overflow-hidden transition-transform duration-300 relative h-full flex flex-col ${
                    plan.featured ? "lg:-translate-y-3 hover:lg:-translate-y-4" : "hover:-translate-y-1.5"
                  }`}
                  style={{
                    background: plan.featured
                      ? "linear-gradient(160deg, #0F2D22 0%, #0B1F2E 100%)"
                      : "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(40px)",
                    border: plan.featured ? "2px solid #34D399" : "1px solid rgba(16,185,129,0.3)",
                    boxShadow: plan.featured
                      ? "0 44px 110px rgba(16,185,129,0.4), 0 8px 32px rgba(0,0,0,0.35)"
                      : "0 32px 80px rgba(0,0,0,0.22)",
                  }}
                >
                  {plan.featured && (
                    <div
                      className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-xs font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                    >
                      👑 Le plus populaire
                    </div>
                  )}

                  <div
                    className="px-8 py-6 border-b"
                    style={{ borderColor: plan.featured ? "rgba(52,211,153,0.25)" : "rgba(16,185,129,0.15)" }}
                  >
                    <p
                      className="font-headings font-semibold"
                      style={{ color: plan.featured ? "#34D399" : "#10B981", fontSize: "22px" }}
                    >
                      {plan.title}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: plan.featured ? "rgba(255,255,255,0.55)" : undefined }}
                    >
                      {!plan.featured && <span className="text-muted-foreground">{plan.subtitle}</span>}
                      {plan.featured && plan.subtitle}
                    </p>
                  </div>

                  <div className="px-8 py-8 flex-1 flex flex-col">
                    <div className="flex flex-col gap-3">
                      {plan.items.map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <Icon
                              i="check-circle"
                              size={14}
                              style={{ color: plan.featured ? "#34D399" : "#10B981", flexShrink: 0, marginTop: "2px" }}
                            />
                            <p
                              className="text-sm"
                              style={{ color: plan.featured ? "rgba(255,255,255,0.85)" : "var(--color-ink)", opacity: plan.featured ? 1 : 0.8 }}
                            >
                              {item.label}
                            </p>
                          </div>
                          {!plan.free && (
                            <p
                              className="text-xs font-medium flex-shrink-0 whitespace-nowrap"
                              style={{ color: plan.featured ? "rgba(255,255,255,0.45)" : undefined }}
                            >
                              <span className={plan.featured ? "" : "text-muted-foreground"}>
                                {priceFormatter.format(item.valeur)}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      {!plan.free && (
                        <div
                          className="py-3 px-4 rounded-lg mt-6 mb-6"
                          style={{
                            background: plan.featured ? "rgba(52,211,153,0.12)" : "rgba(16,185,129,0.08)",
                            border: plan.featured ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(16,185,129,0.15)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: plan.featured ? "white" : "var(--color-ink)" }}
                            >
                              Valeur totale
                            </p>
                            <p className="text-base font-semibold line-through" style={{ color: plan.featured ? "#34D399" : "#10B981" }}>
                              {priceFormatter.format(valeurTotale)} FCFA
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6 mt-6">
                        {plan.free ? (
                          <p className="font-headings font-semibold" style={{ fontSize: "44px", lineHeight: 1 }}>
                            <span style={{ color: "#10B981" }}>Gratuit</span>
                          </p>
                        ) : (
                          <>
                            {reduction !== null && plan.prixBarre ? (
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.45)" }}>
                                  {priceFormatter.format(plan.prixBarre)} FCFA
                                </span>
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                                  style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
                                >
                                  -{reduction}%
                                </span>
                              </div>
                            ) : (
                              <p
                                className="text-sm font-medium mb-1"
                                style={{ color: plan.featured ? "rgba(255,255,255,0.6)" : undefined }}
                              >
                                <span className={plan.featured ? "" : "text-muted-foreground"}>
                                  Aujourd&apos;hui, à partir de
                                </span>
                              </p>
                            )}
                            <p
                              className="font-headings font-semibold"
                              style={{ fontSize: "38px", lineHeight: 1, color: plan.featured ? "white" : "var(--color-ink)" }}
                            >
                              <span style={{ color: plan.featured ? "#34D399" : "#10B981" }}>
                                {priceFormatter.format(plan.prixAppel)}
                              </span>
                            </p>
                            <p
                              className="text-sm mt-1"
                              style={{ color: plan.featured ? "rgba(255,255,255,0.55)" : undefined }}
                            >
                              <span className={plan.featured ? "" : "text-muted-foreground"}>FCFA/mois</span>
                            </p>
                          </>
                        )}
                      </div>

                      <Link
                        to="/signup"
                        className="block text-center w-full py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-95"
                        style={
                          plan.featured
                            ? { background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 8px 32px rgba(245,158,11,0.4)" }
                            : { background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.32)" }
                        }
                      >
                        {plan.free ? "Commencer gratuitement" : "Créer mon compte gratuitement"}
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </GlassSection>

      {/* Testimonials */}
      <GlassSection id="temoignages" background="linear-gradient(160deg, #FFFFFF 0%, #F5F7FB 100%)">
        <Reveal className="text-center mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", color: "#3B82F6" }}>
            Témoignages
          </div>
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Ils ont repris le contrôle
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {testimonials.map((item, i) => (
            <Reveal key={item.name} delay={i * 90}>
              <div
                className="p-7 rounded-2xl flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
                }}
              >
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Icon key={j} i="star" size={14} style={{ color: "#F59E0B" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground" style={{ opacity: 0.72 }}>« {item.text} »</p>
                <div className="flex items-center gap-3 mt-auto pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <Avatar name={item.name} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.job}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </GlassSection>

      {/* For Who */}
      <GlassSection id="pour-qui" background="linear-gradient(145deg, #F1F8F4 0%, #E7F2EC 100%)">
        <Reveal className="text-center mb-14 relative z-10">
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Pour qui ?
          </h2>
        </Reveal>
        <div className="flex justify-center gap-4 flex-wrap relative z-10">
          {forWho.map((w, i) => (
            <Reveal key={w.label} delay={i * 50}>
              <div
                className="flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 4px 16px rgba(120,120,180,0.07)",
                }}
              >
                <Icon i={w.icon} size={18} style={{ color: "#10B981" }} />
                <span className="text-sm font-medium text-foreground">{w.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </GlassSection>

      {/* FAQ */}
      <GlassSection id="faq" background="linear-gradient(160deg, #EAF0FA 0%, #E1EBF8 100%)">
        <Reveal className="text-center mb-14 relative z-10">
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Questions fréquentes
          </h2>
        </Reveal>
        <div className="max-w-3xl mx-auto flex flex-col gap-4 relative z-10">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <div
                className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 4px 16px rgba(120,120,180,0.07)",
                }}
              >
                <p className="text-sm font-semibold text-foreground mb-2">
                  <span style={{ color: "#10B981" }}>Q. </span>{f.q}
                </p>
                <p className="text-sm text-foreground" style={{ opacity: 0.6 }}>{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </GlassSection>

      {/* Final CTA */}
      <div
        className="relative overflow-hidden px-8 md:px-16 py-28 text-center"
        style={{ background: "linear-gradient(145deg, #EEF0F5 0%, #E8EBF2 40%, #EBF0EC 100%)" }}
      >
        <div
          className="absolute pointer-events-none animate-blob"
          style={{ top: "-80px", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
        />

        <Reveal className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)", color: "#10B981" }}>
            Commencez maintenant
          </div>
          <h2 className="font-headings font-semibold text-foreground mb-6" style={{ fontSize: "44px", lineHeight: 1.1 }}>
            Votre avenir financier
            <br />
            <span style={{ color: "#10B981" }}>commence aujourd&apos;hui.</span>
          </h2>
          <p className="text-lg leading-relaxed mb-12 mx-auto" style={{ color: "rgba(10,20,40,0.58)", maxWidth: "540px" }}>
            Arrêtez de subir vos finances. Commencez à les piloter avec un système conçu pour vous aider à
            économiser, investir et atteindre vos objectifs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 32px rgba(16,185,129,0.32)" }}
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl text-sm font-semibold text-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 16px rgba(120,120,180,0.1)" }}
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <div
        className="px-8 md:px-16 py-12"
        style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src={logoIcon} alt="Iwadu Cash" className="w-9 h-9" />
              <span className="font-headings font-semibold text-lg text-foreground">Iwadu Cash</span>
            </div>
            <p className="text-xs max-w-xs text-muted-foreground leading-relaxed">
              Le copilote financier personnel pensé pour les particuliers et entrepreneurs d&apos;Afrique
              francophone.
            </p>
          </div>
          <div className="flex flex-wrap gap-16">
            {[
              { title: "Produit", links: [{ label: "Fonctionnalités", href: "#fonctionnalites" }, { label: "Tarifs", href: "#tarifs" }] },
              { title: "Compte", links: [{ label: "Connexion", href: "/login" }, { label: "Créer un compte", href: "/signup" }] },
              {
                title: "Légal",
                links: [
                  { label: "Mentions légales", href: "/mentions-legales" },
                  { label: "CGU", href: "/cgu" },
                  { label: "Confidentialité", href: "/confidentialite" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#10B981" }}>{col.title}</p>
                <div className="flex flex-col gap-2">
                  {col.links.map((link) =>
                    link.href.startsWith("#") ? (
                      <a key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </a>
                    ) : (
                      <Link key={link.label} to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
          <p className="text-xs text-muted-foreground">© 2026 Iwadu Cash. Tous droits réservés.</p>
        </div>
      </div>
    </>
  );
}
