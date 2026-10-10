-- Lot 4 : référentiel d'employés par id, photos de fiches / avis de recherche, groupes pour la Base de données. À exécuter une fois.

-- 1) Type « Gang » autorisé pour les groupes
alter table carte_gangs drop constraint if exists carte_gangs_type_check;
alter table carte_gangs add constraint carte_gangs_type_check check (type in ('orga','gang','pf','inde'));

-- 2) Fiches : photo + récompense (avis de recherche) ; Base de données : récompense
alter table obsidian_fiches add column if not exists photo_url text;
alter table obsidian_fiches add column if not exists prime numeric not null default 0;
alter table bdd_personnes   add column if not exists prime numeric not null default 0;

-- 3) Personnes de la Base de données : l'organisation en texte libre pointe désormais vers un groupe
insert into carte_gangs (nom, type)
select distinct trim(organisation), 'orga' from bdd_personnes p
where coalesce(trim(organisation), '') <> '' and p.groupe_id is null
  and not exists (select 1 from carte_gangs g where lower(g.nom) = lower(trim(p.organisation)));
update bdd_personnes p set groupe_id = g.id from carte_gangs g
where p.groupe_id is null and lower(g.nom) = lower(trim(p.organisation));

-- 4) Référentiel d'employés : chaque ligne liée à un employé garde son employe_id (rempli automatiquement)
create or replace function set_employe_id() returns trigger language plpgsql as $$
declare nm text; eid uuid;
begin
  nm := to_jsonb(NEW)->>TG_ARGV[0];
  if nm is not null and nm <> '' then
    select id into eid from obsidian_employes where lower(nom) = lower(nm) limit 1;
    if eid is not null then NEW.employe_id := eid; end if;
  end if;
  return NEW;
end $$;

do $$
declare r record;
begin
  for r in select * from (values
    ('actions_illegales','membre'), ('arrestations','membre'), ('obsidian_comptabilite','membre'),
    ('obsidian_mouvements','membre'), ('obsidian_paiements','employe'), ('cahier_transactions','created_by')
  ) as t(tbl, col) loop
    execute format('alter table %I add column if not exists employe_id uuid', r.tbl);
    execute format('create index if not exists idx_%s_employe on %I(employe_id)', r.tbl, r.tbl);
    execute format('update %I t set employe_id = e.id from obsidian_employes e where t.employe_id is null and lower(e.nom) = lower(t.%I)', r.tbl, r.col);
    execute format('drop trigger if exists trg_employe_id on %I', r.tbl);
    execute format('create trigger trg_employe_id before insert or update of %I on %I for each row execute function set_employe_id(%L)', r.col, r.tbl, r.col);
  end loop;
end $$;

-- 5) Nom affiché = Prénom Nom du personnage (jamais le pseudo Discord) : on le recopie depuis l'employé lié
update site_logins s set nom_perso = e.nom from obsidian_employes e
where e.discord_id = s.discord_id and (s.nom_perso is null or s.nom_perso = '');
