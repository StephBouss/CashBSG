-- C1.1 — Protège les colonnes de privilèges de `profiles`.
--
-- Problème : la seule policy sur `profiles` ("profiles_owner", 0001_init.sql)
-- est `for all using/with check (auth.uid() = id)`, sans restriction de
-- colonnes. Les colonnes is_admin (0007), plan (0009) et plan_expires_at
-- (0013) ont été ajoutées ensuite sans jamais retoucher cette policy : un
-- utilisateur authentifié peut donc s'auto-promouvoir admin ou passer en
-- plan payant via un simple `update profiles set is_admin=true, ...`.
--
-- Solution : un trigger BEFORE UPDATE qui restaure ces trois colonnes à leur
-- ancienne valeur sauf si l'appelant est `service_role` (dashboard Supabase
-- via connexion postgres directe, ou une future Edge Function service_role).
-- Le nom/devise/thème/pays/whatsapp restent librement modifiables par le
-- propriétaire du profil.
--
-- Rollback :
--   drop trigger if exists trg_protect_profile_privileges on public.profiles;
--   drop function if exists public.protect_profile_privileges();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_admin        := old.is_admin;
    new.plan            := old.plan;
    new.plan_expires_at := old.plan_expires_at;
  end if;
  return new;
end;
$$;

create trigger trg_protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();
