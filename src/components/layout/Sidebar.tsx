import { NavLink } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/", label: "Dashboard", icon: "layout-dashboard", end: true },
  { to: "/revenus", label: "Revenus", icon: "trending-up" },
  { to: "/depenses", label: "Dépenses", icon: "credit-card" },
  { to: "/finances", label: "Finances", icon: "piggy-bank" },
  { to: "/objectifs", label: "Objectifs", icon: "target" },
  { to: "/rapports", label: "Rapports", icon: "bar-chart-2" },
  { to: "/conseiller-ia", label: "IA Conseiller", icon: "bot" },
];

export function Sidebar() {
  const { data: profile } = useProfile();
  const { user } = useAuth();

  const displayName = profile?.nom || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden flex-col py-8 px-5 md:flex"
      style={{
        width: "240px",
        minWidth: "240px",
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRight: "1px solid rgba(255,255,255,0.72)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)" }}
        >
          <span className="text-white font-headings font-semibold text-base">B+</span>
        </div>
        <span className="font-headings font-semibold text-lg text-foreground tracking-tight">
          Budget+
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                isActive ? "text-primary" : "text-foreground opacity-60 hover:opacity-100"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.22)",
                    boxShadow: "0 0 12px rgba(16,185,129,0.10)",
                  }
                : { border: "1px solid transparent" }
            }
          >
            <Icon i={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom profile */}
      <div
        className="flex items-center gap-3 mt-8 p-3 rounded-lg"
        style={{
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(255,255,255,0.75)",
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)" }}
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
    </aside>
  );
}
