-- P1.6 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Revenus récurrents réels.
--
-- Constat : incomes.frequence (mensuel/hebdomadaire/annuel, seules valeurs
-- proposées par AddTransactionModal.tsx — "Une seule fois" laisse la colonne
-- null) est enregistré à la création mais jamais lu par aucun moteur : un
-- revenu "mensuel" ne génère aucune occurrence future, la landing/le champ
-- promettent une récurrence qui n'existe pas en pratique (lien avec P1.8).
--
-- Modèle retenu : une ligne "racine" (recurrence_source_id is null,
-- frequence non nulle, recurrence_active) porte le montant/libellé/catégorie
-- de référence. Chaque occurrence générée référence sa racine via
-- recurrence_source_id, ce qui : (1) évite tout doublon — un index unique
-- partiel (recurrence_source_id, date) rend une double exécution du job sans
-- effet même en cas de concurrence réelle, pas seulement par construction de
-- la requête ; (2) permet d'arrêter une récurrence sans supprimer
-- l'historique déjà généré (recurrence_active = false) ; (3) fait que
-- modifier la racine (montant, libellé, catégorie) change les occurrences
-- FUTURES sans réécrire les occurrences déjà générées (rule 10 — ne pas
-- casser l'historique).
--
-- La date de la prochaine occurrence est calculée à partir du max(date) déjà
-- connu dans la série (racine + occurrences), SANS filtrer deleted_at : une
-- occurrence supprimée par l'utilisateur ne doit jamais être régénérée au
-- prochain passage du job.
--
-- Rollback :
--   select cron.unschedule('generate-recurring-incomes-daily');
--   drop function if exists public.generate_recurring_income_occurrences();
--   drop index if exists public.idx_incomes_recurrence_occurrence_unique;
--   drop index if exists public.idx_incomes_recurrence_source;
--   alter table public.incomes drop column recurrence_source_id;
--   alter table public.incomes drop column recurrence_active;

alter table public.incomes add column recurrence_source_id uuid references public.incomes(id) on delete set null;
alter table public.incomes add column recurrence_active boolean not null default true;

create index idx_incomes_recurrence_source on public.incomes (recurrence_source_id);

-- Empêche toute occurrence en double pour une même série/date, y compris en
-- cas d'exécutions concurrentes du job (double exécution = test obligatoire).
create unique index idx_incomes_recurrence_occurrence_unique
  on public.incomes (recurrence_source_id, date)
  where recurrence_source_id is not null;

create or replace function public.generate_recurring_income_occurrences()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_root record;
  v_last_date date;
  v_next_date date;
  v_step interval;
  v_iterations integer;
begin
  for v_root in
    select * from public.incomes
    where recurrence_source_id is null
      and frequence is not null
      and recurrence_active = true
      and deleted_at is null
  loop
    v_step := case v_root.frequence
      when 'hebdomadaire' then interval '7 days'
      when 'mensuel' then interval '1 month'
      when 'annuel' then interval '1 year'
      else null
    end;

    if v_step is null then
      continue;
    end if;

    -- max(date) SANS "deleted_at is null" : une occurrence supprimée par
    -- l'utilisateur reste "déjà générée" et ne doit pas être recréée.
    select max(date) into v_last_date
    from public.incomes
    where id = v_root.id or recurrence_source_id = v_root.id;

    v_next_date := (v_last_date + v_step)::date;
    v_iterations := 0;

    while v_next_date <= current_date and v_iterations < 500 loop
      insert into public.incomes (user_id, category_id, nom, montant, frequence, date, recurrence_source_id, recurrence_active)
      values (v_root.user_id, v_root.category_id, v_root.nom, v_root.montant, v_root.frequence, v_next_date, v_root.id, true)
      on conflict (recurrence_source_id, date) where recurrence_source_id is not null do nothing;

      v_last_date := v_next_date;
      v_next_date := (v_last_date + v_step)::date;
      v_iterations := v_iterations + 1;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.generate_recurring_income_occurrences() from public, authenticated, anon;
grant execute on function public.generate_recurring_income_occurrences() to service_role;

select cron.schedule(
  'generate-recurring-incomes-daily',
  '0 4 * * *',
  $$select public.generate_recurring_income_occurrences();$$
);
