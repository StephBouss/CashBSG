-- Offre d'abonnement par compte (Iwadu Free / Essentiel / Pro).
-- Pas encore de facturation réelle : tous les comptes existants et nouveaux
-- démarrent en "free", l'admin pourra faire évoluer ce champ manuellement
-- (ou via une future intégration de paiement) sans changer le schéma.

alter table profiles add column if not exists plan text not null default 'free'
  check (plan in ('free', 'essentiel', 'pro'));
