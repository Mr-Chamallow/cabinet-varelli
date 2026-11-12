-- Postes libres, promotions et candidatures. Relançable sans risque.
create table if not exists cabinet_postes (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  description text,
  role_acces text,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);
alter table cabinet_postes enable row level security;

alter table cabinet_membres add column if not exists poste_id uuid references cabinet_postes(id) on delete set null;
alter table cabinet_membres add column if not exists discord_id text;

create table if not exists cabinet_promotions (
  id uuid primary key default gen_random_uuid(),
  membre_id uuid references cabinet_membres(id) on delete set null,
  nom_rp text,
  ancien_poste text,
  nouveau_poste text,
  ancien_role text,
  nouveau_role text,
  motif text,
  auteur_nom text,
  created_at timestamptz not null default now()
);
alter table cabinet_promotions enable row level security;

create table if not exists cabinet_candidatures (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  discord_name text,
  nom text not null,
  telephone text,
  email text,
  poste_id uuid references cabinet_postes(id) on delete set null,
  poste_nom text,
  experience text,
  motivation text,
  disponibilite text,
  statut text not null default 'recue' check (statut in ('recue','entretien','acceptee','refusee','retiree')),
  entretien_at timestamptz,
  notes text,
  decide_par text,
  decide_at timestamptz,
  created_at timestamptz not null default now()
);
alter table cabinet_candidatures enable row level security;
