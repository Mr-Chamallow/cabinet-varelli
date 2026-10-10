-- Lot 1 : journal d'audit (actions sensibles) + tâches de capture liées aux dossiers du Tribunal. À exécuter une fois.
create table if not exists journal_audit (
  id uuid primary key default gen_random_uuid(),
  acteur text not null, action text not null, cible text, detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_journal_audit_at on journal_audit(created_at desc);
alter table journal_audit enable row level security;  -- aucune policy : lisible uniquement via le serveur (route admin)

alter table gm_evenements add column if not exists dossier_id uuid;
