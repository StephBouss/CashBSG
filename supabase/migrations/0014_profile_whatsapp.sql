-- Numéro WhatsApp du profil (facultatif), utilisé dans le parcours
-- d'onboarding du tableau de bord.
alter table profiles add column if not exists whatsapp text;
