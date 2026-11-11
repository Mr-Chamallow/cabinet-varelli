-- Messages avec fichier joint (facture PDF envoyée automatiquement dans le dossier)
alter table cabinet_messages add column if not exists fichier_url text;
alter table cabinet_messages add column if not exists fichier_nom text;
