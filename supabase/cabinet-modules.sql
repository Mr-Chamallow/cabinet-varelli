-- Cabinet Varelli & Associés : tarifs, présentation, organigramme, RDV, dossiers, messagerie
-- À coller UNE FOIS dans Supabase > SQL Editor > Run

create table if not exists cabinet_tarifs (
  id uuid primary key default gen_random_uuid(),
  categorie text not null default 'Général',
  nom text not null,
  prix text,
  description text,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists cabinet_pages (
  cle text primary key,
  contenu text,
  updated_at timestamptz default now()
);

create table if not exists cabinet_membres (
  id uuid primary key default gen_random_uuid(),
  nom_rp text not null,
  poste text,
  description text,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists cabinet_rdv (
  id uuid primary key default gen_random_uuid(),
  discord_id text,
  client_nom text,
  motif text,
  date_rdv timestamp without time zone not null,
  statut text not null default 'demande',
  created_at timestamptz default now()
);

create table if not exists cabinet_dossier_types (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  template text,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists cabinet_dossiers (
  id uuid primary key default gen_random_uuid(),
  type_id uuid references cabinet_dossier_types(id) on delete set null,
  titre text not null,
  client_discord_id text not null,
  client_nom text,
  statut text not null default 'ouvert',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cabinet_messages (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references cabinet_dossiers(id) on delete cascade,
  auteur_discord_id text,
  auteur_nom text,
  est_staff boolean default false,
  contenu text,
  image_url text,
  created_at timestamptz default now()
);

-- Sécurité : accès uniquement via le serveur (clé service role)
alter table cabinet_tarifs enable row level security;
alter table cabinet_pages enable row level security;
alter table cabinet_membres enable row level security;
alter table cabinet_rdv enable row level security;
alter table cabinet_dossier_types enable row level security;
alter table cabinet_dossiers enable row level security;
alter table cabinet_messages enable row level security;

-- Stockage des images de la messagerie (bucket public en lecture)
insert into storage.buckets (id, name, public) values ('cabinet', 'cabinet', true)
on conflict (id) do update set public = true;

-- Page de présentation par défaut
insert into cabinet_pages (cle, contenu) values ('presentation', 'Cabinet Varelli & Associés.')
on conflict (cle) do nothing;
