-- C2.3 — La devise est stockée sur le profil, pas sur chaque transaction. La
-- changer réinterprète tout l'historique sans conversion (un même montant
-- "1000" passerait silencieusement de FCFA à EUR). On bloque le changement
-- dès qu'au moins un revenu, une dépense ou un mouvement d'épargne existe.
-- Contrôle côté serveur (le formulaire seul ne protège rien) : le trigger de
-- garde existant (protect_profile_privileges) ne couvre pas devise, on en
-- ajoute un dédié.
--
-- Rollback :
--   drop trigger if exists trg_lock_devise_if_transactions on public.profiles;
--   drop function if exists public.lock_devise_if_transactions_exist();

create or replace function public.lock_devise_if_transactions_exist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.devise is distinct from old.devise then
    if exists (select 1 from public.incomes where user_id = new.id)
      or exists (select 1 from public.expenses where user_id = new.id)
      or exists (select 1 from public.savings_movements where user_id = new.id)
    then
      raise exception
        'Modification de devise impossible : des revenus, dépenses ou mouvements d''épargne existent déjà sur ce compte.';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_lock_devise_if_transactions
before update on public.profiles
for each row execute function public.lock_devise_if_transactions_exist();
