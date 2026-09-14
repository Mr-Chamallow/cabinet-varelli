create extension if not exists "pgcrypto";

create table if not exists carte_points (
  id uuid primary key default gen_random_uuid(),
  -- x, y = coordonnÃ©es rÃ©elles du jeu GTA (mÃªmes valeurs que /coords ou le F8 en jeu)
  x numeric not null,
  y numeric not null,
  category text not null default 'autre',
  title text not null,
  icon_url text,
  created_at timestamptz not null default now()
);

create table if not exists carte_dossiers (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references carte_points(id) on delete cascade,
  description text default '',
  tags text[] default '{}',
  pieces jsonb default '[]',
  updated_at timestamptz not null default now()
);

alter table carte_points enable row level security;
alter table carte_dossiers enable row level security;

-- Politiques permissives par dÃ©faut : Ã  resserrer selon ton auth Discord OAuth
create policy "lecture_ecriture_libre_points" on carte_points
  for all using (true) with check (true);

create policy "lecture_ecriture_libre_dossiers" on carte_dossiers
  for all using (true) with check (true);
