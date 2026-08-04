-- C1.3 (complément) — Les fonctions `security definer` reçoivent un GRANT
-- EXECUTE implicite à PUBLIC. downgrade_expired_plans() n'a pas de
-- paramètre et son effet ne profite jamais à l'appelant lui-même (elle ne
-- touche que les comptes déjà expirés), donc aucune escalade directe n'est
-- possible via cet appel — mais rien ne justifie qu'un compte authentifié
-- quelconque puisse déclencher cette écriture de masse à volonté. On
-- restreint son exécution à service_role/postgres uniquement (pg_cron
-- l'appelle en tant que postgres).
--
-- Rollback :
--   grant execute on function public.downgrade_expired_plans() to authenticated, anon;
--
-- Note : le schéma `public` de Supabase a des "default privileges" qui
-- accordent EXECUTE à `anon`/`authenticated` sur toute nouvelle fonction, en
-- plus du GRANT implicite à PUBLIC créé par Postgres — les deux doivent être
-- révoqués explicitement, un simple `revoke ... from public` ne suffit pas.

revoke execute on function public.downgrade_expired_plans() from public, authenticated, anon;
grant execute on function public.downgrade_expired_plans() to service_role;
