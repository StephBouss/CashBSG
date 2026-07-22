import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/landing/Reveal";

const problems = [
  { icon: "help-circle", text: "Vous ne savez jamais combien il vous reste réellement." },
  { icon: "clock", text: "Vous oubliez certaines échéances." },
  { icon: "trending-down", text: "Votre salaire disparaît avant la fin du mois." },
  { icon: "piggy-bank", text: "Votre épargne est irrégulière." },
  { icon: "bar-chart-2", text: "Vos investissements ne sont pas suivis." },
  { icon: "file-text", text: "Vous utilisez Excel, des notes ou votre mémoire." },
];

export function LandingPain() {
  return (
    <div
      id="probleme"
      className="relative overflow-hidden px-8 md:px-16 py-24"
      style={{ background: "linear-gradient(160deg, #FBEEEE 0%, #F5E4E4 100%)" }}
    >
      <div
        className="absolute pointer-events-none animate-blob-slow"
        style={{ top: "-60px", right: "200px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.09) 0%, transparent 70%)" }}
      />

      <Reveal className="text-center mb-14 relative z-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}
        >
          Le problème
        </div>
        <h2 className="font-headings font-semibold text-foreground" style={{ fontSize: "36px", lineHeight: 1.2 }}>
          Chaque mois, combien d&apos;argent perdez-vous
          <br />
          <span style={{ color: "#EF4444" }}>sans vous en rendre compte ?</span>
        </h2>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12 relative z-10">
        {problems.map((p, i) => (
          <Reveal key={p.text} delay={i * 70}>
            <div
              className="flex items-start gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.58)",
                backdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.75)",
                boxShadow: "0 8px 32px rgba(120,120,180,0.08)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.18)" }}
              >
                <Icon i={p.icon} size={16} style={{ color: "#EF4444" }} />
              </div>
              <p className="text-sm leading-relaxed text-foreground" style={{ opacity: 0.75 }}>{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <div
          className="p-8 rounded-2xl text-center relative z-10"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(16,185,129,0.25)",
            boxShadow: "0 8px 32px rgba(16,185,129,0.08)",
          }}
        >
          <p className="text-lg font-semibold text-foreground">
            Le problème n&apos;est pas votre revenu.{" "}
            <span style={{ color: "#10B981" }}>Le problème est l&apos;absence d&apos;un système fiable.</span>
          </p>
        </div>
      </Reveal>
    </div>
  );
}
