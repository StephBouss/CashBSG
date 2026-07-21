-- Budget+ — la dîme est désormais désactivée par défaut ; l'utilisateur l'active/désactive lui-même

alter table profiles add column dime_active boolean not null default false;
