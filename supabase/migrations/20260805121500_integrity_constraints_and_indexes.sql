-- C2.6 — Contraintes d'intégrité et index.
--
-- `incomes.montant`/`expenses.montant >= 0` et l'unicité de
-- `notifications (user_id, dedupe_key)` existent déjà depuis la création de
-- ces tables (0001_init.sql, 0013_expiry_tokens_notifications.sql) ; le
-- cascade compte -> mouvements existe aussi (`on delete cascade` sur
-- savings_movements.account_id, 0003_savings_investments.sql). Il manquait :
-- 1) une contrainte de plage sur `savings_accounts.pourcentage`.
-- 2) des index sur les colonnes qui filtrent réellement les requêtes du
--    dashboard (user_id + date dans useIncomes/useExpenses, account_id +
--    date dans useSavingsMovements, user_id + created_at dans l'edge
--    function ai-advisor pour ai_messages).
--
-- Rollback :
--   alter table public.savings_accounts drop constraint if exists chk_savings_pourcentage;
--   drop index if exists public.idx_incomes_user_date;
--   drop index if exists public.idx_expenses_user_date;
--   drop index if exists public.idx_savmov_account_date;
--   drop index if exists public.idx_aimsg_user_date;

alter table public.savings_accounts
  add constraint chk_savings_pourcentage check (pourcentage is null or pourcentage between 0 and 100);

create index if not exists idx_incomes_user_date on public.incomes (user_id, date);
create index if not exists idx_expenses_user_date on public.expenses (user_id, date_echeance);
-- Requête réelle (useSavingsMovements) : filtre par compte, trie par date.
create index if not exists idx_savmov_account_date on public.savings_movements (account_id, date);
create index if not exists idx_aimsg_user_date on public.ai_messages (user_id, created_at);
