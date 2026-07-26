-- Date d'expiration du plan payant (null pour le plan gratuit, qui n'expire
-- pas). Renseignée manuellement par l'administrateur lors du traitement
-- d'une demande de mise à niveau, tant qu'aucun paiement automatisé n'est
-- branché (voir upgrade_requests, migration 0012).
alter table profiles add column if not exists plan_expires_at timestamptz;

-- Tokens consommés par l'API DeepSeek pour chaque réponse du conseiller IA
-- (suivi de consommation, affiché dans le panneau administrateur).
alter table ai_messages add column if not exists tokens_used integer;

-- Notifications in-app (rappels d'échéance d'abonnement, etc.). Générées
-- côté client à la connexion (pas de tâche planifiée serveur), avec une clé
-- de dédoublonnage pour garantir qu'un même rappel n'est créé qu'une fois.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  dedupe_key text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select using (auth.uid() = user_id);

create policy "notifications_insert_own" on notifications
  for insert with check (auth.uid() = user_id);

create policy "notifications_update_own" on notifications
  for update using (auth.uid() = user_id);
