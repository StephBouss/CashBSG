-- C2.1 — Fusionne expense_tracker dans expenses pour que Dashboard, Rapports
-- et Administration additionnent réellement toutes les dépenses saisies,
-- quel que soit le mode de saisie (facture planifiée ou pointage rapide).
--
-- expense_tracker n'est PAS supprimée par cette migration : elle est gelée
-- en écriture côté application (le front lit/écrit désormais expenses avec
-- source = 'tracker') mais conservée en base jusqu'à validation explicite,
-- au cas où un rollback serait nécessaire.
--
-- Rollback :
--   delete from public.expenses where source = 'tracker';
--   alter table public.expenses alter column date_echeance set not null;
--   alter table public.expenses drop column source;

alter table public.expenses
  add column source text not null default 'facture' check (source in ('facture', 'tracker'));

alter table public.expenses alter column date_echeance drop not null;

-- Reprise des lignes existantes de expense_tracker : la date de pointage
-- (created_at) sert d'échéance et de date de paiement, le statut est
-- toujours "payé" (un pointage rapide décrit une dépense déjà faite).
insert into public.expenses
  (user_id, category_id, nom, montant, date_echeance, priorite, statut, date_paiement, source, created_at)
select
  user_id,
  category_id,
  nom,
  montant,
  (created_at at time zone 'utc')::date,
  null,
  'paye',
  (created_at at time zone 'utc')::date,
  'tracker',
  created_at
from public.expense_tracker;
