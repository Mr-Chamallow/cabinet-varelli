-- Corrige l'erreur « Could not find the signatures column of cabinet_devis » (relançable sans risque)
alter table cabinet_devis add column if not exists signatures jsonb not null default '[]'::jsonb;
