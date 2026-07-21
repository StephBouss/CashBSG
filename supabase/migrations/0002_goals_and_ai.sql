-- Budget+ — sous-projets D (Objectifs) et F (Conseiller IA)

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  icone text not null default '🎯',
  couleur text not null default '#10B981',
  montant_cible numeric not null check (montant_cible > 0),
  montant_epargne numeric not null default 0 check (montant_epargne >= 0),
  date_cible date,
  contribution_mensuelle numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table goals enable row level security;

create policy "goals_owner" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table goals;

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table ai_messages enable row level security;

create policy "ai_messages_owner" on ai_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table ai_messages;
