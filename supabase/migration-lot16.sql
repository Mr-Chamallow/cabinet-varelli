-- Lot 16 : tableau d'enquête sauvegardé (partagé entre tous les membres).
create table if not exists obsidian_board (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fiche','vehicule','note')),
  ref text,            -- id de la fiche / du véhicule (null pour une pièce libre)
  x int not null default 0,
  y int not null default 0,
  img text,            -- image d'une pièce libre
  created_by text,
  created_at timestamptz default now()
);
alter table obsidian_board enable row level security;
drop policy if exists "board_all" on obsidian_board;
create policy "board_all" on obsidian_board for all using (true) with check (true);
