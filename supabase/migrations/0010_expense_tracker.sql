-- Tracker des dépenses — module simple et indépendant de la table "expenses"
-- (qui sert au suivi des factures avec échéance/statut/priorité). Ici : trois
-- champs obligatoires seulement (nom, catégorie, coût total), horodatage
-- automatique via created_at, aucune saisie de date/heure par l'utilisateur.

create table expense_tracker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  category_id uuid not null references categories(id) on delete restrict,
  montant numeric not null check (montant > 0),
  created_at timestamptz not null default now()
);

create index expense_tracker_user_created_idx on expense_tracker (user_id, created_at desc);

alter table expense_tracker enable row level security;

create policy "expense_tracker_owner" on expense_tracker
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table expense_tracker;
