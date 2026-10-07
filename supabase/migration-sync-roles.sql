-- Synchro des rôles Discord : rôle Discord affiché dans Admin > Membres + resynchro forcée.
alter table site_logins add column if not exists discord_role text;
alter table site_logins add column if not exists force_resync boolean not null default false;
