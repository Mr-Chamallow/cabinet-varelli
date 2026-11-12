-- Tarifs illustrés (image) + offres groupées. Relançable sans risque.
alter table cabinet_tarifs add column if not exists image_url text;
create table if not exists cabinet_offres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  image_url text,
  prix text,
  prix_montant integer,
  prestations text,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);
alter table cabinet_offres enable row level security;
