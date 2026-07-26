-- Demandes de mise à niveau de plan. Il n'y a pas encore de prestataire de
-- paiement intégré : le client soumet sa demande, l'équipe la traite
-- manuellement (contact + paiement) puis met à jour profiles.plan.
create table if not exists upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  current_plan text not null,
  requested_plan text not null,
  status text not null default 'en_attente',
  created_at timestamptz not null default now()
);

alter table upgrade_requests enable row level security;

create policy "upgrade_requests_insert_own" on upgrade_requests
  for insert with check (auth.uid() = user_id);

create policy "upgrade_requests_select_own" on upgrade_requests
  for select using (auth.uid() = user_id);
