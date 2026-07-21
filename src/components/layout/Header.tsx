import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

function firstName(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(" ")[0];
  if (email) return email.split("@")[0];
  return "";
}

export function Header() {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const displayName = profile?.nom || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center justify-between px-8 py-4"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid rgba(255,255,255,0.72)",
      }}
    >
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-headings font-semibold text-foreground">
          Bonjour {firstName(profile?.nom, user?.email)} <span>👋</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Bienvenue. Prenez le contrôle de vos finances.
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <div
          className="relative w-9 h-9 rounded-lg flex items-center justify-center"
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
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
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
