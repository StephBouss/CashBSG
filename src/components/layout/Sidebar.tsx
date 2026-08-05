import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { canAccessGoals } from "@/lib/plan";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import logoIcon from "@/assets/logo-icon.svg";
import type { Plan } from "@/types/budget";

const navItems = [
  { to: "/app", label: "Dashboard", icon: "layout-dashboard", end: true },
  { to: "/app/revenus", label: "Revenus", icon: "trending-up" },
  { to: "/app/depenses", label: "Dépenses", icon: "credit-card" },
  { to: "/app/tracker", label: "Tracker", icon: "zap" },
  { to: "/app/finances", label: "Finances", icon: "piggy-bank" },
  { to: "/app/objectifs", label: "Objectifs", icon: "target" },
  { to: "/app/rapports", label: "Rapports", icon: "bar-chart-2" },
  { to: "/app/conseiller-ia", label: "Iwadu", icon: "bot" },
  { to: "/app/parametres", label: "Paramètres", icon: "settings" },
];

interface SidebarContentProps {
  displayName: string;
  initial: string;
  isAdmin: boolean;
  showProBadgeOn: string[];
  lockedOn: string[];
  plan: Plan | undefined;
  onNavigate?: () => void;
}

function SidebarContent({ displayName, initial, isAdmin, showProBadgeOn, lockedOn, plan, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <img src={logoIcon} alt="Iwadu Cash" className="w-9 h-9" />
        <span className="font-headings font-semibold text-lg text-foreground tracking-tight">
          Iwadu Cash
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          // Mise en avant temporaire du Tracker (nouvelle fonctionnalité) :
          // effet glassmorphism jaune quand l'onglet n'est pas sélectionné,
          // même gabarit que le surlignage vert de l'onglet actif.
          const attention = item.to === "/app/tracker";
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive ? "text-primary" : attention ? "text-foreground" : "text-foreground opacity-60 hover:opacity-100"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.22)",
                      boxShadow: "0 0 12px rgba(16,185,129,0.10)",
                    }
                  : attention
                  ? {
                      background: "rgba(245,158,11,0.14)",
                      border: "1px solid rgba(245,158,11,0.32)",
                      boxShadow: "0 0 12px rgba(245,158,11,0.18)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }
                  : { border: "1px solid transparent" }
              }
            >
              {({ isActive }) => (
                <>
                  <Icon i={item.icon} size={17} style={!isActive && attention ? { color: "#D97706" } : undefined} />
                  <span className="flex-1">{item.label}</span>
                  {lockedOn.includes(item.to) && <Icon i="lock" size={13} style={{ color: "#9CA3AF" }} className="flex-shrink-0" />}
                  {showProBadgeOn.includes(item.to) && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}
                    >
                      PRO
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div className="mx-3 mb-2 mt-1" style={{ height: "1px", background: "rgba(0,0,0,0.08)" }} />
            <NavLink
              to="/app/admin"
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium"
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                      boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                      border: "1px solid rgba(124,58,237,0.4)",
                      color: "white",
                    }
                  : { border: "1px solid transparent", color: "#7C3AED", opacity: 0.85 }
              }
            >
              <Icon i="shield" size={17} />
              <span>Administration</span>
            </NavLink>
          </>
        )}
      </nav>

      {plan && plan !== "pro" && (
        <NavLink
          to="/app/mise-a-niveau"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white mt-2 transition-transform duration-200 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", boxShadow: "0 8px 24px rgba(124,58,237,0.3)" }}
        >
          <Icon i="rocket" size={16} />
          <span>Mettre à niveau</span>
        </NavLink>
      )}

      {/* Bottom profile */}
      <div
        className="flex items-center gap-3 mt-8 p-3 rounded-lg"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.55)",
          border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground">Membre</p>
        </div>
        <Icon i="chevron-right" size={14} />
      </div>
    </>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const { data: profile } = useProfile();
  const { user } = useAuth();
  const onboarding = useOnboardingStatus();

  const displayName = profile?.nom || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const isAdmin = profile?.isAdmin ?? false;
  const showProBadgeOn = profile && !canAccessGoals(profile.plan) ? ["/app/objectifs"] : [];
  const lockedOn = !onboarding.loading && !onboarding.isComplete ? ["/app/conseiller-ia"] : [];
  useEscapeKey(() => onCloseMobile?.());

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden flex-col py-8 px-5 md:flex"
        style={{
          width: "240px",
          minWidth: "240px",
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.62)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRight: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.72)",
        }}
      >
        <SidebarContent displayName={displayName} initial={initial} isAdmin={isAdmin} showProBadgeOn={showProBadgeOn} lockedOn={lockedOn} plan={profile?.plan} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- fond de fermeture au clic, équivalent clavier via Échap (useEscapeKey) */}
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside
            className="relative flex flex-col py-8 px-5 h-full"
            style={{
              width: "80%",
              maxWidth: "280px",
              background: "rgba(245,246,250,0.98)",
              backdropFilter: "blur(40px)",
              borderRight: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.72)",
            }}
          >
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={onCloseMobile}
              className="absolute top-6 right-5 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.7)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.85)" }}
            >
              <Icon i="x" size={16} />
            </button>
            <SidebarContent displayName={displayName} initial={initial} isAdmin={isAdmin} showProBadgeOn={showProBadgeOn} lockedOn={lockedOn} plan={profile?.plan} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
