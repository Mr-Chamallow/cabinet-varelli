-- Pièces jointes dans le salon interne (même principe que cabinet_messages)
alter table cabinet_internes add column if not exists fichier_url text;
alter table cabinet_internes add column if not exists fichier_nom text;
