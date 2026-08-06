-- P0.7 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Rend le quota mensuel du
-- conseiller IA non contournable.
--
-- Constat : la policy "ai_messages_owner" est un `for all` — un utilisateur
-- authentifié peut donc supprimer ou modifier ses propres lignes ai_messages
-- directement via l'API Supabase (aucune UI ne le fait, mais rien ne
-- l'empêche). Or ai-advisor/index.ts calcule le quota mensuel en comptant les
-- lignes `role = 'user'` du mois : un utilisateur peut donc effacer son
-- historique pour réinitialiser son quota à volonté. Le compteur burst/24h
-- utilise le même comptage et est donc contournable de la même façon.
--
-- Correction : (1) ai_messages devient select/insert own uniquement (plus de
-- update/delete côté client, comme goal_contributions en Sprint 1A) — ferme
-- le contournement par suppression ; (2) un ledger dédié ai_quota_usage,
-- incrémenté par une fonction security definer atomique (verrou de ligne via
-- `for update`), sert désormais de source de vérité pour le quota mensuel —
-- indépendant du contenu de la conversation, jamais écrit par le client.
--
-- Rollback :
--   drop function if exists public.consume_ai_quota();
--   drop table if exists public.ai_quota_usage;
--   drop policy if exists "ai_messages_select_own" on public.ai_messages;
--   drop policy if exists "ai_messages_insert_own" on public.ai_messages;
--   create policy "ai_messages_owner" on public.ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_messages_owner" on public.ai_messages;

create policy "ai_messages_select_own" on public.ai_messages
  for select using (auth.uid() = user_id);
create policy "ai_messages_insert_own" on public.ai_messages
  for insert with check (auth.uid() = user_id);

create table public.ai_quota_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

alter table public.ai_quota_usage enable row level security;

-- Lecture seule pour le propriétaire (affichage éventuel côté UI) ; toute
-- écriture passe exclusivement par consume_ai_quota() (security definer).
create policy "ai_quota_usage_select_own" on public.ai_quota_usage
  for select using (auth.uid() = user_id);

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
  v_limit := case v_plan
    when 'free' then 25
    when 'essentiel' then 100
    when 'pro' then 1000
    when 'business' then 3000
    else 25
  end;

  insert into public.ai_quota_usage (user_id, period_start, message_count)
  values (auth.uid(), v_period, 0)
  on conflict (user_id, period_start) do nothing;

  -- Verrou de ligne : deux appels concurrents pour le même utilisateur se
  -- sérialisent ici, ce qui rend l'incrément atomique (pas de dépassement
  -- de quota par une course entre deux requêtes simultanées).
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

grant execute on function public.consume_ai_quota() to authenticated;
revoke execute on function public.consume_ai_quota() from public, anon;
