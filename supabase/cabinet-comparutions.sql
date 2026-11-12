-- Comparutions immédiates : suivi séparé de la compta client (payées par le gouvernement).
-- Relançable sans risque : crée la table si elle n'existe pas.
create table if not exists cabinet_comparutions (
  id uuid primary key default gen_random_uuid(),
  date_audience date not null,
  heure text,
  tribunal text,
  client_nom text not null,
  chefs text,
  juge_proc text,
  matricules_officiers text,
  avocat_discord_id text,
  avocat_nom text,
  statut text not null default 'en_attente' check (statut in ('prise_en_charge', 'en_attente', 'refusee')),
  montant integer not null default 0,
  rdv_id uuid references cabinet_rdv(id) on delete set null,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);
alter table cabinet_comparutions enable row level security;

-- Grades et pourcentage de salaire par représentation (comparution immédiate)
create table if not exists cabinet_grades (
  id uuid primary key default gen_random_uuid(),
  grade text not null unique,
  taux_pct numeric not null default 0,
  ordre integer not null default 0
);
alter table cabinet_grades enable row level security;

create table if not exists cabinet_avocat_grades (
  id uuid primary key default gen_random_uuid(),
  avocat_discord_id text not null unique,
  avocat_nom text,
  grade text
);
alter table cabinet_avocat_grades enable row level security;

-- Le taux et la part de l'avocat sont figés au moment de la saisie (l'historique ne bouge pas si le grade change)
alter table cabinet_comparutions add column if not exists taux_pct numeric not null default 0;
alter table cabinet_comparutions add column if not exists part_avocat integer not null default 0;
