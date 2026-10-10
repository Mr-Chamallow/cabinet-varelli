-- LOT 6 : photos arrestations/fiches + ordre des rôles
alter table arrestations add column if not exists photo_url text;
alter table obsidian_fiches add column if not exists photo_id text;

alter table roles add column if not exists ordre int;
alter table roles add column if not exists groupe text;

update roles r set ordre = v.o, groupe = v.g, couleur = v.c
from (values
 ('Associé / Patron',1,'Direction','#c9a84c'),
 ('CEO - Directeur général',2,'Direction','#e0b64f'),
 ('COO - Directrice opérationnel',3,'Direction','#b8b8c8'),
 ('Responsable juridique',4,'Juridique','#a48fff'),
 ('Agent juridique',5,'Juridique','#8b8bf0'),
 ('Avocat',6,'Juridique','#c084fc'),
 ('Responsable logistique',7,'Logistique','#f59e0b'),
 ('Agent logistique',8,'Logistique','#fbbf24'),
 ('Responsable sécurité',9,'Sécurité','#ef4444'),
 ('Agent de sécurité',10,'Sécurité','#f87171'),
 ('Opérateur',11,'Membres','#38bdf8'),
 ('Opérateur stagiaire',12,'Membres','#94a3b8'),
 ('Légal Service',13,'Externe','#14b8a6')
) as v(n,o,g,c) where r.nom = v.n;
