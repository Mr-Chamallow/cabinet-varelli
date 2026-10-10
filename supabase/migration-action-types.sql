-- Types d'actions illégales configurables depuis Admin > 🕶️ Actions
create table if not exists actions_illegales_types (
  nom text primary key,
  icon text not null default '🕶️',
  delai_minutes integer not null default 0, -- 0 = sans délai
  ordre integer not null default 0,
  actif boolean not null default true
);
alter table actions_illegales_types enable row level security;
drop policy if exists "action_types_select" on actions_illegales_types;
create policy "action_types_select" on actions_illegales_types for select using (true);
-- Pas de policy d'écriture : seules les routes admin (clé service_role) peuvent modifier.

insert into actions_illegales_types (nom, icon, delai_minutes, ordre) values
  ('Vente de drogue','💊',0,1),
  ('Go fast','🏎️',1440,2),
  ('LTD','🏪',0,3),
  ('ATM','🏧',0,4),
  ('Cambriolage','🏚️',0,5),
  ('Human Labs','🧪',0,6),
  ('Pacific Bank','🏦',0,7)
on conflict (nom) do nothing;

do $$ begin
  alter publication supabase_realtime add table actions_illegales_types;
exception when duplicate_object then null; when undefined_object then null;
end $$;
