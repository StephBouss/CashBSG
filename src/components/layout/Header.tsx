import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

function firstName(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(" ")[0];
  if (email) return email.split("@")[0];
  return "";
}

interface HeaderProps {
  onOpenMenu?: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const displayName = profile?.nom || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-8 py-4"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid rgba(255,255,255,0.72)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={onOpenMenu}
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.75)" }}
        >
          <Icon i="menu" size={16} />
        </button>

        {/* Greeting */}
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-headings font-semibold text-foreground truncate">
            Bonjour {firstName(profile?.nom, user?.email)} <span>👋</span>
          </h2>
          <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">
            Bienvenue. Prenez le contrôle de vos finances.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Notification */}
        <div
          className="hidden sm:flex relative w-9 h-9 rounded-lg items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.75)",
          }}
        >
          <Icon i="bell" size={16} />
        </div>

        {/* Avatar + sign out */}
        <button
          onClick={() => signOut()}
          title="Déconnexion"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #10B981, #3B82F6)",
            border: "2px solid rgba(16,185,129,0.5)",
          }}
        >
          {initial}
        </button>
      </div>
    </div>
  );
}
