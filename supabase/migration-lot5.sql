-- Lot 5 : lien Fiches <-> Base de données. À exécuter une fois (après migration-lot4.sql).
alter table obsidian_fiches add column if not exists personne_id uuid;
alter table bdd_personnes   add column if not exists fiche_id uuid;
create index if not exists idx_fiches_personne on obsidian_fiches(personne_id);
create index if not exists idx_bdd_fiche on bdd_personnes(fiche_id);
