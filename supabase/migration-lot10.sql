-- LOT 10 : genre des employés (Directeur/Directrice, Agent/Agente...)
alter table obsidian_employes add column if not exists genre text default 'm';
-- Les membres fictifs féminins (adapte si besoin) :
update obsidian_employes set genre = 'f' where nom in ('Elena Moretti', 'Camille Roux');
alter table obsidian_fiches add column if not exists deleted_at timestamptz;
alter table obsidian_fiches add column if not exists surveille boolean default false;
alter table obsidian_fiches add column if not exists apparitions jsonb default '[]'::jsonb;
