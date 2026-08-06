-- P0.5 — Relie les objectifs à des contributions réelles et traçables.
--
-- Constat : goals.montant_epargne était un compteur stocké, modifiable par
-- trois chemins indépendants (création, formulaire d'édition, bouton
-- "+ Ajouter" via increment_goal_epargne() de C2.5) sans aucune ligne
-- d'historique — impossible de savoir QUAND/COMBIEN a été contribué, et
-- rien n'empêchait deux "vérités" de diverger.
--
-- Nouvelle architecture : goal_contributions devient le ledger append-only
-- (une ligne par contribution réelle), goals.montant_epargne devient un
-- cache dérivé, maintenu UNIQUEMENT par le trigger apply_goal_contribution
-- ci-dessous — protect_goal_epargne bloque toute autre écriture directe de
-- cette colonne (même mécanisme que protect_profile_privileges, C1.1).
--
-- Rollback :
--   drop trigger if exists trg_protect_goal_epargne on public.goals;
--   drop function if exists public.protect_goal_epargne();
--   drop function if exists public.contribute_to_goal(uuid, numeric);
--   drop trigger if exists trg_apply_goal_contribution on public.goal_contributions;
--   drop function if exists public.apply_goal_contribution();
--   drop table if exists public.goal_contributions;
--   -- puis recréer increment_goal_epargne() dans sa version C2.5

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  montant numeric(14, 2) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.goal_contributions enable row level security;

create index idx_goal_contributions_goal on public.goal_contributions (goal_id, created_at);

create policy "goal_contributions_select_own" on public.goal_contributions
  for select using (auth.uid() = user_id);

-- Ledger append-only : pas de policy update/delete. Le check vérifie aussi
-- que l'objectif ciblé appartient bien à l'appelant (defense in depth,
-- redondant avec le contrôle explicite dans contribute_to_goal()).
create policy "goal_contributions_insert_own" on public.goal_contributions
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid())
  );

create or replace function public.apply_goal_contribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.bypass_goal_epargne_guard', 'on', true);

  update public.goals
  set montant_epargne = montant_epargne + new.montant
  where id = new.goal_id;

  return new;
end;
$$;

create trigger trg_apply_goal_contribution
after insert on public.goal_contributions
for each row execute function public.apply_goal_contribution();

create or replace function public.protect_goal_epargne()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(current_setting('app.bypass_goal_epargne_guard', true), 'off') <> 'on' then
    new.montant_epargne := old.montant_epargne;
  end if;
  return new;
end;
$$;

create trigger trg_protect_goal_epargne
before update on public.goals
for each row execute function public.protect_goal_epargne();

-- Remplace increment_goal_epargne() (C2.5) : celle-ci écrivait directement
-- montant_epargne (désormais protégé) sans laisser de trace individuelle.
create or replace function public.contribute_to_goal(p_goal_id uuid, p_amount numeric, p_note text default null)
returns public.goals
language plpgsql
as $$
declare
  result public.goals;
begin
  if p_amount = 0 then
    raise exception 'Le montant de la contribution doit être différent de zéro.';
  end if;

  if not exists (select 1 from public.goals where id = p_goal_id and user_id = auth.uid()) then
    raise exception 'Objectif introuvable ou accès refusé.';
  end if;

  insert into public.goal_contributions (user_id, goal_id, montant, note)
  values (auth.uid(), p_goal_id, p_amount, p_note);

  select * into result from public.goals where id = p_goal_id;
  return result;
end;
$$;

grant execute on function public.contribute_to_goal(uuid, numeric, text) to authenticated;

drop function if exists public.increment_goal_epargne(uuid, numeric);

-- Reprise des données existantes : un objectif déjà avancé (montant_epargne
-- > 0) sans aucune contribution enregistrée reçoit UNE ligne de rattrapage,
-- pour ne pas remettre sa progression à zéro. Le trigger d'application est
-- désactivé le temps de l'insertion pour ne pas doubler le total déjà en
-- place. Idempotent : ne vise que les objectifs sans contribution existante,
-- donc sans effet si cette migration est rejouée.
alter table public.goal_contributions disable trigger trg_apply_goal_contribution;

insert into public.goal_contributions (user_id, goal_id, montant, note, created_at)
select g.user_id, g.id, g.montant_epargne, 'Solde de départ (reprise migration 2026-08-06)', g.created_at
from public.goals g
where g.montant_epargne <> 0
  and not exists (select 1 from public.goal_contributions c where c.goal_id = g.id);

alter table public.goal_contributions enable trigger trg_apply_goal_contribution;
