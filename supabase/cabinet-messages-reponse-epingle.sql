-- Répondre à un message + message épinglé (salons, bureaux et dossiers). Relançable sans risque.
alter table cabinet_internes add column if not exists reponse_a uuid references cabinet_internes(id) on delete set null;
alter table cabinet_internes add column if not exists epingle boolean not null default false;
alter table cabinet_messages add column if not exists reponse_a uuid references cabinet_messages(id) on delete set null;
alter table cabinet_messages add column if not exists epingle boolean not null default false;
