import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";

const benefits = [
  "Maîtrisez votre budget.",
  "Réduisez les dépenses inutiles.",
  "Payez toujours à temps.",
  "Épargnez automatiquement.",
  "Investissez intelligemment.",
  "Suivez vos objectifs.",
  "Diminuez votre stress financier.",
  "Prenez de meilleures décisions.",
];

const features = [
  { icon: "trending-up", title: "Gestion des revenus", desc: "Ajoutez toutes vos sources de revenus.", tooltip: "Centralisez tous vos revenus (salaire, freelance, revenus passifs) avec un suivi détaillé par source et par période." },
  { icon: "credit-card", title: "Dépenses", desc: "Suivez toutes vos charges.", tooltip: "Catégorisez et suivez vos dépenses en temps réel. Visualisez où va chaque franc avec des graphiques détaillés." },
  { icon: "calendar", title: "Échéances", desc: "Recevez des rappels automatiques.", tooltip: "Suivez chaque date limite depuis votre tableau de bord. Ne ratez plus aucune facture importante." },
  { icon: "bar-chart-2", title: "Investissements", desc: "Suivez vos placements et leur évolution.", tooltip: "Gérez tous vos placements au même endroit. Suivez les performances et l'évolution en temps réel." },
  { icon: "piggy-bank", title: "Épargne", desc: "Visualisez votre progression.", tooltip: "Fixez des règles d'épargne et visualisez votre fonds d'urgence croître chaque mois. Motivant et transparent." },
  { icon: "target", title: "Objectifs", desc: "Voiture, maison, voyage, fonds d'urgence…", tooltip: "Définissez vos objectifs financiers et suivez votre progression étape par étape." },
  { icon: "file-bar-chart", title: "Rapports", desc: "Graphiques et statistiques.", tooltip: "Générez des rapports complets avec graphiques, tendances et analyses de votre situation financière." },
  { icon: "bot", title: "Assistant IA", desc: "Analyse vos habitudes financières.", tooltip: "L'IA analyse vos dépenses et vous propose des recommandations personnalisées pour optimiser votre budget." },
];

export function LandingFeatures() {
  return (
    <>
      {/* Benefits */}
      <div
        id="avantages"
        className="relative overflow-hidden px-8 md:px-16 py-24"
        style={{ background: "linear-gradient(145deg, #F1F8F4 0%, #E7F2EC 100%)" }}
      >
        <div
          className="absolute pointer-events-none animate-blob"
          style={{ bottom: "-80px", left: "100px", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)" }}
        />

        <Reveal className="text-center mb-14 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}
          >
            Les bénéfices
          </div>
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Plus qu&apos;un budget : <span style={{ color: "#10B981" }}>un véritable système financier.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {benefits.map((b, i) => (
            <Reveal key={b} delay={i * 50}>
              <div
                className="flex items-center gap-3 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 4px 16px rgba(120,120,180,0.07)",
                }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#10B981" }}>
                  <Icon i="check" size={12} style={{ color: "white" }} />
                </div>
                <p className="text-sm font-medium text-foreground">{b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div
        id="fonctionnalites"
        className="relative overflow-hidden px-8 md:px-16 py-24"
        style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #F6F8FB 100%)" }}
      >
        <div
          className="absolute pointer-events-none animate-blob-slow"
          style={{ top: "-80px", right: "80px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.09) 0%, transparent 70%)" }}
        />

        <Reveal className="text-center mb-14 relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", color: "#3B82F6" }}
          >
            Fonctionnalités
          </div>
          <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px" }}>
            Tout ce qu&apos;Iwadu Cash fait pour vous
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div
                className="group relative p-6 rounded-2xl cursor-help transition-all duration-300 hover:-translate-y-1.5"
                style={{
                  background: "rgba(255,255,255,0.58)",
                  backdropFilter: "blur(32px)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  boxShadow: "0 8px 32px rgba(120,120,180,0.09)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  <Icon i={f.icon} size={20} style={{ color: "#10B981" }} />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(10,20,40,0.5)" }}>{f.desc}</p>

                {/* Tooltip on hover */}
                <div
                  className="absolute inset-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-6 rounded-2xl z-10"
                  style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.9)" }}
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                      <Icon i="x" size={14} style={{ color: "#10B981", opacity: 0.6 }} />
                    </div>
                    <p className="text-xs leading-relaxed text-foreground" style={{ opacity: 0.75 }}>{f.tooltip}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}
