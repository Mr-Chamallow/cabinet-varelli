-- Lot 39 : liste officielle des groupes (8 organisations, 10 gangs, 28 petites frappes)
-- A lancer dans Supabase > SQL Editor (apres push + deploiement). Peut etre relance sans risque.
-- Ne supprime AUCUN groupe existant (les liens avec taxes, pactes, personnes, vehicules restent intacts).
-- Les groupes deja presents (meme nom, majuscules ignorees) sont mis a jour : type + ordre.

alter table carte_gangs add column if not exists sort_order integer default 0;

create temp table _groupes (nom text, type text, ordre int);
insert into _groupes (nom, type, ordre) values
  ('Bloodside','orga',1),
  ('Devils Sons','orga',2),
  ('Fenice','orga',3),
  ('Gaïa Lavýrinthos','orga',4),
  ('Lonewolf MC','orga',5),
  ('Los Reyes Colombianos','orga',6),
  ('Navua Syndicate','orga',7),
  ('Rubi Oscuro','orga',8),
  ('Anatolie Crime Syndicate','gang',101),
  ('Black Hood Order','gang',102),
  ('Brooklyn Brotherhood','gang',103),
  ('Families','gang',104),
  ('Fylí Tis Sykópetras','gang',105),
  ('Kardeşler','gang',106),
  ('Les Ricains','gang',107),
  ('Los Locos Del Malecón','gang',108),
  ('Los Malditos','gang',109),
  ('Zhovta Krov','gang',110),
  ('La Maja 13','pf',201),
  ('Lost Verity','pf',202),
  ('White Hacker','pf',203),
  ('Silver Luna','pf',204),
  ('Ghost Chain','pf',205),
  ('Valley Side Mod','pf',206),
  ('Muertenos','pf',207),
  ('Klan Zekta','pf',208),
  ('Die Erben','pf',209),
  ('Epsilon','pf',210),
  ('Famille Krueger','pf',211),
  ('Shadow Knights','pf',212),
  ('Obscyde','pf',213),
  ('Black Diamond Society','pf',214),
  ('Smoke Bro','pf',215),
  ('6am','pf',216),
  ('Klan Ozumiya','pf',217),
  ('La Main de Minuit','pf',218),
  ('Foyer Compton','pf',219),
  ('Famille Moni','pf',220),
  ('Strada Nostra','pf',221),
  ('Spartan','pf',222),
  ('Nox','pf',223),
  ('WBS','pf',224),
  ('Volta','pf',225),
  ('Street Driver','pf',226),
  ('Opex','pf',227),
  ('african nation','pf',228);

update carte_gangs g set type = x.type, sort_order = x.ordre
from _groupes x where lower(g.nom) = lower(x.nom);

insert into carte_gangs (nom, type, sort_order)
select x.nom, x.type, x.ordre from _groupes x
where not exists (select 1 from carte_gangs g where lower(g.nom) = lower(x.nom));

-- Controle : nombre par type + groupes qui ne sont PAS dans la liste officielle
select type, count(*) from carte_gangs where lower(nom) in (select lower(nom) from _groupes) group by type order by type;
select nom, type as "hors liste (a supprimer a la main si inutile)" from carte_gangs where lower(nom) not in (select lower(nom) from _groupes) order by nom;
