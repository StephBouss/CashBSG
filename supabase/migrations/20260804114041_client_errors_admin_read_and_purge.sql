-- C1.6 — Assainit client_errors : lecture réservée aux admins + purge 30j.
--
-- Jusqu'ici, client_errors n'avait AUCUNE policy SELECT (deny-by-default),
-- donc personne — même pas le propriétaire de la ligne — ne pouvait lire.
-- Le document demande explicitement une lecture réservée aux ADMINS
-- (pas même le propriétaire) : on ajoute donc une policy SELECT dédiée,
-- pas une policy "owner".
--
-- is_current_user_admin() est security definer pour éviter toute
-- récursion RLS (la policy sur client_errors ne doit pas interroger
-- profiles avec RLS active dessus).
--
-- errorLogging.ts (vérifié par lecture) n'envoie que message/stack/url/
-- user_agent/horodatage — jamais de contenu de formulaire ni de montant.
-- Rien à changer côté front pour ce chantier.
--
-- Rollback :
--   select cron.unschedule('purge-client-errors-daily');
--   drop function if exists public.purge_old_client_errors();
--   drop policy if exists "client_errors_select_admin_only" on public.client_errors;
--   drop function if exists public.is_current_user_admin();

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "client_errors_select_admin_only" on public.client_errors
  for select using (public.is_current_user_admin());

create or replace function public.purge_old_client_errors()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.client_errors where created_at < now() - interval '30 days';
end;
$$;

revoke execute on function public.purge_old_client_errors() from public, authenticated, anon;
grant execute on function public.purge_old_client_errors() to service_role;

select cron.schedule(
  'purge-client-errors-daily',
  '0 4 * * *',
  $$select public.purge_old_client_errors();$$
);
