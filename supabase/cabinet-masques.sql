-- Dossiers archivés retirés de la liste d'un utilisateur (suppression uniquement pour soi)
create table if not exists cabinet_dossier_masques (
  dossier_id uuid not null references cabinet_dossiers(id) on delete cascade,
  discord_id text not null,
  created_at timestamptz not null default now(),
  primary key (dossier_id, discord_id)
);
alter table cabinet_dossier_masques enable row level security;
