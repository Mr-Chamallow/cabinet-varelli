-- Organigramme : photo, barreau, numéro, année d'inscription, spécialités
alter table cabinet_membres
  add column if not exists photo_url text,
  add column if not exists barreau text,
  add column if not exists numero_barreau text,
  add column if not exists annee_inscription text,
  add column if not exists specialites text;

-- Avis clients (publiés après validation du cabinet)
create table if not exists cabinet_avis (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text,
  auteur_nom text not null,
  note int not null check (note between 1 and 5),
  contenu text not null,
  statut text not null default 'en_attente',
  created_at timestamptz not null default now()
);
alter table cabinet_avis enable row level security;
