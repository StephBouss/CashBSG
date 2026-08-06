-- P1.5 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Réduit les suppressions
-- physiques dangereuses sur les données financières.
--
-- Constat : 20260805110645_add_updated_at_and_soft_delete.sql (C2.4) a rendu
-- incomes/expenses/savings_movements logiquement supprimables (deleted_at),
-- mais pas les tables "conteneur" savings_accounts et goals, qui restent
-- supprimables physiquement par le client (deleteSavingsAccount/deleteGoal).
-- Or savings_movements.account_id et goal_contributions.goal_id référencent
-- ces tables en `on delete cascade` : supprimer un compte d'épargne efface
-- donc en un clic tout son historique de mouvements réels — y compris ceux
-- déjà protégés individuellement par leur propre deleted_at. La protection
-- C2.4 était donc contournable par la table parente.
--
-- Correction : deleted_at sur savings_accounts et goals ; policies "for all"
-- remplacées par select (deleted_at is null)/insert/update own — plus de
-- delete direct côté client. Les mouvements et contributions déjà passés
-- restent en base, simplement masqués avec leur compte/objectif d'origine.
--
-- Rollback :
--   drop policy if exists "savings_accounts_select_own" on public.savings_accounts;
--   drop policy if exists "savings_accounts_insert_own" on public.savings_accounts;
--   drop policy if exists "savings_accounts_update_own" on public.savings_accounts;
--   create policy "savings_accounts_owner" on public.savings_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   drop policy if exists "goals_select_own" on public.goals;
--   drop policy if exists "goals_insert_own" on public.goals;
--   drop policy if exists "goals_update_own" on public.goals;
--   create policy "goals_owner" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   alter table public.savings_accounts drop column deleted_at;
--   alter table public.goals drop column deleted_at;

alter table public.savings_accounts add column deleted_at timestamptz;
alter table public.goals add column deleted_at timestamptz;

drop policy if exists "savings_accounts_owner" on public.savings_accounts;

create policy "savings_accounts_select_own" on public.savings_accounts
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "savings_accounts_insert_own" on public.savings_accounts
  for insert with check (auth.uid() = user_id);
create policy "savings_accounts_update_own" on public.savings_accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_owner" on public.goals;

create policy "goals_select_own" on public.goals
  for select using (auth.uid() = user_id and deleted_at is null);
create policy "goals_insert_own" on public.goals
  for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Un compte archivé (deleted_at) libère sa place dans le plafond par plan,
-- comme pour le Tracker (enforce_tracker_limit).
create or replace function public.enforce_savings_account_limit()
returns trigger
language plpgsql
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  v_plan := public.effective_plan();

  v_limit := case
    when v_plan = 'free' then 1
    when v_plan = 'essentiel' and new.type = 'epargne' then 2
    when v_plan = 'essentiel' and new.type = 'investissement' then 1
    else null
  end;

  if v_limit is not null then
    select count(*) into v_count
    from public.savings_accounts
    where user_id = new.user_id and type = new.type and deleted_at is null;

    if v_count >= v_limit then
      raise exception 'Limite de % compte(s) % atteinte pour votre formule.', v_limit, new.type;
    end if;
  end if;

  return new;
end;
$$;
