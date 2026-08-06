import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface AdminDetailModalProps {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

export function AdminDetailModal({ icon, color, title, subtitle, onClose, children }: AdminDetailModalProps) {
  useEscapeKey(onClose);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- fond de fermeture au clic, équivalent clavier via Échap (useEscapeKey) et le bouton "Fermer" ci-dessous
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0, 0, 0, 0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-lg relative flex flex-col"
        style={{
          background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.97)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.85)",
          boxShadow: "0 24px 64px rgba(120,120,180,0.25)",
        }}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}
            >
              <Icon i={icon} size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-headings font-semibold text-foreground truncate">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Fermer"
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
            <Icon i="x" size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
