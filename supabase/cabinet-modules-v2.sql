-- Cabinet Varelli : version 2 (prestations, RDV validés, attribution des dossiers, messagerie interne)
-- À coller UNE FOIS dans Supabase > SQL Editor > Run (après la version 1)

alter table cabinet_rdv add column if not exists prestation text;
alter table cabinet_rdv add column if not exists avocat_discord_id text;
alter table cabinet_rdv add column if not exists avocat_nom text;
alter table cabinet_rdv add column if not exists aucune_preference boolean default false;
alter table cabinet_rdv add column if not exists updated_at timestamptz default now();

alter table cabinet_dossiers add column if not exists prestation text;

create table if not exists cabinet_rdv_candidats (
  rdv_id uuid references cabinet_rdv(id) on delete cascade,
  avocat_discord_id text not null,
  avocat_nom text,
  created_at timestamptz default now(),
  primary key (rdv_id, avocat_discord_id)
);

create table if not exists cabinet_dossier_acces (
  dossier_id uuid references cabinet_dossiers(id) on delete cascade,
  avocat_discord_id text not null,
  avocat_nom text,
  attribue_par text,
  created_at timestamptz default now(),
  primary key (dossier_id, avocat_discord_id)
);

create table if not exists cabinet_internes (
  id uuid primary key default gen_random_uuid(),
  canal text not null,
  auteur_discord_id text,
  auteur_nom text,
  contenu text,
  image_url text,
  created_at timestamptz default now()
);
create index if not exists cabinet_internes_canal_idx on cabinet_internes (canal, created_at);

alter table cabinet_rdv_candidats enable row level security;
alter table cabinet_dossier_acces enable row level security;
alter table cabinet_internes enable row level security;
