-- C2.2 — Les colonnes monétaires étaient en numeric sans précision/échelle
-- définie ("unbounded numeric"), ce qui accepte n'importe quelle précision
-- et peut introduire des incohérences d'arrondi entre lignes. On les borne
-- toutes à numeric(14,2) : deux décimales suffisent pour toute devise gérée
-- par l'application (le FCFA n'affiche pas de décimales côté front, mais la
-- valeur stockée reste exacte au centime pour les devises qui en ont).
--
-- Rollback :
--   alter table public.expenses alter column montant type numeric;
--   alter table public.incomes alter column montant type numeric;
--   alter table public.expense_tracker alter column montant type numeric;
--   alter table public.goals alter column montant_cible type numeric;
--   alter table public.goals alter column montant_epargne type numeric;
--   alter table public.savings_accounts alter column montant_fixe type numeric;
--   alter table public.savings_movements alter column montant type numeric;

alter table public.expenses alter column montant type numeric(14, 2);
alter table public.incomes alter column montant type numeric(14, 2);
alter table public.expense_tracker alter column montant type numeric(14, 2);
alter table public.goals alter column montant_cible type numeric(14, 2);
alter table public.goals alter column montant_epargne type numeric(14, 2);
alter table public.savings_accounts alter column montant_fixe type numeric(14, 2);
alter table public.savings_movements alter column montant type numeric(14, 2);
