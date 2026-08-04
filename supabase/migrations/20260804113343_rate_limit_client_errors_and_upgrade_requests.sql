-- C1.4 — Limitation de débit sur client_errors et upgrade_requests.
--
-- client_errors : la policy actuelle ("client_errors_insert",
-- 0011_client_errors.sql) autorise `user_id is null or auth.uid() =
-- user_id` — un appelant NON authentifié peut donc insérer sans aucune
-- limite avec la seule clé anon publique. On exige désormais une session
-- authentifiée, et on plafonne la fréquence par utilisateur (20/5min) via
-- un trigger — répliquant le pattern déjà éprouvé dans l'Edge Function
-- ai-advisor (comptage direct côté serveur) plutôt qu'une nouvelle table
-- `rate_limits` générique, pour rester cohérent avec l'existant.
--
-- Compromis assumé : on perd la capture des erreurs survenant avant
-- connexion (page de login cassée, par ex.) — errorLogging.ts est déjà
-- best-effort (try/catch qui avale l'échec), donc aucun changement front
-- n'est requis, seulement une perte de couverture pour ce cas précis.
--
-- upgrade_requests : aucune policy n'empêchait plusieurs demandes
-- "en_attente" simultanées pour un même utilisateur. Un index unique
-- partiel est plus simple et plus robuste qu'un trigger pour ce cas.
--
-- Rollback :
--   drop trigger if exists trg_client_errors_rate_limit on public.client_errors;
--   drop function if exists public.enforce_client_errors_rate_limit();
--   drop policy if exists "client_errors_insert_authenticated" on public.client_errors;
--   create policy "client_errors_insert" on public.client_errors for insert with check (user_id is null or auth.uid() = user_id);
--   drop index if exists upgrade_requests_one_pending_per_user;

drop policy if exists "client_errors_insert" on public.client_errors;

create policy "client_errors_insert_authenticated" on public.client_errors
  for insert with check (auth.uid() is not null and auth.uid() = user_id);

create or replace function public.enforce_client_errors_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from public.client_errors
  where user_id = new.user_id
    and created_at > now() - interval '5 minutes';

  if recent_count >= 20 then
    raise exception 'Limite de journalisation d''erreurs atteinte, réessayez plus tard.';
  end if;

  return new;
end;
$$;

create trigger trg_client_errors_rate_limit
before insert on public.client_errors
for each row execute function public.enforce_client_errors_rate_limit();

create unique index upgrade_requests_one_pending_per_user
  on public.upgrade_requests (user_id)
  where status = 'en_attente';
