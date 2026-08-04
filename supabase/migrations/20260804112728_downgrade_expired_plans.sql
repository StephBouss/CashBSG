-- C1.3 — Rend l'expiration d'abonnement effective.
--
-- has_paid_plan() (C1.2) vérifie déjà plan_expires_at à chaque appel : un
-- compte expiré perd donc ses accès réels immédiatement, sans dépendre de
-- ce qui suit. Cette migration ne fait que garder la colonne `plan`
-- affichée cohérente avec cet état réel, via une tâche planifiée
-- quotidienne qui repasse les comptes échus à 'free'.
--
-- Risque anticipé (documenté dans le plan) : downgrade_expired_plans()
-- modifie plan/plan_expires_at, donc passe par le trigger de protection
-- posé en C1.1 (protect_profile_privileges). Le comportement de
-- auth.role() dans un contexte pg_cron n'étant pas garanti sans test
-- empirique, on ne dépend pas de lui ici : la fonction pose un drapeau de
-- session explicite que le trigger vérifie en plus de auth.role().
--
-- Rollback :
--   select cron.unschedule('downgrade-expired-plans-daily');
--   drop function if exists public.downgrade_expired_plans();
--   -- puis remettre protect_profile_privileges() dans sa version C1.1 (sans le drapeau de session)

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
     and coalesce(current_setting('app.bypass_privilege_guard', true), 'off') <> 'on' then
    new.is_admin        := old.is_admin;
    new.plan            := old.plan;
    new.plan_expires_at := old.plan_expires_at;
  end if;
  return new;
end;
$$;

create or replace function public.downgrade_expired_plans()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_privilege_guard', 'on', true);

  update public.profiles
  set plan = 'free', plan_expires_at = null
  where plan <> 'free'
    and plan_expires_at is not null
    and plan_expires_at <= now();
end;
$$;

create extension if not exists pg_cron;

select cron.schedule(
  'downgrade-expired-plans-daily',
  '0 3 * * *',
  $$select public.downgrade_expired_plans();$$
);
