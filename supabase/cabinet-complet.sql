-- =====================================================================
-- Cabinet Varelli & Associés : TOUTE la base du cabinet, en une fois
-- À coller UNE FOIS dans Supabase > SQL Editor > Run.
-- Sans risque à relancer : tout est "if not exists" / "if exists".
-- =====================================================================

-- ---------- Tarifs, présentation, organigramme ----------
create table if not exists cabinet_tarifs (
  id uuid primary key default gen_random_uuid(),
  categorie text not null default 'Général',
  nom text not null,
  prix text,
  description text,
  ordre int default 0,
  created_at timestamptz default now()
);
alter table cabinet_tarifs add column if not exists prix_montant numeric;

create table if not exists cabinet_tarifs_historique (
  id uuid primary key default gen_random_uuid(),
  tarif_id uuid,
  nom text,
  ancien_prix text,
  nouveau_prix text,
  auteur_nom text,
  created_at timestamptz not null default now()
);

create table if not exists cabinet_pages (
  cle text primary key,
  contenu text,
  updated_at timestamptz default now()
);

create table if not exists cabinet_membres (
  id uuid primary key default gen_random_uuid(),
  nom_rp text not null,
  poste text,
  description text,
  ordre int default 0,
  created_at timestamptz default now()
);
alter table cabinet_membres
  add column if not exists photo_url text,
  add column if not exists barreau text,
  add column if not exists numero_barreau text,
  add column if not exists annee_inscription text,
  add column if not exists specialites text;

create table if not exists cabinet_avis (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text,
  auteur_nom text not null,
  note int not null check (note between 1 and 5),
  contenu text not null,
  statut text not null default 'en_attente',
  created_at timestamptz not null default now()
);

-- ---------- Types de dossiers, dossiers, accès, messagerie ----------
create table if not exists cabinet_dossier_types (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  template text,
  ordre int default 0,
  created_at timestamptz default now()
);

create table if not exists cabinet_dossiers (
  id uuid primary key default gen_random_uuid(),
  type_id uuid references cabinet_dossier_types(id) on delete set null,
  titre text not null,
  client_discord_id text not null,
  client_nom text,
  statut text not null default 'ouvert',
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table cabinet_dossiers add column if not exists prestation text;

create table if not exists cabinet_messages (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid references cabinet_dossiers(id) on delete cascade,
  auteur_discord_id text,
  auteur_nom text,
  est_staff boolean default false,
  contenu text,
  image_url text,
  fichier_url text,
  fichier_nom text,
  created_at timestamptz default now()
);

create table if not exists cabinet_dossier_acces (
  dossier_id uuid references cabinet_dossiers(id) on delete cascade,
  avocat_discord_id text not null,
  avocat_nom text,
  attribue_par text,
  created_at timestamptz default now(),
  primary key (dossier_id, avocat_discord_id)
);

create table if not exists cabinet_dossier_masques (
  dossier_id uuid not null references cabinet_dossiers(id) on delete cascade,
  discord_id text not null,
  created_at timestamptz not null default now(),
  primary key (dossier_id, discord_id)
);

create table if not exists cabinet_internes (
  id uuid primary key default gen_random_uuid(),
  canal text not null,
  auteur_discord_id text,
  auteur_nom text,
  contenu text,
  image_url text,
  fichier_url text,
  fichier_nom text,
  created_at timestamptz default now()
);
create index if not exists cabinet_internes_canal_idx on cabinet_internes (canal, created_at);

-- ---------- RDV ----------
create table if not exists cabinet_rdv (
  id uuid primary key default gen_random_uuid(),
  discord_id text,
  client_nom text,
  motif text,
  date_rdv timestamp without time zone not null,
  statut text not null default 'demande',
  created_at timestamptz default now()
);
alter table cabinet_rdv add column if not exists prestation text;
alter table cabinet_rdv add column if not exists avocat_discord_id text;
alter table cabinet_rdv add column if not exists avocat_nom text;
alter table cabinet_rdv add column if not exists aucune_preference boolean default false;
alter table cabinet_rdv add column if not exists updated_at timestamptz default now();

create table if not exists cabinet_rdv_candidats (
  rdv_id uuid references cabinet_rdv(id) on delete cascade,
  avocat_discord_id text not null,
  avocat_nom text,
  created_at timestamptz default now(),
  primary key (rdv_id, avocat_discord_id)
);

-- ---------- Facturation et comptabilité ----------
create table if not exists cabinet_factures (
  id uuid primary key default gen_random_uuid(),
  client_discord_id text not null,
  client_nom text,
  libelle text not null,
  montant numeric not null default 0,
  statut text not null default 'en_attente',
  date_echeance date,
  created_at timestamptz not null default now()
);
alter table cabinet_factures
  add column if not exists numero text,
  add column if not exists dossier_id uuid references cabinet_dossiers(id) on delete set null,
  add column if not exists lignes jsonb not null default '[]'::jsonb,
  add column if not exists sous_total numeric not null default 0,
  add column if not exists tva_taux numeric not null default 0,
  add column if not exists note text,
  add column if not exists cree_par text,
  add column if not exists payee_at timestamptz,
  add column if not exists derniere_relance date;
create unique index if not exists cabinet_factures_numero_key on cabinet_factures(numero);

create table if not exists cabinet_factures_historique (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid not null references cabinet_factures(id) on delete cascade,
  action text not null,
  details text,
  auteur_nom text,
  created_at timestamptz not null default now()
);

create table if not exists cabinet_journal (
  id uuid primary key default gen_random_uuid(),
  auteur_nom text,
  action text not null,
  cible text,
  details text,
  created_at timestamptz not null default now()
);

-- ---------- Vie interne : plaintes, votes, pastilles ----------
create table if not exists cabinet_plaintes (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text not null,
  auteur_nom text,
  sujet text not null,
  statut text not null default 'ouvert',
  created_at timestamptz not null default now()
);

create table if not exists cabinet_votes (
  id uuid primary key default gen_random_uuid(),
  auteur_discord_id text not null,
  auteur_nom text,
  titre text not null,
  motif text,
  statut text not null default 'ouvert',
  resultat text,
  created_at timestamptz not null default now()
);

create table if not exists cabinet_votes_reponses (
  vote_id uuid not null references cabinet_votes(id) on delete cascade,
  voter_discord_id text not null,
  voter_nom text,
  choix text not null check (choix in ('pour', 'contre', 'abstention')),
  created_at timestamptz not null default now(),
  primary key (vote_id, voter_discord_id)
);

create table if not exists cabinet_vus (
  discord_id text not null,
  section text not null,
  vu_at timestamptz not null default now(),
  primary key (discord_id, section)
);

-- ---------- Sécurité : accès uniquement via le serveur (clé service role) ----------
alter table cabinet_tarifs enable row level security;
alter table cabinet_tarifs_historique enable row level security;
alter table cabinet_pages enable row level security;
alter table cabinet_membres enable row level security;
alter table cabinet_avis enable row level security;
alter table cabinet_dossier_types enable row level security;
alter table cabinet_dossiers enable row level security;
alter table cabinet_messages enable row level security;
alter table cabinet_dossier_acces enable row level security;
alter table cabinet_dossier_masques enable row level security;
alter table cabinet_internes enable row level security;
alter table cabinet_rdv enable row level security;
alter table cabinet_rdv_candidats enable row level security;
alter table cabinet_factures enable row level security;
alter table cabinet_factures_historique enable row level security;
alter table cabinet_journal enable row level security;
alter table cabinet_plaintes enable row level security;
alter table cabinet_votes enable row level security;
alter table cabinet_votes_reponses enable row level security;
alter table cabinet_vus enable row level security;

-- ---------- Stockage des fichiers de la messagerie (bucket public en lecture) ----------
insert into storage.buckets (id, name, public) values ('cabinet', 'cabinet', true)
on conflict (id) do update set public = true;

-- ---------- Page de présentation par défaut ----------
insert into cabinet_pages (cle, contenu) values ('presentation', 'Cabinet Varelli & Associés.')
on conflict (cle) do nothing;

-- Optionnel : efface les anciens messages de l'ancien salon direction (supprimé du site)
-- delete from cabinet_internes where canal = 'salon:direction';
