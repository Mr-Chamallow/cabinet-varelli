-- Lot 35 : mise en conformite FlashBackFA (organisation)
-- A lancer dans Supabase > SQL Editor (apres push + deploiement).

-- 1) Actions illegales : portee (par personne OU pour tout le groupe) + 2 nouvelles actions
alter table actions_illegales_types add column if not exists portee text not null default 'personne';
insert into actions_illegales_types (nom, icon, delai_minutes, ordre, portee) values
  ('Plateforme pétrolière', '🛢️', 10080, 8, 'groupe'),
  ('Pêche du chat', '🎣', 1440, 9, 'personne')
on conflict (nom) do nothing;

-- 2) Reglages de conformite (modifiables dans la page Reglement)
alter table obsidian_settings add column if not exists effectif_max integer default 20;
alter table obsidian_settings add column if not exists kevlar_max integer default 5;
alter table obsidian_settings add column if not exists drogues_produites text[] default array['Cocaïne','Tranq','Mexicana'];
alter table obsidian_settings add column if not exists drogues_revendiquees text[] default array['Cocaïne','Mexicana'];
update obsidian_settings set
  effectif_max = coalesce(effectif_max, 20),
  kevlar_max = coalesce(kevlar_max, 5),
  drogues_produites = coalesce(drogues_produites, array['Cocaïne','Tranq','Mexicana']),
  drogues_revendiquees = coalesce(drogues_revendiquees, array['Cocaïne','Mexicana'])
where id = 'default';

-- 3) Garage : usage du vehicule (pour les alertes transaction / labo)
alter table obsidian_garage add column if not exists usage text default 'Standard';

-- 4) Taxes (accords avec un groupe) + paiements
create table if not exists obsidian_taxes (
  id uuid primary key default gen_random_uuid(),
  groupe text not null,
  groupe_id uuid references carte_gangs(id) on delete set null,
  raison text not null default '',
  type text not null default 'vente',            -- vente | recolte | autre
  taux_pct numeric,                              -- % du prix de revente (optionnel)
  montant numeric not null default 0,            -- prix paye par periode
  periodicite_jours integer not null default 7,
  date_debut date not null default current_date,
  duree_jours integer not null default 30,
  type_argent text not null default 'propre',
  statut text not null default 'actif',          -- actif | termine | suspendu
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);
create table if not exists obsidian_taxes_paiements (
  id uuid primary key default gen_random_uuid(),
  taxe_id uuid not null references obsidian_taxes(id) on delete cascade,
  montant numeric not null default 0,
  type_argent text not null default 'propre',
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

-- 5) Fiches de recrutement
create table if not exists obsidian_recrutement (
  id uuid primary key default gen_random_uuid(),
  nom_rp text not null,
  age_ok boolean not null default false,
  discord text,
  discord_id text,
  unique_id text,
  poste text,
  wipe_fait boolean not null default false,
  heures_jeu integer not null default 0,
  ancien_groupe text,
  date_depart_ancien date,
  sanctions_verifiees boolean not null default false,
  sanctions_notes text,
  statut text not null default 'candidat',       -- candidat | valide | refuse | dossier
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- 6) Suivi des guerres / GDT
create table if not exists obsidian_guerres (
  id uuid primary key default gen_random_uuid(),
  adversaire text not null,
  groupe_id uuid references carte_gangs(id) on delete set null,
  type text not null default 'GDT',              -- GDT | Guerre ouverte | Conflit
  enjeu text,
  date_debut date not null default current_date,
  date_fin date,
  statut text not null default 'en_cours',       -- en_cours | terminee
  issue text,                                    -- victoire | defaite | reddition | nulle
  perte text,                                    -- aucune | zone | business
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- 7) Lecture seule via l'API publique, ecriture uniquement par le serveur (service_role)
do $$
declare t text;
begin
  foreach t in array array['obsidian_taxes','obsidian_taxes_paiements','obsidian_recrutement','obsidian_guerres'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('create policy %I on %I for select using (true)', t || '_select', t);
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception when duplicate_object then null; when undefined_object then null;
    end;
  end loop;
end $$;
