-- Plaintes internes (visibles par la direction et l'auteur uniquement)
create table if not exists cabinet_plaintes (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text not null,
  auteur_nom text,
  sujet text not null,
  statut text not null default 'ouvert',
  created_at timestamptz not null default now()
);
alter table cabinet_plaintes enable row level security;

-- Votes internes (proposition + motif libre)
create table if not exists cabinet_votes (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text not null,
  auteur_nom text,
  titre text not null,
  motif text,
  statut text not null default 'ouvert',
  created_at timestamptz not null default now()
);
alter table cabinet_votes enable row level security;

-- Une seule réponse par employé et par vote
create table if not exists cabinet_votes_reponses (
  vote_id uuid not null references cabinet_votes(id) on delete cascade,
  voter_discord_id text not null,
  voter_nom text,
  choix text not null check (choix in ('pour', 'contre', 'abstention')),
  created_at timestamptz not null default now(),
  primary key (vote_id, voter_discord_id)
);
alter table cabinet_votes_reponses enable row level security;
