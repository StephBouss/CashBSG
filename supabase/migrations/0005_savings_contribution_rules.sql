-- Budget+ — règles de contribution pour les comptes Épargne/Investissement :
-- montant fixe, ou pourcentage d'un revenu précis (ou de l'ensemble des revenus)

alter table savings_accounts add column mode text not null default 'montant' check (mode in ('montant', 'pourcentage'));
alter table savings_accounts add column montant_fixe numeric;
alter table savings_accounts add column pourcentage numeric;
alter table savings_accounts add column category_id uuid references categories(id) on delete set null;
