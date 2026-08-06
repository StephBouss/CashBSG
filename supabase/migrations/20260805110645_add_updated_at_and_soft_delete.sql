-- C2.4 — Traçabilité et suppression logique.
--
-- 1) updated_at sur les tables métier réellement modifiées après création
--    (pas les journaux append-only : ai_messages, client_errors,
--    admin_audit_log, ni les catégories qui ne sont jamais éditées),
--    maintenu par un trigger générique plutôt que par le code applicatif
--    (qui oublierait immanquablement un chemin d'update).
-- 2) deleted_at sur incomes/expenses/savings_movements : les suppressions
--    deviennent logiques (une "corbeille" implicite), pour ne plus perdre
--    définitivement une donnée financière sur une simple erreur de clic.
--    Les policies SELECT filtrent désormais les lignes supprimées.
--
-- Rollback :
--   drop trigger trg_set_updated_at_<table> on public.<table>; -- pour chaque table listée ci-dessous
--   drop function public.set_updated_at();
--   alter table public.<table> drop column updated_at; -- idem
--   alter table public.incomes drop column deleted_at;
--   alter table public.expenses drop column deleted_at;
--   alter table public.savings_movements drop column deleted_at;
--   -- puis recréer les policies *_history_by_plan sans "deleted_at is null"

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

alter table public.profiles add column updated_at timestamptz not null default now();
alter table public.incomes add column updated_at timestamptz not null default now();
alter table public.expenses add column updated_at timestamptz not null default now();
alter table public.savings_accounts add column updated_at timestamptz not null default now();
alter table public.savings_movements add column updated_at timestamptz not null default now();
alter table public.goals add column updated_at timestamptz not null default now();
alter table public.notifications add column updated_at timestamptz not null default now();
alter table public.upgrade_requests add column updated_at timestamptz not null default now();

create trigger trg_set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_incomes before update on public.incomes for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_expenses before update on public.expenses for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_savings_accounts before update on public.savings_accounts for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_savings_movements before update on public.savings_movements for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_goals before update on public.goals for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_notifications before update on public.notifications for each row execute function public.set_updated_at();
create trigger trg_set_updated_at_upgrade_requests before update on public.upgrade_requests for each row execute function public.set_updated_at();

alter table public.incomes add column deleted_at timestamptz;
alter table public.expenses add column deleted_at timestamptz;
alter table public.savings_movements add column deleted_at timestamptz;

drop policy if exists "incomes_history_by_plan" on public.incomes;
create policy "incomes_history_by_plan" on public.incomes for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date >= (date_trunc('month', now()) - interval '2 months') or public.has_paid_plan())
);

drop policy if exists "expenses_history_by_plan" on public.expenses;
create policy "expenses_history_by_plan" on public.expenses for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date_echeance >= (date_trunc('month', now()) - interval '2 months') or public.has_paid_plan())
);

drop policy if exists "savings_movements_history_by_plan" on public.savings_movements;
create policy "savings_movements_history_by_plan" on public.savings_movements for select using (
  auth.uid() = user_id
  and deleted_at is null
  and (date >= (date_trunc('month', now()) - interval '2 months') or public.has_paid_plan())
);
