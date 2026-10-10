-- Alertes Discord (délais, stock bas, rappel RDV) + fiches par métier. À exécuter une fois.
alter table actions_illegales add column if not exists delai_alerte boolean not null default false;
update actions_illegales set delai_alerte = true;  -- l'historique existant ne déclenche rien

alter table obsidian_stocks add column if not exists alerte_envoyee boolean not null default false;
update obsidian_stocks set alerte_envoyee = true where seuil_alerte > 0 and quantite <= seuil_alerte;

alter table obsidian_rdv add column if not exists rappel_envoye boolean not null default false;
update obsidian_rdv set rappel_envoye = true;

alter table obsidian_fiches add column if not exists metier text not null default 'civil';
alter table obsidian_fiches add column if not exists sous_tags text[] not null default '{}';
