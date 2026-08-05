-- Plafonds par plan sur le Tracker de dépenses et les comptes
-- Épargne/Investissement.
--
-- Comme pour l'historique (C1.2) : le gating ne doit pas être uniquement
-- côté client, sinon un appel direct à l'API Supabase contournerait la
-- limite affichée dans l'UI. Ces plafonds sont donc appliqués par un
-- trigger BEFORE INSERT, en plus du blocage côté front.
--
-- Tracker (expenses.source = 'tracker') : 5 entrées Free, 10 Essentiel,
-- illimité Pro/Business. Une entrée supprimée (deleted_at, cf. C2.4) libère
-- une place.
-- Comptes savings_accounts, par type (épargne / investissement) : Free 1+1,
-- Essentiel 2 épargne + 1 investissement, illimité Pro/Business.
--
-- Rollback :
--   drop trigger if exists trg_enforce_tracker_limit on public.expenses;
--   drop function if exists public.enforce_tracker_limit();
--   drop trigger if exists trg_enforce_savings_account_limit on public.savings_accounts;
--   drop function if exists public.enforce_savings_account_limit();
--   drop function if exists public.effective_plan();

-- Même règle que has_paid_plan() (20260803135011_...), mais renvoie le nom
-- du plan effectif plutôt qu'un simple booléen payant/non payant. Pas de
-- paramètre : toujours auth.uid(), pour qu'un utilisateur authentifié ne
-- puisse jamais interroger le plan d'un autre compte via ce RPC.
create or replace function public.effective_plan()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.plan <> 'free' and p.plan_expires_at is not null and p.plan_expires_at <= now() then 'free'
    else p.plan
  end
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.effective_plan() to authenticated;

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
  v_limit := case v_plan when 'free' then 5 when 'essentiel' then 10 else null end;

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

create trigger trg_enforce_tracker_limit
  before insert on public.expenses
  for each row execute function public.enforce_tracker_limit();

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
    where user_id = new.user_id and type = new.type;

    if v_count >= v_limit then
      raise exception 'Limite de % compte(s) % atteinte pour votre formule.', v_limit, new.type;
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_savings_account_limit
  before insert on public.savings_accounts
  for each row execute function public.enforce_savings_account_limit();
