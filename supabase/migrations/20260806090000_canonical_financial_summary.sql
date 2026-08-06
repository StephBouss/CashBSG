-- P0.1/P0.2/P0.3/P0.4/P0.6 — Moteur financier canonique.
--
-- Constat (audit du 06/08/2026) : useExpenses() (Dashboard, Dépenses) filtre
-- `.eq("source", "facture")`, alors que useMonthlyTrend/useCategoryTotalsRange
-- (Rapports, graphique de tendance du Dashboard) et l'edge function
-- ai-advisor ne filtrent PAS `source` — le Dashboard affiche donc deux
-- totaux de dépenses différents pour le même mois selon le widget regardé,
-- et un troisième pour l'IA. `source` est une provenance (facture planifiée
-- vs pointage Tracker), pas un critère d'inclusion dans les agrégats.
--
-- "Solde disponible / Après toutes charges" (SummaryCards.tsx) et
-- "Épargne nette" (ReportsDashboard.tsx) sont tous deux littéralement
-- `revenus - dépenses payées` : ni les charges à venir/en retard, ni les
-- mouvements d'épargne n'y entrent, en contradiction avec leur propre
-- libellé.
--
-- Cette fonction devient LA seule vérité financière, appelée par le
-- Dashboard, les Rapports et l'edge function ai-advisor (RPC), pour
-- garantir des totaux identiques partout — au lieu de dupliquer la
-- formule en TypeScript et en Deno.
--
-- Sécurité : SECURITY DEFINER + filtre explicite sur auth.uid(), à
-- l'identique de savings_account_balance() (C2.5) — le calcul reste
-- toujours celui de l'appelant. C'est un choix nécessaire, pas seulement
-- défensif : la fenêtre d'historique par plan (C1.2, RLS
-- "*_history_by_plan") limite la lecture détaillée des transactions à 2
-- mois pour Free, mais "combien je dois encore payer" ne doit jamais être
-- masqué à l'utilisateur par un paywall — même raisonnement que
-- savings_account_balance(). En SECURITY INVOKER, un utilisateur Free avec
-- une facture impayée vieille de 4 mois verrait cette dette disparaître de
-- son "reste à vivre prévisionnel", ce qui serait activement trompeur.
--
-- charges_a_venir / charges_en_retard utilisent le statut EFFECTIF
-- (non payé + échéance < date de référence => en retard), pas la colonne
-- `statut` stockée qui peut être obsolète (P0.6) : `p_reference` est
-- injectable pour des tests déterministes, indépendants de l'horloge réelle.
--
-- Rollback :
--   drop function if exists public.financial_summary(date, date, date);

create or replace function public.financial_summary(
  p_start date,
  p_end date,
  p_reference date default current_date
)
returns table (
  revenus_encaisses numeric,
  depenses_payees numeric,
  charges_a_venir numeric,
  charges_en_retard numeric,
  charges_restantes numeric,
  flux_epargne_net numeric,
  solde_liquide numeric,
  reste_a_vivre_previsionnel numeric,
  epargne_periode numeric,
  epargne_cumulee numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with rev as (
    select coalesce(sum(montant), 0)::numeric as total
    from public.incomes
    where user_id = auth.uid() and deleted_at is null
      and date >= p_start and date <= p_end
  ),
  dep_payees as (
    select coalesce(sum(montant), 0)::numeric as total
    from public.expenses
    where user_id = auth.uid() and deleted_at is null
      and statut = 'paye'
      and date_echeance >= p_start and date_echeance <= p_end
  ),
  -- "dues sur la période" : échéance dans [référence, fin de période].
  charges_venir as (
    select coalesce(sum(montant), 0)::numeric as total
    from public.expenses
    where user_id = auth.uid() and deleted_at is null
      and statut <> 'paye'
      and date_echeance >= p_reference
      and date_echeance <= p_end
  ),
  -- "antérieures toujours impayées" : tout le passif non soldé, sans
  -- borne basse — un impayé d'il y a 6 mois compte toujours.
  charges_retard as (
    select coalesce(sum(montant), 0)::numeric as total
    from public.expenses
    where user_id = auth.uid() and deleted_at is null
      and statut <> 'paye'
      and date_echeance < p_reference
      and date_echeance <= p_end
  ),
  epargne_periode as (
    select coalesce(sum(m.montant), 0)::numeric as total
    from public.savings_movements m
    where m.user_id = auth.uid() and m.deleted_at is null
      and m.date >= p_start and m.date <= p_end
  ),
  epargne_cumulee as (
    select coalesce(sum(m.montant), 0)::numeric as total
    from public.savings_movements m
    where m.user_id = auth.uid() and m.deleted_at is null
      and m.date <= p_end
  )
  select
    rev.total,
    dep_payees.total,
    charges_venir.total,
    charges_retard.total,
    charges_venir.total + charges_retard.total,
    epargne_periode.total,
    rev.total - dep_payees.total - epargne_periode.total,
    (rev.total - dep_payees.total - epargne_periode.total) - (charges_venir.total + charges_retard.total),
    epargne_periode.total,
    epargne_cumulee.total
  from rev, dep_payees, charges_venir, charges_retard, epargne_periode, epargne_cumulee;
$$;

revoke all on function public.financial_summary(date, date, date) from public, anon;
grant execute on function public.financial_summary(date, date, date) to authenticated;

-- P0.6 (matérialisation) — job idempotent qui bascule les factures
-- réellement en retard, pour les consommateurs qui lisent encore la
-- colonne `statut` brute (ex. futurs rappels serveur, admin). La vérité
-- "à la lecture" reste financial_summary()/effectiveExpenseStatus() côté
-- client : ce job ne fait que garder la colonne cohérente en arrière-plan.
create or replace function public.materialize_overdue_expenses()
returns void
language sql
security definer
set search_path = public
as $$
  update public.expenses
  set statut = 'en_retard'
  where statut = 'a_venir'
    and deleted_at is null
    and date_echeance < current_date;
$$;

revoke execute on function public.materialize_overdue_expenses() from public, authenticated, anon;
grant execute on function public.materialize_overdue_expenses() to service_role;

select cron.schedule(
  'materialize-overdue-expenses-daily',
  '30 3 * * *',
  $$select public.materialize_overdue_expenses();$$
);
