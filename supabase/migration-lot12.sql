-- LOT 12
alter table obsidian_garage add column if not exists photo_url text;

-- Remise à zéro des stats Consortium (réputation, audits, pactes, tribunal, événements)
-- ⚠️ supprime ces données. Lance ensuite seed-demo.sql si tu veux des données de présentation.
delete from gm_reputation_log;
delete from gm_audits;
delete from gm_pactes;
delete from tribunal_dossiers;
delete from gm_evenements;
