import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useLocalDateTime } from "@/hooks/useLocalDateTime";
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/useNotifications";

const notifTimeFormatter = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function firstName(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(" ")[0];
  if (email) return email.split("@")[0];
  return "";
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface HeaderProps {
  onOpenMenu?: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();
  const displayName = profile?.nom || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const { salutation, formattedDate, formattedTime } = useLocalDateTime(profile?.pays);
  const { data: notifications = [] } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-8 py-4"
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.55)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.72)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={onOpenMenu}
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
          style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.6)", border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)" }}
        >
          <Icon i="menu" size={16} />
        </button>

        {/* Greeting */}
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-headings font-semibold text-foreground truncate">
            {salutation} {firstName(profile?.nom, user?.email)} <span>👋</span>
          </h2>
          <p className="hidden sm:block text-sm text-muted-foreground mt-0.5 truncate">
            {capitalize(formattedDate)} · {formattedTime}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Notification */}
        <div className="hidden sm:block relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.6)",
              border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.75)",
            }}
          >
            <Icon i="bell" size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: "#EF4444" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 top-11 z-50 w-80 rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.98)",
                  backdropFilter: "blur(40px)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead.mutate()}
                      className="text-xs"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs px-4 py-6 text-center" style={{ color: "#6B7280" }}>
                      Aucune notification.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => !n.read && markRead.mutate(n.id)}
                        className="w-full text-left px-4 py-3 border-b"
                        style={{
                          borderColor: "rgba(0,0,0,0.04)",
                          background: n.read ? "transparent" : "rgba(16,185,129,0.06)",
                        }}
                      >
                        <p className="text-xs font-semibold" style={{ color: "#111827" }}>{n.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{n.message}</p>
                        <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>
                          {notifTimeFormatter.format(new Date(n.createdAt))}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            border: "2px solid rgba(16,185,129,0.5)",
          }}
        >
          {initial}
        </div>

        {/* Déconnexion */}
        <button
          type="button"
          onClick={() => signOut()}
          title="Déconnexion"
          aria-label="Déconnexion"
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <Icon i="log-out" size={16} style={{ color: "#EF4444" }} />
        </button>
      </div>
    </div>
  );
}
