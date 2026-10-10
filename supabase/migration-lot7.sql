-- LOT 7 : CEO remplace "Associé / Patron" + membres fictifs de test
-- 1) CEO reprend les permissions du Patron, puis le Patron disparaît
update roles set permissions = (select permissions from roles where nom = 'Associé / Patron' limit 1)
 where nom = 'CEO - Directeur général' and exists (select 1 from roles where nom = 'Associé / Patron');
update role_overrides set role = 'CEO - Directeur général' where role = 'Associé / Patron';
update site_logins set site_role = 'CEO - Directeur général' where site_role = 'Associé / Patron';
delete from roles where nom = 'Associé / Patron';
update roles set ordre = 1 where nom = 'CEO - Directeur général';
update roles set ordre = 2 where nom = 'COO - Directrice opérationnel';

-- 2) Membres fictifs (1 par rôle) — repérables par "[TEST]" dans les notes
insert into obsidian_employes (nom, role, telephone, discord, email, notes, actif)
select v.nom, v.role, v.tel, '', '', '[TEST] membre fictif', true
from (values
 ('Victor Hale','CEO - Directeur général','555-0101'),
 ('Elena Moretti','COO - Directrice opérationnel','555-0102'),
 ('Adrian Vance','Responsable juridique','555-0103'),
 ('Lucas Bennett','Agent juridique','555-0104'),
 ('Camille Roux','Avocat','555-0105'),
 ('Marcus Reed','Responsable logistique','555-0106'),
 ('Tony Rizzo','Agent logistique','555-0107'),
 ('Jack Sullivan','Responsable sécurité','555-0108'),
 ('Dante Cole','Agent de sécurité','555-0109'),
 ('Sam Fletcher','Opérateur','555-0110'),
 ('Leo Martin','Opérateur stagiaire','555-0111'),
 ('Inspecteur Doe','Légal Service','555-0112')
) as v(nom, role, tel)
where not exists (select 1 from obsidian_employes e where lower(e.nom) = lower(v.nom));

-- Pour les supprimer plus tard :
-- delete from obsidian_employes where notes like '[TEST]%';
