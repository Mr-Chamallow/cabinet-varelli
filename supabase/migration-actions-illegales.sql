-- Journal des actions illégales (gains / pertes + délais par personne)
create table if not exists actions_illegales (
  id uuid primary key default gen_random_uuid(),
  membre text not null,
  action text not null,
  montant numeric not null default 0, -- positif = gain, négatif = perte
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_actions_illegales_at on actions_illegales(created_at desc);
create index if not exists idx_actions_illegales_membre_action on actions_illegales(membre, action, created_at desc);

alter table actions_illegales enable row level security;
drop policy if exists "actions_illegales_select" on actions_illegales;
create policy "actions_illegales_select" on actions_illegales for select using (true);
drop policy if exists "actions_illegales_insert" on actions_illegales;
create policy "actions_illegales_insert" on actions_illegales for insert with check (true);
drop policy if exists "actions_illegales_update" on actions_illegales;
create policy "actions_illegales_update" on actions_illegales for update using (true);
drop policy if exists "actions_illegales_delete" on actions_illegales;
create policy "actions_illegales_delete" on actions_illegales for delete using (true);

-- Temps réel (mise à jour instantanée entre membres)
do $$ begin
  alter publication supabase_realtime add table actions_illegales;
exception when duplicate_object then null; when undefined_object then null;
end $$;
