import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";

const steps = [
  { num: "01", title: "Ajoutez vos revenus.", desc: "Salaire, freelance, rentes — toutes vos sources réunies." },
  { num: "02", title: "Ajoutez vos dépenses.", desc: "Fixes et variables, planifiées ou imprévues." },
  { num: "03", title: "Budget automatique.", desc: "L'app calcule tout pour vous, en temps réel." },
  { num: "04", title: "Cochez au fil du mois.", desc: "Suivez l'avancement de chaque dépense." },
  { num: "05", title: "Atteignez vos objectifs.", desc: "Visualisez votre progression et restez motivé." },
];

const highlights = [
  { icon: "trending-up", label: "Revenus centralisés" },
  { icon: "credit-card", label: "Dépenses maîtrisées" },
  { icon: "piggy-bank", label: "Épargne automatisée" },
  { icon: "target", label: "Objectifs atteints" },
];

export function LandingPromise() {
  return (
    <>
      {/* Promise */}
      <div
        id="promesse"
        className="relative overflow-hidden px-8 md:px-16 py-24"
        style={{ background: "linear-gradient(150deg, #E8F5EF 0%, #DDF0E6 100%)" }}
      >
        <div
          className="absolute pointer-events-none animate-blob"
          style={{ top: "-80px", left: "60px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)" }}
        />

        <div className="flex flex-col md:flex-row gap-14 md:gap-20 items-start relative z-10">
          <Reveal style={{ maxWidth: "440px", flexShrink: 0 }}>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}
            >
              La promesse
            </div>
            <h2 className="font-headings font-semibold text-foreground mb-6" style={{ fontSize: "36px", lineHeight: 1.2 }}>
              Iwadu Cash transforme votre façon de gérer votre argent.
            </h2>
            <p className="text-base mb-10 leading-relaxed" style={{ color: "rgba(10,20,40,0.58)" }}>
              En quelques minutes, vous avez une vision complète et sereine de votre situation financière.
            </p>
            <Link
              to="/signup"
              className="inline-block px-7 py-4 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 8px 28px rgba(16,185,129,0.3)" }}
            >
              Je veux reprendre le contrôle
            </Link>
          </Reveal>

          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            {highlights.map((h, i) => (
              <Reveal key={h.label} delay={120 + i * 70}>
                <div
                  className="p-6 rounded-2xl flex flex-col items-start gap-3 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(32px)",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 8px 32px rgba(120,120,180,0.08)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(16,185,129,0.2)" }}
                  >
                    <Icon i={h.icon} size={18} style={{ color: "#10B981" }} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{h.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div
        id="comment-ca-marche"
        className="relative overflow-hidden px-8 md:px-16 py-24"
        style={{ background: "linear-gradient(160deg, #EAF0FA 0%, #DFE9F7 100%)" }}
      >
        <div
          className="absolute pointer-events-none animate-blob-slow"
          style={{ top: "-60px", right: "160px", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)" }}
        />

        <Reveal className="text-center mb-16 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", color: "#3B82F6" }}
          >
            Simple à utiliser
          </div>
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Comment fonctionne Iwadu Cash ?
          </h2>
        </Reveal>

        <div className="flex flex-col md:flex-row items-stretch md:items-start relative z-10 gap-8 md:gap-0">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 90} className="flex-1 flex flex-col items-center text-center px-5">
              <div className="flex items-center w-full mb-6">
                <div style={{ flex: 1, height: "1px", background: i === 0 ? "transparent" : "rgba(16,185,129,0.25)" }} />
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-headings font-semibold flex-shrink-0 transition-transform duration-300 hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.28)", color: "white", fontSize: "15px" }}
                >
                  {s.num}
                </div>
                <div style={{ flex: 1, height: "1px", background: i === steps.length - 1 ? "transparent" : "rgba(16,185,129,0.25)" }} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(10,20,40,0.5)" }}>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
