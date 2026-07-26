import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import logoFull from "@/assets/logo-full.png";

const navLinks = [
  {
    href: "#probleme",
    label: "Le problème",
    tooltip: "Découvrez les erreurs financières les plus courantes qui vous coûtent cher chaque mois, sans même vous en rendre compte.",
  },
  {
    href: "#promesse",
    label: "La promesse",
    tooltip: "Iwadu Cash transforme votre façon de gérer votre argent : une vision claire et sereine de vos finances en quelques minutes.",
  },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#temoignages", label: "Témoignages" },
  { href: "#faq", label: "FAQ" },
];

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function LandingNav() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        className="flex items-center justify-between px-6 md:px-16 py-4 md:py-5 transition-all duration-300"
        style={
          scrolled || open
            ? {
                background: "rgba(238,240,245,0.88)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 4px 24px rgba(120,120,180,0.10)",
                borderBottom: "1px solid rgba(255,255,255,0.6)",
              }
            : { background: "transparent" }
        }
      >
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src={logoFull} alt="Iwadu Cash" className="h-10 md:h-12" />
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <div key={link.href} className="relative group">
              <a
                href={link.href}
                className="text-sm font-medium text-foreground transition-opacity hover:opacity-100 whitespace-nowrap"
                style={{ opacity: 0.65 }}
              >
                {link.label}
              </a>

              {link.tooltip && (
                <div
                  className="absolute left-1/2 top-full mt-3 w-64 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 rounded-2xl z-10 pointer-events-none"
                  style={{
                    background: "rgba(255,255,255,0.98)",
                    backdropFilter: "blur(40px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    boxShadow: "0 8px 32px rgba(120,120,180,0.15)",
                  }}
                >
                  <p className="text-xs leading-relaxed text-foreground" style={{ opacity: 0.8 }}>
                    {link.tooltip}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-foreground transition-opacity hover:opacity-100"
            style={{ opacity: 0.65 }}
          >
            Connexion
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
          >
            Commencer
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.8)" }}
        >
          <Icon i={open ? "x" : "menu"} size={18} />
        </button>
      </div>

      {/* Mobile / tablet panel */}
      <div
        className="lg:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: open ? "480px" : "0px",
          background: "rgba(238,240,245,0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: open ? "1px solid rgba(255,255,255,0.6)" : "none",
        }}
      >
        <div className="flex flex-col px-6 py-5 gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-foreground py-3 border-b"
              style={{ opacity: 0.75, borderColor: "rgba(0,0,0,0.06)" }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex md:hidden flex-col gap-3 mt-4">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="text-center text-sm font-medium text-foreground py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.85)" }}
            >
              Connexion
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="text-center px-5 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
            >
              Commencer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
