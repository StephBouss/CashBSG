-- C2.5 — Fiabiliser les soldes d'épargne.
--
-- Constat : `savings_accounts` ne stocke aucun solde (SavingsAccountCard le
-- recalcule à chaque rendu depuis `savings_movements`) — rien à fiabiliser
-- là. En revanche `goals.montant_epargne` EST stocké, et `addGoalContribution`
-- (src/hooks/useGoals.ts) l'incrémentait par un lire-puis-écrire côté client
-- (`goal.montantEpargne + amount`) : deux clics rapprochés, deux onglets, ou
-- un cache React Query pas encore invalidé perdent silencieusement une
-- contribution (dernier écrivain gagne sur une valeur déjà obsolète).
--
-- Fonction RPC qui incrémente en une seule instruction SQL, atomique côté
-- serveur. RLS ("goals_owner", for all) s'applique normalement puisque la
-- fonction tourne en security invoker (par défaut) : pas besoin de
-- revérifier auth.uid() à la main.
--
-- Rollback :
--   drop function if exists public.increment_goal_epargne(uuid, numeric);

create or replace function public.increment_goal_epargne(p_goal_id uuid, p_amount numeric)
returns public.goals
language plpgsql
as $$
declare
  result public.goals;
begin
  update public.goals
  set montant_epargne = montant_epargne + p_amount
  where id = p_goal_id
  returning * into result;

  if result.id is null then
    raise exception 'Objectif introuvable ou accès refusé.';
  end if;

  return result;
end;
$$;

grant execute on function public.increment_goal_epargne(uuid, numeric) to authenticated;
