-- Journal d'activité : qui a fait quoi et quand (visible par la direction)
create table if not exists cabinet_journal (
  id uuid primary key default gen_random_uuid(),
  auteur_nom text,
  action text not null,
  cible text,
  details text,
  created_at timestamptz not null default now()
);
alter table cabinet_journal enable row level security;
