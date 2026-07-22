-- Budget+ — suppression du système intégré d'activation de la dîme.
-- La dîme est désormais une épargne libre créée par l'utilisateur (nom "Dîme"),
-- avec son propre pourcentage/montant, comptée comme une dépense dans le solde.

drop table if exists tithes;
alter table profiles drop column if exists dime_active;
alter table profiles drop column if exists pourcentage_dime;
