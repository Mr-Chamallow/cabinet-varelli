-- Fusion compta / stocks / actions illégales / arrestations

-- 1) La compta sait d'où vient chaque ligne (pour pouvoir l'annuler proprement)
alter table obsidian_comptabilite add column if not exists source text;
alter table obsidian_comptabilite add column if not exists source_id uuid;
create index if not exists idx_compta_source on obsidian_comptabilite(source, source_id);

-- 2) Arrestations (écriture uniquement via les routes admin/serveur)
create table if not exists arrestations (
  id uuid primary key default gen_random_uuid(),
  membre text not null,
  amende numeric not null default 0,          -- N'EST PAS déduite du solde
  argent_perdu numeric not null default 0,    -- déduit du solde (dépense)
  type_argent text not null default 'sale',
  items jsonb not null default '[]'::jsonb,   -- [{stock_id, nom, emoji, categorie, unite, quantite, retire}]
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_arrestations_at on arrestations(created_at desc);
create index if not exists idx_arrestations_membre on arrestations(membre);
alter table arrestations enable row level security;
drop policy if exists "arrestations_select" on arrestations;
create policy "arrestations_select" on arrestations for select using (true);

do $$ begin
  alter publication supabase_realtime add table arrestations;
exception when duplicate_object then null; when undefined_object then null;
end $$;
