create table if not exists obsidian_boards (
  id uuid primary key default gen_random_uuid(),
  nom text not null default 'Tableau',
  created_by text,
  created_at timestamptz default now()
);
alter table obsidian_board add column if not exists board_id uuid references obsidian_boards(id) on delete cascade;
do $$ declare c record; begin
  for c in select conname from pg_constraint where conrelid='obsidian_board'::regclass and contype='c' and pg_get_constraintdef(oid) ilike '%kind%' loop
    execute format('alter table obsidian_board drop constraint %I', c.conname);
  end loop;
end $$;
alter table obsidian_board add constraint obsidian_board_kind_check check (kind in ('fiche','vehicule','note','dossier','pacte'));
create table if not exists obsidian_board_links (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references obsidian_boards(id) on delete cascade,
  a uuid not null references obsidian_board(id) on delete cascade,
  b uuid not null references obsidian_board(id) on delete cascade,
  type text not null default 'contact',
  label text,
  created_by text,
  created_at timestamptz default now()
);
alter table obsidian_boards enable row level security;
alter table obsidian_board_links enable row level security;
drop policy if exists boards_sel on obsidian_boards;
create policy boards_sel on obsidian_boards for select using (true);
drop policy if exists blinks_sel on obsidian_board_links;
create policy blinks_sel on obsidian_board_links for select using (true);
