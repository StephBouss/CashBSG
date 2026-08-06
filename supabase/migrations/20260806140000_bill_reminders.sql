-- P1.7 (PLAN_RESOLUTION_IWADU_CASH_CLAUDE_CODE.md) — Vrais rappels de
-- factures.
--
-- Constat : 0013_expiry_tokens_notifications.sql documente lui-même que les
-- notifications sont "générées côté client à la connexion (pas de tâche
-- planifiée serveur)" — et le seul type existant (useNotifications.ts) est
-- `plan_expiry` (échéance d'abonnement). Aucune notification n'est générée
-- pour une échéance de facture proche ou dépassée, alors que la landing
-- promet des rappels (lien P1.8).
--
-- Mécanisme : job pg_cron quotidien, symétrique à
-- generate_recurring_income_occurrences() (P1.6) et
-- materialize_overdue_expenses() (P0.6) déjà en place. Idempotent par
-- construction : dedupe_key = 'bill_upcoming_<expense_id>' /
-- 'bill_overdue_<expense_id>' — une seule notification de chaque type par
-- facture, jamais régénérée à la connexion ni par une deuxième exécution du
-- job (unique (user_id, dedupe_key) posée par 0013).
--
-- Fenêtres retenues (bornes fixes, pas un intervalle "depuis X jours") pour
-- qu'une notification ne soit créée qu'une fois, le jour exact où elle
-- devient pertinente :
--   - à venir  : date_echeance = aujourd'hui + 3 jours
--   - dépassée : date_echeance = aujourd'hui - 1 jour (premier jour de retard)
--
-- Fuseau horaire : la tâche tourne en UTC, une seule fois par jour (04h00
-- UTC, après materialize_overdue_expenses à 03h30 dont ce job dépend
-- implicitement pour la cohérence des statuts). Le marché cible actuel
-- (Afrique centrale, UTC+1, pas d'heure d'été) reste dans la même journée
-- calendaire à cette heure : un vrai support multi-fuseau nécessiterait une
-- colonne profiles.timezone dédiée — hors périmètre de cette correction,
-- signalé comme limite connue. La clé de dédoublonnage rend en tout état de
-- cause impossible une notification en double à la frontière de journée.
--
-- Rollback :
--   select cron.unschedule('generate-bill-reminders-daily');
--   drop function if exists public.generate_bill_reminders();

create or replace function public.generate_bill_reminders()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notifications (user_id, type, title, message, dedupe_key)
  select
    e.user_id,
    'bill_upcoming',
    'Échéance à venir : ' || e.nom,
    'Le paiement de ' || e.montant || ' pour "' || e.nom || '" est prévu le ' || to_char(e.date_echeance, 'DD/MM/YYYY') || '.',
    'bill_upcoming_' || e.id
  from public.expenses e
  where e.deleted_at is null
    and e.statut <> 'paye'
    and e.date_echeance = current_date + 3
  on conflict (user_id, dedupe_key) do nothing;

  insert into public.notifications (user_id, type, title, message, dedupe_key)
  select
    e.user_id,
    'bill_overdue',
    'Facture en retard : ' || e.nom,
    'Le paiement de ' || e.montant || ' pour "' || e.nom || '" était prévu le ' || to_char(e.date_echeance, 'DD/MM/YYYY') || ' et n''a pas été réglé.',
    'bill_overdue_' || e.id
  from public.expenses e
  where e.deleted_at is null
    and e.statut <> 'paye'
    and e.date_echeance = current_date - 1
  on conflict (user_id, dedupe_key) do nothing;
$$;

revoke execute on function public.generate_bill_reminders() from public, authenticated, anon;
grant execute on function public.generate_bill_reminders() to service_role;

select cron.schedule(
  'generate-bill-reminders-daily',
  '0 4 * * *',
  $$select public.generate_bill_reminders();$$
);
