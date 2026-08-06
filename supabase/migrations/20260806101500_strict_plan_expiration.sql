-- P0.9 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Expiration stricte des
-- plans payants.
--
-- Constat : has_paid_plan() et effective_plan() traitent
-- `plan_expires_at is null` comme "n'expire jamais" pour un plan payant.
-- Il n'existe aucun prestataire de paiement intégré (0012_upgrade_requests :
-- "l'équipe traite la demande manuellement puis met à jour profiles.plan") et
-- aucun outil ne force à renseigner plan_expires_at en même temps que plan —
-- un simple oubli lors d'une mise à niveau manuelle rend donc un compte
-- payant à vie, silencieusement, sans qu'aucune règle serveur ne le
-- rattrape. Règle demandée par l'audit :
--   premium_actif = plan <> 'free' AND plan_expires_at IS NOT NULL AND plan_expires_at > now()
--
-- Rule 4/10 (préserver les données, ne pas casser l'historique) : un
-- basculement strict immédiat couperait sans préavis l'accès de tout compte
-- payant existant dont plan_expires_at est déjà NULL (accordé manuellement).
-- On leur pose donc une échéance explicite à J+1 mois (délai de grâce) plutôt
-- que de les repasser instantanément en free — DÉCISION PRODUIT À CONFIRMER :
-- ce délai, et surtout la mise en place d'un vrai processus (ou outil admin)
-- qui fixe toujours plan_expires_at lors d'une mise à niveau manuelle.
--
-- Rollback :
--   create or replace function public.has_paid_plan() ... (remettre la version 20260804120903, avec `plan_expires_at is null or ...`)
--   create or replace function public.effective_plan() ... (remettre la version 20260805150000)
--   -- pas de rollback pour le backfill de plan_expires_at (donnée déjà écrite, choix produit)

do $$
begin
  perform set_config('app.bypass_privilege_guard', 'on', true);

  update public.profiles
  set plan_expires_at = now() + interval '1 month'
  where plan <> 'free'
    and plan_expires_at is null;
end;
$$;

create or replace function public.has_paid_plan()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('essentiel', 'pro', 'business')
      and p.plan_expires_at is not null
      and p.plan_expires_at > now()
  );
$$;

create or replace function public.effective_plan()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.plan <> 'free' and (p.plan_expires_at is null or p.plan_expires_at <= now()) then 'free'
    else p.plan
  end
  from public.profiles p
  where p.id = auth.uid();
$$;
