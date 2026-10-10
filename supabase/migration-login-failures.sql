-- Journal des CONNEXIONS REFUSÉES (avant même la création de session), pour
-- diagnostiquer sans deviner : "pas membre du serveur" vs "scope Discord refusé"
-- vs autre erreur API. site_session_log/site_logins ne contiennent QUE les
-- connexions réussies (le callback jwt() ne tourne jamais si signIn() bloque).
create table if not exists site_login_failures (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null,
  discord_name text,
  reason text not null, -- 'not_member' | 'missing_scope' | 'api_error'
  created_at timestamptz not null default now()
);
alter table site_login_failures enable row level security;
drop policy if exists "site_login_failures_select" on site_login_failures;
create policy "site_login_failures_select" on site_login_failures for select using (true);
drop policy if exists "site_login_failures_insert" on site_login_failures;
create policy "site_login_failures_insert" on site_login_failures for insert with check (true);
create index if not exists idx_site_login_failures_at on site_login_failures(created_at desc);
