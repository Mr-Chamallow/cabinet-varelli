-- Consortium : organisations, réputation, tribunal, pactes, audits, événements GM. À exécuter une fois.
create table if not exists gm_organisations (
  nom text primary key, categorie text not null default 'Autre', notes text, created_at timestamptz not null default now()
);
create table if not exists gm_reputation_log (
  id uuid primary key default gen_random_uuid(), organisation text not null, delta int not null, motif text,
  source text, source_id uuid, created_by text, created_at timestamptz not null default now()
);
create index if not exists idx_gm_rep_org on gm_reputation_log(organisation);
create index if not exists idx_gm_rep_src on gm_reputation_log(source, source_id);

create table if not exists tribunal_dossiers (
  id uuid primary key default gen_random_uuid(), titre text not null, accuse text, organisation text,
  statut text not null default 'instruction',           -- instruction | accusation | defense | verdict | clos
  juge text, procureur text, avocat text, date_audience timestamptz,
  acte_accusation text, defense text, preuves jsonb not null default '[]'::jsonb,
  verdict text not null default 'en_cours',              -- en_cours | coupable | innocent
  sentence text, created_by text, created_at timestamptz not null default now()
);
create table if not exists gm_pactes (
  id uuid primary key default gen_random_uuid(), organisation text not null, statut text not null default 'actif', -- actif | suspendu | rompu | expire
  date_signature date, date_fin date, signataire text, clauses text, violations jsonb not null default '[]'::jsonb,
  created_by text, created_at timestamptz not null default now()
);
create table if not exists gm_audits (
  id uuid primary key default gen_random_uuid(), organisation text not null, note int not null default 5, appreciation text,
  sanction text, sanction_fin timestamptz, sanction_alerte boolean not null default false, notes text,
  created_by text, created_at timestamptz not null default now()
);
create table if not exists gm_evenements (
  id uuid primary key default gen_random_uuid(), type text not null,   -- convoi | enchere | alerte
  titre text not null, statut text not null, partenaire text, date_event timestamptz, montant numeric not null default 0,
  lots jsonb not null default '[]'::jsonb, notes text, created_by text, created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['gm_organisations','gm_reputation_log','tribunal_dossiers','gm_pactes','gm_audits','gm_evenements'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('create policy %I on %I for select using (true)', t || '_select', t);
    begin execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; when undefined_object then null; end;
  end loop;
end $$;
