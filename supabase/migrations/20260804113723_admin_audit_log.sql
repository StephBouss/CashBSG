-- C1.5 (partie codable) — Journal d'audit des accès admin.
--
-- La 2FA sur le compte admin et la protection "mots de passe compromis"
-- restent des actions manuelles côté dashboard Supabase Auth (hors
-- périmètre technique). Cette migration ajoute la trace : chaque
-- consultation de admin-dashboard par un admin valide écrit une ligne ici,
-- via le client service_role de l'Edge Function.
--
-- Aucune policy pour authenticated/anon : lecture et écriture réservées à
-- service_role (RLS activée sans aucune policy = deny-by-default pour tout
-- le reste), sur le même modèle que les autres agrégats admin.
--
-- Rollback :
--   drop table if exists public.admin_audit_log;

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
