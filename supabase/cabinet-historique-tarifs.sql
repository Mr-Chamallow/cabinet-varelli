-- Historique des changements de prix des tarifs
create table if not exists cabinet_tarifs_historique (
  id uuid primary key default gen_random_uuid(),
  tarif_id uuid,
  nom text,
  ancien_prix text,
  nouveau_prix text,
  auteur_nom text,
  created_at timestamptz not null default now()
);
alter table cabinet_tarifs_historique enable row level security;
