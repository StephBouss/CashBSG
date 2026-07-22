-- Budget+ — préférences d'apparence et de localisation
-- theme : identifiant du thème visuel choisi (voir src/hooks/useTheme.tsx)
-- pays : pays d'utilisation déclaré par l'utilisateur

alter table profiles add column if not exists theme text not null default 'vert-clair';
alter table profiles add column if not exists pays text;
