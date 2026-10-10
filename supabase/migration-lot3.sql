-- Lot 3 : plan d'événement (checklist). À exécuter une fois.
alter table gm_evenements add column if not exists checklist jsonb not null default '[]'::jsonb;
