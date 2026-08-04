-- Ajoute l'offre "Business" (25 000 FCFA/mois), affichée sur la landing
-- page (section Tarifs) et désormais sélectionnable/administrable comme
-- les autres plans.
--
-- Rollback :
--   -- s'assurer d'abord qu'aucun profil n'a plan = 'business'
--   alter table public.profiles drop constraint profiles_plan_check;
--   alter table public.profiles add constraint profiles_plan_check
--     check (plan in ('free', 'essentiel', 'pro'));
--   create or replace function public.has_paid_plan() ... (retirer 'business')

alter table public.profiles drop constraint profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('free', 'essentiel', 'pro', 'business'));

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
      and (p.plan_expires_at is null or p.plan_expires_at > now())
  );
$$;
