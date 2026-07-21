-- Budget+ — page Finances : comptes d'épargne / investissement multiples avec historique

create table savings_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('epargne', 'investissement')),
  nom text not null,
  created_at timestamptz not null default now()
);

create table savings_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references savings_accounts(id) on delete cascade,
  montant numeric not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table savings_accounts enable row level security;
alter table savings_movements enable row level security;

create policy "savings_accounts_owner" on savings_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_movements_owner" on savings_movements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table savings_accounts;
alter publication supabase_realtime add table savings_movements;
