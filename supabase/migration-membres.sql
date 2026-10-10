-- Renommer / virer membres et employés + liaison membres du site <-> employés. À exécuter une fois.
alter table site_logins add column if not exists nom_perso text;
alter table site_logins add column if not exists employe_exclu boolean not null default false;
alter table obsidian_employes add column if not exists discord_id text;
create index if not exists idx_employes_discord on obsidian_employes(discord_id);
