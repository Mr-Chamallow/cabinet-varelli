-- TEMPS RÉEL DU CABINET (sans exposer les données)
-- La base note chaque modification dans cabinet_signal (nom de la table + heure). Aucune donnée sensible.

create table if not exists cabinet_signal (
  table_name text primary key,
  updated_at timestamptz not null default now()
);
alter table cabinet_signal enable row level security;
drop policy if exists "signal lecture" on cabinet_signal;
create policy "signal lecture" on cabinet_signal for select to anon, authenticated using (true);

create or replace function cabinet_signal_notifie() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into cabinet_signal (table_name, updated_at) values (TG_TABLE_NAME, now())
  on conflict (table_name) do update set updated_at = excluded.updated_at;
  return null;
end $$;

-- Un déclencheur par table suivie (relançable sans risque)
do $$
declare t text;
begin
  foreach t in array array[
    'cabinet_rdv', 'cabinet_comparutions', 'cabinet_factures', 'cabinet_devis',
    'cabinet_dossiers', 'cabinet_dossier_types', 'cabinet_factures_gouvernement',
    'cabinet_avocat_grades', 'cabinet_grades', 'cabinet_tarifs'
  ] loop
    execute format('drop trigger if exists %I_signal on %I', t, t);
    execute format('create trigger %I_signal after insert or update or delete on %I for each statement execute function cabinet_signal_notifie()', t, t);
  end loop;
end $$;

-- Diffusion temps réel : seule la table de signal est publiée
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cabinet_signal') then
    alter publication supabase_realtime add table cabinet_signal;
  end if;
end $$;
