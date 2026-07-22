-- Budget+ — accès administrateur
-- Ajoute un simple indicateur is_admin sur le profil. La lecture de son
-- propre profil (donc de son propre is_admin) est déjà couverte par la
-- policy "profiles_owner" existante. Les données globales (tous les
-- comptes) sont exposées via l'Edge Function admin-dashboard, qui utilise
-- la clé service_role côté serveur après vérification que l'appelant est
-- bien administrateur — aucune policy RLS supplémentaire n'est donc requise.

alter table profiles add column if not exists is_admin boolean not null default false;
