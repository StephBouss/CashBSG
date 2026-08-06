-- C2.5 — Le solde d'un compte d'épargne n'est pas stocké : il est recalculé
-- côté client en sommant tous les mouvements renvoyés par la requête. Or la
-- policy SELECT sur savings_movements (C1.2) limite l'historique visible à
-- 2 mois glissants pour les comptes gratuits (has_paid_plan()) — un compte
-- Free avec des mouvements plus anciens affiche donc un solde inférieur au
-- solde réel, silencieusement.
--
-- Le total est une donnée d'exactitude (pas une fonctionnalité premium à
-- restreindre), contrairement à la consultation détaillée de l'historique :
-- cette fonction calcule la somme de TOUS les mouvements du compte, sans la
-- limite de fenêtre par plan, mais toujours strictement scopée au
-- propriétaire (auth.uid()).
--
-- Rollback :
--   drop function if exists public.savings_account_balance(uuid);

create or replace function public.savings_account_balance(p_account_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(montant), 0)
  from public.savings_movements
  where account_id = p_account_id
    and user_id = auth.uid()
    and deleted_at is null;
$$;

revoke all on function public.savings_account_balance(uuid) from public, authenticated, anon;
grant execute on function public.savings_account_balance(uuid) to authenticated;
