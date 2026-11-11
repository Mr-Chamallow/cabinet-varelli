-- Comptabilité complète : numérotation, lignes, TVA, dossier lié, historique des factures
alter table cabinet_factures add column if not exists numero text;
alter table cabinet_factures add column if not exists dossier_id uuid references cabinet_dossiers(id) on delete set null;
alter table cabinet_factures add column if not exists lignes jsonb not null default '[]'::jsonb;
alter table cabinet_factures add column if not exists sous_total numeric not null default 0;
alter table cabinet_factures add column if not exists tva_taux numeric not null default 0;
alter table cabinet_factures add column if not exists note text;
alter table cabinet_factures add column if not exists cree_par text;
alter table cabinet_factures add column if not exists payee_at timestamptz;
create unique index if not exists cabinet_factures_numero_key on cabinet_factures(numero);

create table if not exists cabinet_factures_historique (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references cabinet_factures(id) on delete cascade,
  action text not null,
  details text,
  auteur_nom text,
  created_at timestamptz not null default now()
);
alter table cabinet_factures_historique enable row level security;
