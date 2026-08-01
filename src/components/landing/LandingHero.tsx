import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";
import dashboardPreview from "@/assets/screenshots/dashboard-preview.jpg";

const trustItems = [
  { icon: "credit-card", label: "Sans carte bancaire" },
  { icon: "gift", label: "Essai gratuit" },
  { icon: "shield", label: "Données sécurisées" },
  { icon: "smartphone", label: "Mobile & Web" },
];

export function LandingHero() {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #EEF0F5 0%, #E8EBF2 40%, #EBF0EC 100%)" }}
    >
      <div
        className="absolute pointer-events-none animate-blob"
        style={{ top: "-100px", left: "60px", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)", zIndex: 0 }}
      />
      <div
        className="absolute pointer-events-none animate-blob-slow"
        style={{ bottom: "-80px", right: "80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", zIndex: 0 }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-14 px-8 md:px-16 pt-28 md:pt-32 pb-20">
        <div className="flex flex-col" style={{ maxWidth: "580px" }}>
          <Reveal>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 self-start"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#10B981",
                boxShadow: "0 2px 12px rgba(16,185,129,0.1)",
              }}
            >
              ✨ Le copilote financier personnel des particuliers et des entrepreneurs
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-headings font-semibold leading-tight mb-6 text-foreground" style={{ fontSize: "48px", lineHeight: 1.1 }}>
              Reprenez le contrôle de chaque <span style={{ color: "#10B981" }}>FCFA</span> que vous gagnez.
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mb-10 leading-relaxed" style={{ fontSize: "17px", color: "rgba(10,20,40,0.62)" }}>
              Iwadu Cash centralise vos revenus, dépenses, épargne et investissements dans une seule
              application intelligente. Suivez votre argent en temps réel et atteignez vos objectifs plus
              rapidement.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                to="/signup"
                className="px-7 py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 28px rgba(16,185,129,0.32)" }}
              >
                Créer mon compte gratuitement
              </Link>
              <a
                href="#fonctionnalites"
                className="flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-semibold text-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 4px 16px rgba(120,120,180,0.1)" }}
              >
                <Icon i="play-circle" size={16} style={{ color: "#10B981" }} />
                Voir une démo
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="flex flex-wrap items-center gap-6">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(10,20,40,0.5)" }}>
                  <Icon i={item.icon} size={13} style={{ color: "#10B981" }} />
                  {item.label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="flex-1 flex justify-center md:justify-end w-full">
          <div
            className="rounded-2xl overflow-hidden w-full animate-hero-float"
            style={{
              maxWidth: "560px",
              boxShadow: "0 40px 100px rgba(120,120,180,0.18), 0 8px 32px rgba(16,185,129,0.1)",
              border: "1px solid rgba(255,255,255,0.8)",
              background: "#EEF0F5",
            }}
          >
            <div className="flex items-center gap-1.5 px-4 py-2.5" style={{ background: "rgba(255,255,255,0.7)" }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#10B981" }} />
            </div>
            <img
              src={dashboardPreview}
              alt="Tableau de bord Iwadu Cash"
              className="w-full block"
              style={{ aspectRatio: "16 / 10", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
