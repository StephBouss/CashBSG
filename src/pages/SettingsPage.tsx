import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, updateProfileName, useUpdateProfilePreferences } from "@/hooks/useProfile";
import { useTheme, THEMES } from "@/hooks/useTheme";
import { LANGUAGES, COUNTRIES, CURRENCIES } from "@/lib/preferences";
import type { CountryOption, CurrencyOption, LanguageOption } from "@/lib/preferences";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.6)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.8)",
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
  const color = danger ? "#EF4444" : "var(--color-primary)";
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

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {THEMES.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl transition"
            style={{
              border: active ? `2px solid ${t.accent}` : "1px solid rgba(0,0,0,0.08)",
              background: active ? `${t.accent}12` : "transparent",
            }}
          >
            <span
              className="w-full h-12 rounded-lg block relative"
              style={{ background: t.gradient, border: "1px solid rgba(0,0,0,0.06)" }}
            >
              {active && (
                <span
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: t.accent }}
                >
                  <Icon i="check" size={10} style={{ color: "white" }} />
                </span>
              )}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: active ? t.accent : "var(--color-foreground)" }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.accent }} />
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PreferenceSelect<T extends { code: string; label: string; flag: string }>({
  icon,
  label,
  desc,
  options,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  desc: string;
  options: T[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="w-full flex items-center justify-between gap-4 p-4 rounded-lg border"
      style={{ borderColor: "rgba(16,185,129,0.15)", background: "rgba(16,185,129,0.02)" }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <Icon i={icon} size={20} style={{ color: "var(--color-primary)" }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-medium rounded-lg px-3 py-2 border outline-none flex-shrink-0 max-w-[160px]"
        style={{ background: "rgba(var(--glass-r),var(--glass-g),var(--glass-b),0.8)", borderColor: "rgba(0,0,0,0.1)", color: "var(--color-ink)" }}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.flag} {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut, resetPasswordForEmail } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const updatePreferences = useUpdateProfilePreferences();

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
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.06)", color: "var(--color-ink)" }}
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
          <div className="p-1">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon i="palette" size={16} style={{ color: "var(--color-primary)" }} />
              Thème
            </p>
            <ThemePicker />
          </div>

          <PreferenceSelect<LanguageOption>
            icon="globe"
            label="Langue"
            desc="Utilisée pour l'IA et les exports"
            options={LANGUAGES}
            value={profile?.langue ?? "fr"}
            onChange={(langue) => updatePreferences({ langue }).catch(() => {})}
          />

          <PreferenceSelect<CountryOption>
            icon="map-pin"
            label="Pays d'utilisation"
            desc={profile?.pays ? "Compte associé à ce pays" : "Non renseigné"}
            options={COUNTRIES}
            value={profile?.pays ?? "SN"}
            onChange={(pays) => updatePreferences({ pays }).catch(() => {})}
          />

          <PreferenceSelect<CurrencyOption>
            icon="dollar-sign"
            label="Devise"
            desc="Devise d'affichage de votre compte"
            options={CURRENCIES}
            value={profile?.devise ?? "FCFA"}
            onChange={(devise) => updatePreferences({ devise }).catch(() => {})}
          />

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
