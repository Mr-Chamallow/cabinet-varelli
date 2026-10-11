-- Lot 36 : recrutement (vote des membres, lien Gdoc, histoire du personnage)
-- A lancer dans Supabase > SQL Editor (apres push + deploiement). Peut etre relance sans risque.

-- 1) Histoire du personnage (remplace "notes") + lien du Gdoc
alter table obsidian_recrutement add column if not exists histoire text;
alter table obsidian_recrutement add column if not exists gdoc_url text;
do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'obsidian_recrutement' and column_name = 'notes') then
    update obsidian_recrutement set histoire = coalesce(histoire, notes) where notes is not null;
    alter table obsidian_recrutement drop column notes;
  end if;
end $$;

-- 2) Votes des membres (1 vote par membre et par fiche, modifiable)
create table if not exists obsidian_recrutement_votes (
  id uuid primary key default gen_random_uuid(),
  recrutement_id uuid not null references obsidian_recrutement(id) on delete cascade,
  voter_id text not null,
  voter_nom text not null default '',
  vote text not null check (vote in ('approuve', 'refuse')),
  created_at timestamptz not null default now(),
  unique (recrutement_id, voter_id)
);
alter table obsidian_recrutement_votes enable row level security;
drop policy if exists obsidian_recrutement_votes_select on obsidian_recrutement_votes;
create policy obsidian_recrutement_votes_select on obsidian_recrutement_votes for select using (true);
do $$ begin
  alter publication supabase_realtime add table obsidian_recrutement_votes;
exception when duplicate_object then null; when undefined_object then null;
end $$;
