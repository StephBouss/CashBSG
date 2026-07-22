import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, updateProfileName } from "@/hooks/useProfile";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 24px rgba(16,185,129,0.08)",
      }}
    >
      <h2 className="text-lg font-headings font-semibold text-foreground mb-5">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  desc,
  badge,
  onClick,
  danger,
}: {
  icon: string;
  label: string;
  desc: string;
  badge?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const color = danger ? "#EF4444" : "#10B981";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full flex items-center justify-between p-4 rounded-lg border text-left transition disabled:cursor-default"
      style={{
        borderColor: danger ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.15)",
        background: danger ? "rgba(239,68,68,0.05)" : "rgba(16,185,129,0.02)",
      }}
    >
      <div className="flex items-center gap-4">
        <Icon i={icon} size={20} style={{ color }} />
        <div>
          <p className="text-sm font-medium" style={{ color: danger ? color : "var(--color-foreground)" }}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      {badge ? (
        <span className="text-xs font-medium px-2 py-1 rounded-full text-muted-foreground" style={{ background: "rgba(0,0,0,0.05)" }}>
          {badge}
        </span>
      ) : (
        onClick && <Icon i="chevron-right" size={18} style={{ color }} />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const { user, signOut, resetPasswordForEmail } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.nom ?? "");
  const [savingName, setSavingName] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const startEditName = () => {
    setNameInput(profile?.nom ?? "");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!user) return;
    setSavingName(true);
    try {
      await updateProfileName(user.id, nameInput.trim());
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!user?.email) return;
    await resetPasswordForEmail(user.email);
    setResetSent(true);
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await signOut();
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-headings font-semibold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      <div className="space-y-4">
        {/* Compte */}
        <SettingsSection title="Compte">
          {editingName ? (
            <div
              className="p-4 rounded-lg border flex flex-col gap-3"
              style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.02)" }}
            >
              <label className="text-xs font-semibold text-foreground">Nom complet</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Votre nom"
                className="px-4 py-2.5 rounded-lg text-sm bg-white/70 border border-black/10 text-foreground outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#1a1a2e" }}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon="user"
              label="Profil"
              desc={profile?.nom ? `Nom actuel : ${profile.nom}` : "Ajoutez votre nom complet"}
              onClick={startEditName}
            />
          )}

          <SettingsRow icon="mail" label="Email" desc={user?.email ?? ""} badge="Non modifiable" />

          <SettingsRow
            icon="lock"
            label="Mot de passe"
            desc={resetSent ? "Lien de réinitialisation envoyé, vérifiez vos emails" : "Recevoir un lien de réinitialisation par email"}
            onClick={resetSent ? undefined : sendPasswordReset}
            badge={resetSent ? "Envoyé" : undefined}
          />

          <SettingsRow icon="smartphone" label="2FA" desc="Authentification à deux facteurs" badge="Bientôt disponible" />
        </SettingsSection>

        {/* Préférences */}
        <SettingsSection title="Préférences">
          <SettingsRow icon="palette" label="Thème" desc="Mode clair" badge="Actif" />
          <SettingsRow icon="globe" label="Langue" desc="Français" badge="Actif" />
          <SettingsRow icon="bell" label="Notifications" desc="Gérez vos alertes" badge="Bientôt disponible" />
        </SettingsSection>

        {/* Aide & Support */}
        <SettingsSection title="Aide & Support">
          <SettingsRow icon="help-circle" label="FAQ" desc="Questions fréquemment posées" onClick={() => window.location.assign("/#fonctionnalites")} />
          <SettingsRow
            icon="message-circle"
            label="Nous contacter"
            desc="stephboussougou@gmail.com"
            onClick={() => window.location.assign("mailto:stephboussougou@gmail.com")}
          />
          <SettingsRow icon="info" label="À propos" desc="Iwadu Cash — version bêta" />
        </SettingsSection>

        {/* Zone dangereuse */}
        <SettingsSection title="Zone dangereuse">
          <SettingsRow icon="log-out" label="Se déconnecter" desc="Quitter cet appareil" onClick={() => signOut()} danger />
          <SettingsRow
            icon="trash-2"
            label="Supprimer le compte"
            desc={confirmDelete ? "Cliquez à nouveau pour confirmer et vous déconnecter" : "Action irréversible — contactez le support pour une suppression définitive"}
            onClick={handleDeleteAccount}
            danger
          />
        </SettingsSection>
      </div>
    </div>
  );
}
