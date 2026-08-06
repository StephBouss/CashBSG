-- P2.3 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Permet de masquer une
-- offre (ex. Business, tant que sa valeur n'est pas démontrée) sans la
-- supprimer, ni des types/migrations existants, ni des comptes déjà sur ce
-- plan.
--
-- plan_catalog.commercialisable (posée en P1.1) est déjà lue par
-- UpgradePage.tsx pour filtrer les offres proposées. Cette migration ajoute
-- le même contrôle côté serveur (rule 7 du cahier : une règle de plan/
-- monétisation ne doit jamais reposer uniquement sur l'UI) : un appel direct
-- à l'API ne doit pas pouvoir créer une demande de mise à niveau vers un
-- plan retiré de la vente.
--
-- Aucune valeur n'est changée ici : tous les plans restent
-- commercialisable = true. Pour masquer Business, il suffit d'exécuter
--   update public.plan_catalog set commercialisable = false where plan = 'business';
-- une fois la décision produit prise (P2.3) — sans nouvelle migration ni
-- déploiement de code.
--
-- Rollback :
--   drop trigger if exists trg_enforce_commercialisable_plan on public.upgrade_requests;
--   drop function if exists public.enforce_commercialisable_plan();

create or replace function public.enforce_commercialisable_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.plan_catalog
    where plan = new.requested_plan and commercialisable = true
  ) then
    raise exception 'L''offre demandée n''est pas disponible actuellement.';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_commercialisable_plan
before insert on public.upgrade_requests
for each row execute function public.enforce_commercialisable_plan();
