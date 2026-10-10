-- Présence en ligne (heartbeat) sur la table existante site_logins
alter table site_logins add column if not exists last_seen timestamptz;

-- Journal des connexions / déconnexions (historique brut, séparé du "dernier login")
create table if not exists site_session_log (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  discord_name text,
  event text not null, -- 'connect' | 'disconnect'
  created_at timestamptz not null default now()
);
alter table site_session_log enable row level security;
drop policy if exists "site_session_log_select" on site_session_log;
create policy "site_session_log_select" on site_session_log for select using (true);
drop policy if exists "site_session_log_insert" on site_session_log;
create policy "site_session_log_insert" on site_session_log for insert with check (true);
create index if not exists idx_site_session_log_at on site_session_log(created_at desc);

-- Bannissements du site. Lecture publique (comme les autres tables de config),
-- mais AUCUNE policy d'écriture pour le rôle anon : seule la clé service_role
-- (utilisée par /api/admin/bans) peut créer ou lever un bannissement.
create table if not exists site_bans (
  discord_id text primary key,
  nom text,
  motif text,
  banned_by text,
  banned_at timestamptz not null default now()
);
alter table site_bans enable row level security;
drop policy if exists "site_bans_select" on site_bans;
create policy "site_bans_select" on site_bans for select using (true);
