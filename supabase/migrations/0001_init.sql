-- Budget+ — sous-projet 1 : fondations (profiles, categories, incomes, expenses, tithes)

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text,
  devise text not null default 'FCFA',
  langue text not null default 'fr',
  pourcentage_dime numeric not null default 15,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  type text not null check (type in ('revenu','depense')),
  couleur text,
  icone text,
  created_at timestamptz not null default now()
);

create table incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  nom text not null,
  montant numeric not null check (montant >= 0),
  frequence text,
  date date not null,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  nom text not null,
  montant numeric not null check (montant >= 0),
  date_echeance date not null,
  priorite text,
  statut text not null check (statut in ('paye','a_venir','en_retard')) default 'a_venir',
  date_paiement timestamptz,
  created_at timestamptz not null default now()
);

create table tithes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revenu_brut numeric not null default 0,
  pourcentage numeric not null,
  montant numeric not null default 0,
  statut text not null check (statut in ('paye','du')) default 'du',
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table profiles enable row level security;
alter table categories enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table tithes enable row level security;

create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "categories_owner" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incomes_owner" on incomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_owner" on expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tithes_owner" on tithes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed automatique à l'inscription : profil + catégories par défaut
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);

  insert into public.categories (user_id, nom, type) values
    (new.id, 'Salaire', 'revenu'),
    (new.id, 'Freelance / Activité annexe', 'revenu'),
    (new.id, 'Logement', 'depense'),
    (new.id, 'Transport', 'depense'),
    (new.id, 'Nourriture', 'depense'),
    (new.id, 'Assurances & remboursements', 'depense'),
    (new.id, 'Soins & vie courante', 'depense'),
    (new.id, 'Loisirs & sorties', 'depense'),
    (new.id, 'Imprévus / autres', 'depense');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Realtime sur les tables du socle financier
alter publication supabase_realtime add table incomes;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table tithes;
