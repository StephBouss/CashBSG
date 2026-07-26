-- Journalisation des erreurs côté client (remplace un outil tiers type Sentry
-- par une solution auto-hébergée dans le même projet Supabase). Écriture
-- seule depuis le client : la lecture se fait directement en SQL ou via un
-- futur écran admin, jamais depuis l'app publique.

create table client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index client_errors_created_idx on client_errors (created_at desc);

alter table client_errors enable row level security;

create policy "client_errors_insert" on client_errors
  for insert
  with check (user_id is null or auth.uid() = user_id);
