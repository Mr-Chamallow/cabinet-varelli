-- Pastilles de notification : dernière visite par section (ex. plaintes)
create table if not exists cabinet_vus (
  discord_id text not null,
  section text not null,
  vu_at timestamptz not null default now(),
  primary key (discord_id, section)
);
alter table cabinet_vus enable row level security;

-- Résultat d'un vote : adopte, rejete (majorité atteinte) ou clos (fermé sans majorité)
alter table cabinet_votes add column if not exists resultat text;
