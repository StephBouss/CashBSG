-- P0.8 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Vraie suppression de
-- compte.
--
-- Constat : "Supprimer le compte" (SettingsPage.tsx) n'appelait que
-- signOut() — aucune donnée n'était réellement effacée, alors que
-- PolitiqueConfidentialitePage.tsx promet explicitement "En cas de
-- suppression du compte, les données associées sont supprimées". Toutes les
-- tables métier référencent déjà auth.users(id) on delete cascade (posé dès
-- 0001_init.sql/0002_goals_and_ai.sql/0003_savings_investments.sql/etc.),
-- sauf client_errors qui utilise `on delete set null` (conservé tel quel :
-- logs d'erreurs anonymisés, pas une donnée personnelle bloquante). Supprimer
-- le compte via l'API Admin GoTrue (auth.admin.deleteUser, service_role
-- uniquement — cf. supabase/functions/delete-account) déclenche donc déjà
-- une cascade complète et cohérente sans qu'il soit nécessaire de lister
-- chaque table une à une.
--
-- Cette migration ajoute uniquement la table d'audit de la suppression
-- elle-même : `account_deletions` n'a PAS de clé étrangère vers auth.users
-- (volontairement — sinon la ligne serait elle-même supprimée par la cascade
-- au moment même où on veut la conserver comme preuve). Écriture réservée à
-- service_role (RLS activée, aucune policy pour anon/authenticated).
--
-- Rollback :
--   drop table if exists public.account_deletions;

create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text,
  deleted_at timestamptz not null default now()
);

alter table public.account_deletions enable row level security;
-- Aucune policy : ni anon ni authenticated n'ont accès (select/insert/update/
-- delete), y compris le propriétaire lui-même — seul service_role (qui
-- contourne RLS) peut écrire ou consulter cette table d'audit.

revoke all on public.account_deletions from public, anon, authenticated;
