-- LOT 11
alter table obsidian_employes add column if not exists rib text;
alter table obsidian_employes add column if not exists histoire_url text;

-- Code pénal : Vénia (drogue)
do $$ begin
  if to_regclass('public.obsidian_drogues') is not null then
    insert into obsidian_drogues (nom, emoji, prix_min, prix_max, semaines_revend, ordre) select 'Vénia', '💊', 0, 0, 0, coalesce((select max(ordre) from obsidian_drogues),0)+1 where not exists (select 1 from obsidian_drogues where lower(nom) in ('vénia','venia'));
  end if;
exception when others then null; end $$;

-- Personnes recherchées : numéro de dossier unique + journal d'activité
alter table obsidian_fiches add column if not exists dossier_no text;
create table if not exists obsidian_journal (
  id uuid primary key default gen_random_uuid(),
  fiche_id uuid,
  fiche_nom text,
  action text not null,
  detail text,
  par text,
  created_at timestamptz default now()
);
alter table obsidian_journal enable row level security;
drop policy if exists "journal_all" on obsidian_journal;
create policy "journal_all" on obsidian_journal for all using (true) with check (true);
