-- Factures hebdomadaires au gouvernement (comparutions immédiates). Relançable sans risque.
create table if not exists cabinet_factures_gouvernement (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  semaine date not null,
  nb_comparutions integer not null default 0,
  total numeric not null default 0,
  statut text not null default 'emise' check (statut in ('emise', 'payee')),
  payee_at timestamptz,
  detail jsonb not null default '[]'::jsonb,
  cree_par text,
  created_at timestamptz not null default now()
);
alter table cabinet_factures_gouvernement enable row level security;

alter table cabinet_comparutions add column if not exists facture_gouv_id uuid references cabinet_factures_gouvernement(id) on delete set null;
