-- Lot 2 : référentiel des groupes (Base de données → Groupes), carte employé (photo), arrestations → prime de paie. À exécuter une fois.

-- 1) Photo de la carte employé
alter table obsidian_employes add column if not exists photo_url text;

-- 2) Les tables du Consortium pointent vers le groupe par son id
alter table tribunal_dossiers  add column if not exists groupe_id uuid;
alter table gm_pactes          add column if not exists groupe_id uuid;
alter table gm_audits          add column if not exists groupe_id uuid;
alter table gm_reputation_log  add column if not exists groupe_id uuid;
alter table gm_evenements      add column if not exists groupe_id uuid;
alter table obsidian_fiches    add column if not exists groupe_id uuid;

-- 3) Les organisations déjà utilisées mais absentes de « Groupes » y sont ajoutées
insert into carte_gangs (nom, type)
select distinct trim(n), 'orga' from (
  select nom as n from gm_organisations
  union select organisation from tribunal_dossiers
  union select organisation from gm_pactes
  union select organisation from gm_audits
  union select organisation from gm_reputation_log
  union select partenaire from gm_evenements
  union select organisation from obsidian_fiches
) x
where n is not null and trim(n) <> ''
  and not exists (select 1 from carte_gangs g where lower(g.nom) = lower(trim(x.n)));

-- 4) Rattache chaque ligne existante à son groupe
update tribunal_dossiers t set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.organisation));
update gm_pactes t         set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.organisation));
update gm_audits t         set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.organisation));
update gm_reputation_log t set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.organisation));
update gm_evenements t     set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.partenaire));
update obsidian_fiches t   set groupe_id = g.id from carte_gangs g where lower(g.nom) = lower(trim(t.organisation));

-- 5) Arrestations : l'argent perdu n'est plus une dépense en compta (c'est une prime de paie)
delete from obsidian_comptabilite where source = 'arrestation';
