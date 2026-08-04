-- C1.2 — Déplace le gating de plan côté serveur.
--
-- Constat : `canAccessFullHistory()` (src/lib/plan.ts) est le seul gating de
-- plan réellement utilisé pour restreindre une donnée (dans
-- ReportsDashboard.tsx), mais il est 100% côté client — aucune policy RLS
-- ne limite `expenses`/`incomes`/`savings_movements` selon le plan. Un
-- compte Free peut donc lire tout son historique ancien directement via
-- l'API Supabase en contournant l'UI.
--
-- Fenêtre retenue : 2 mois glissants (mois en cours + le mois précédent
-- complet). Choix produit nouveau (rien d'équivalent n'existait déjà dans
-- l'app) — cohérent avec la valeur donnée en exemple dans l'audit.
-- `plan.ts` reste la source d'affichage (masquer un onglet, un badge) mais
-- n'est plus l'unique barrière : la base décide de ce qui est accessible.
--
-- Rollback :
--   drop policy if exists "expenses_history_by_plan" on public.expenses;
--   drop policy if exists "expenses_write_own" on public.expenses;
--   drop policy if exists "expenses_update_own" on public.expenses;
--   drop policy if exists "expenses_delete_own" on public.expenses;
--   create policy "expenses_owner" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   (idem pour incomes et savings_movements, puis drop function has_paid_plan)

create or replace function public.has_paid_plan()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('essentiel', 'pro')
      and (p.plan_expires_at is null or p.plan_expires_at > now())
  );
$$;

-- expenses (colonne de date réelle : date_echeance)
drop policy if exists "expenses_owner" on public.expenses;

create policy "expenses_write_own" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);
create policy "expenses_history_by_plan" on public.expenses
  for select using (
    auth.uid() = user_id
    and (
      date_echeance >= (date_trunc('month', now()) - interval '2 months')
      or public.has_paid_plan()
    )
  );

-- incomes (colonne de date réelle : date)
drop policy if exists "incomes_owner" on public.incomes;

create policy "incomes_write_own" on public.incomes
  for insert with check (auth.uid() = user_id);
create policy "incomes_update_own" on public.incomes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incomes_delete_own" on public.incomes
  for delete using (auth.uid() = user_id);
create policy "incomes_history_by_plan" on public.incomes
  for select using (
    auth.uid() = user_id
    and (
      date >= (date_trunc('month', now()) - interval '2 months')
      or public.has_paid_plan()
    )
  );

-- savings_movements (colonne de date réelle : date) — même raisonnement,
-- par cohérence avec expenses/incomes.
drop policy if exists "savings_movements_owner" on public.savings_movements;

create policy "savings_movements_write_own" on public.savings_movements
  for insert with check (auth.uid() = user_id);
create policy "savings_movements_update_own" on public.savings_movements
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "savings_movements_delete_own" on public.savings_movements
  for delete using (auth.uid() = user_id);
create policy "savings_movements_history_by_plan" on public.savings_movements
  for select using (
    auth.uid() = user_id
    and (
      date >= (date_trunc('month', now()) - interval '2 months')
      or public.has_paid_plan()
    )
  );
