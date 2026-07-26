import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { GlassCard } from "@/components/ui/GlassCard";

interface UpsellCardProps {
  title: string;
  description: string;
}

/** Écran de blocage affiché à la place d'une fonctionnalité réservée aux
 * offres payantes (Iwadu Essentiel / Pro), avec renvoi vers les tarifs. */
export function UpsellCard({ title, description }: UpsellCardProps) {
  return (
    <GlassCard className="p-10 flex flex-col items-center text-center max-w-xl mx-auto">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
      >
        <Icon i="lock" size={22} style={{ color: "white" }} />
      </div>
      <h2 className="text-lg font-headings font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
      <Link
        to="/#tarifs"
        className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
      >
        Voir les offres Iwadu Cash
      </Link>
    </GlassCard>
  );
}
