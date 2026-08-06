-- P1.1 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Source de vérité des
-- plans et entitlements.
--
-- Constat : les mêmes nombres (quota IA, plafonds Tracker/épargne, fenêtre
-- d'historique) sont dupliqués en dur dans plusieurs fonctions SQL
-- (enforce_tracker_limit, enforce_savings_account_limit, consume_ai_quota,
-- les policies *_history_by_plan) et dans src/lib/plan.ts. Un changement de
-- valeur dans un seul de ces endroits fait diverger silencieusement les
-- autres — exactement le risque illustré par l'audit ("25 messages IA Free
-- dans un endroit et 10 ailleurs").
--
-- Correction : un catalogue canonique unique (plan_catalog), lu par TOUTES
-- les fonctions serveur qui appliquent une limite (remplace leurs CASE en
-- dur). Les valeurs reprises ici sont EXACTEMENT celles déjà en vigueur
-- dans le dépôt (aucune nouvelle décision commerciale prise silencieusement
-- — cf. règle 9 du cahier). `commercialisable` est ajouté maintenant comme
-- infrastructure pour une décision P2.3 future (masquer Business), sans
-- changer aujourd'hui la visibilité d'aucun plan.
--
-- Lecture publique (anon + authenticated) : ce ne sont que des quotas/prix
-- affichables, pas une donnée sensible — nécessaire pour qu'un futur écran
-- de tarifs public (landing) puisse consommer ce même catalogue plutôt que
-- de le redupliquer une fois de plus.
--
-- Rollback :
--   drop function if exists public.get_plan_catalog();
--   drop function if exists public.history_window_start();
--   drop table if exists public.plan_catalog;
--   -- puis restaurer les CASE en dur dans consume_ai_quota / enforce_tracker_limit
--   -- / enforce_savings_account_limit / les policies *_history_by_plan (versions précédentes)

create table public.plan_catalog (
  plan text primary key check (plan in ('free', 'essentiel', 'pro', 'business')),
  sort_order integer not null,
  label text not null,
  price_display text not null,
  ai_quota integer not null,
  tracker_limit integer, -- null = illimité
  savings_epargne_limit integer, -- null = illimité
  savings_investissement_limit integer, -- null = illimité
  history_window_months integer, -- null = illimité (has_paid_plan())
  commercialisable boolean not null default true
);

alter table public.plan_catalog enable row level security;

create policy "plan_catalog_read_all" on public.plan_catalog
  for select using (true);

insert into public.plan_catalog
  (plan, sort_order, label, price_display, ai_quota, tracker_limit, savings_epargne_limit, savings_investissement_limit, history_window_months, commercialisable)
values
  ('free',      0, 'Iwadu Free',      'Gratuit',          25,   5, 1,    1,    2,    true),
  ('essentiel', 1, 'Iwadu Essentiel', '5 000 FCFA/mois',  100, 10, 2,    1,    null, true),
  ('pro',       2, 'Iwadu Pro',       '15 000 FCFA/mois', 1000, null, null, null, null, true),
  ('business',  3, 'Iwadu Business',  '25 000 FCFA/mois', 3000, null, null, null, null, true);

create or replace function public.get_plan_catalog()
returns setof public.plan_catalog
language sql
stable
security definer
set search_path = public
as $$
  select * from public.plan_catalog order by sort_order;
$$;

grant execute on function public.get_plan_catalog() to authenticated, anon;

-- Fenêtre d'historique du plan free (utilisée par les policies
-- *_history_by_plan sur expenses/incomes/savings_movements) : un seul
-- endroit au lieu de la répéter en dur dans 3 policies.
create or replace function public.history_window_start()
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (date_trunc('month', now()) - make_interval(months => coalesce(
    (select history_window_months from public.plan_catalog where plan = 'free'),
    2
  )))::date;
$$;

grant execute on function public.history_window_start() to authenticated;

drop policy if exists "expenses_history_by_plan" on public.expenses;
create policy "expenses_history_by_plan" on public.expenses for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date_echeance >= public.history_window_start() or public.has_paid_plan())
);

drop policy if exists "incomes_history_by_plan" on public.incomes;
create policy "incomes_history_by_plan" on public.incomes for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date >= public.history_window_start() or public.has_paid_plan())
);

drop policy if exists "savings_movements_history_by_plan" on public.savings_movements;
create policy "savings_movements_history_by_plan" on public.savings_movements for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date >= public.history_window_start() or public.has_paid_plan())
);

create or replace function public.enforce_tracker_limit()
returns trigger
language plpgsql
as $$
declare
  v_plan text;
  v_limit integer;
  v_count integer;
begin
  if new.source <> 'tracker' then
    return new;
  end if;

  v_plan := public.effective_plan();
  select tracker_limit into v_limit from public.plan_catalog where plan = v_plan;

  if v_limit is not null then
    select count(*) into v_count
    from public.expenses
    where user_id = new.user_id and source = 'tracker' and deleted_at is null;

    if v_count >= v_limit then
      raise exception 'Limite de % entrées du Tracker atteinte pour votre formule.', v_limit;
    end if;
  end if;

  return new;
end;
$$;

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

  select case when new.type = 'epargne' then savings_epargne_limit else savings_investissement_limit end
  into v_limit
  from public.plan_catalog where plan = v_plan;

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

create or replace function public.consume_ai_quota()
returns table(message_count integer, quota_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_limit integer;
  v_period date := date_trunc('month', now())::date;
  v_count integer;
begin
  v_plan := public.effective_plan();
  select ai_quota into v_limit from public.plan_catalog where plan = v_plan;
  v_limit := coalesce(v_limit, 25);

  insert into public.ai_quota_usage (user_id, period_start, message_count)
  values (auth.uid(), v_period, 0)
  on conflict (user_id, period_start) do nothing;

  select aqu.message_count into v_count
  from public.ai_quota_usage aqu
  where aqu.user_id = auth.uid() and aqu.period_start = v_period
  for update;

  if v_count >= v_limit then
    raise exception 'ai_quota_exceeded' using errcode = 'P0001';
  end if;

  update public.ai_quota_usage
  set message_count = public.ai_quota_usage.message_count + 1, updated_at = now()
  where user_id = auth.uid() and period_start = v_period
  returning public.ai_quota_usage.message_count into v_count;

  return query select v_count, v_limit;
end;
$$;

-- Utilisée par ai-advisor pour construire le message d'erreur 429 sans
-- dupliquer la table AI_MESSAGE_QUOTA côté Deno.
create or replace function public.effective_ai_quota()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select ai_quota from public.plan_catalog where plan = public.effective_plan()),
    25
  );
$$;

grant execute on function public.effective_ai_quota() to authenticated;
