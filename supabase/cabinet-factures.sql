-- Facturation : factures par client, visibles par le client dans Mon espace
create table if not exists cabinet_factures (
  id uuid primary key default gen_random_uuid(),
  client_discord_id text not null,
  client_nom text,
  libelle text not null,
  montant numeric not null default 0,
  statut text not null default 'en_attente',
  date_echeance date,
  created_at timestamptz not null default now()
);
alter table cabinet_factures enable row level security;
