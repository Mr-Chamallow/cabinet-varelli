-- ============================================================
-- DONNÉES DE DÉMO (présentation du site) — ne touche JAMAIS à :
--   • Tableau des prix (obsidian_drogues, obsidian_armes_prix, obsidian_zones…)
--   • Employés (obsidian_employes) : les noms existants sont seulement réutilisés.
-- Toutes les lignes créées portent created_by = 'Démo'  →  supabase/unseed-demo.sql les supprime.
-- Relançable sans doublon (nettoyage au début).
-- ============================================================
select setseed(0.42);

-- 0) Nettoyage d'un précédent seed
delete from obsidian_comptabilite where created_by = 'Démo';
delete from obsidian_mouvements   where created_by = 'Démo';
delete from cahier_transactions   where created_by = 'Démo';
delete from actions_illegales     where created_by = 'Démo';
delete from arrestations          where created_by = 'Démo';
delete from obsidian_paiements    where paid_by = 'Démo';
delete from obsidian_stocks       where created_by = 'Démo';
delete from obsidian_garage       where created_by = 'Démo';
delete from obsidian_contrats     where created_by = 'Démo';
delete from obsidian_rdv          where created_by = 'Démo';
delete from obsidian_journal      where par = 'Démo';
delete from obsidian_fiches       where created_by = 'Démo';
delete from bdd_vehicules         where notes = 'Démo';
delete from bdd_personnes         where created_by = 'Démo';
delete from gm_reputation_log     where created_by = 'Démo';
delete from gm_pactes             where created_by = 'Démo';
delete from gm_audits             where created_by = 'Démo';
delete from tribunal_dossiers     where created_by = 'Démo';
delete from gm_evenements         where created_by = 'Démo';

-- 1) Actions illégales : ~140 sur 8 semaines, employés réels
insert into actions_illegales (membre, action, montant, notes, created_by, created_at)
select m, a.nom,
       case when random() < 0.12 then -round((300 + random()*2500)::numeric, -1)
            else round((1500 + random()*11000)::numeric, -2) end,
       (array['Sans accroc','Police sur zone','Livraison propre','Témoin gênant','Excellent timing','Repli rapide'])[1+floor(random()*6)::int],
       'Démo',
       now() - (random()*56 || ' days')::interval - (random()*20 || ' hours')::interval
from generate_series(1,140) g,
     lateral (select (array['Marcus Reed','Sam Fletcher','Tony Rizzo','Jack Sullivan','Dante Cole','Adrian Vance','Lucas Bennett','Leo Martin','Elena Moretti','Pierce Davenport','Camille Roux'])[1+floor(random()*11)::int] m) e,
     lateral (select nom from actions_illegales_types order by random() limit 1) a;

-- 2) Arrestations : 16 (amende = prime de paie, argent perdu = perte sèche)
insert into arrestations (membre, amende, argent_perdu, type_argent, items, notes, created_by, created_at)
select (array['Sam Fletcher','Tony Rizzo','Dante Cole','Leo Martin','Marcus Reed','Lucas Bennett'])[1+floor(random()*6)::int],
       round((800 + random()*4200)::numeric, -1), round((0 + random()*6000)::numeric, -2),
       (array['sale','propre','mixte'])[1+floor(random()*3)::int], '[]'::jsonb,
       (array['Contrôle routier','Flagrant délit','Dénonciation','Fouille au corps','Perquisition'])[1+floor(random()*5)::int],
       'Démo', now() - (random()*56 || ' days')::interval
from generate_series(1,16);

-- 3) Stocks (quantités directes, sans toucher aux prix de référence)
insert into obsidian_stocks (nom, categorie, emoji, quantite, seuil_alerte, unite, prix_unitaire, notes, created_by) values
 ('Cocaïne 50%','drogue','❄️',420,100,'u',180,'Démo','Démo'),('Cannabis 70%','drogue','🌿',860,200,'u',45,'Démo','Démo'),
 ('Mexicana 50%','drogue','💊',35,60,'u',95,'Démo — sous le seuil','Démo'),('Pistolet lourd','arme','🔫',12,4,'u',9500,'Démo','Démo'),
 ('Fusil à pompe','arme','🔫',5,3,'u',14000,'Démo','Démo'),('Munitions pistolet','munition','🔸',640,150,'boîte',220,'Démo','Démo'),
 ('Munitions SMG','munition','🔸',90,120,'boîte',310,'Démo — sous le seuil','Démo'),('Silencieux','accessoire','🔇',18,5,'u',2800,'Démo','Démo'),
 ('Kevlar','gilet','🦺',27,8,'u',1500,'Démo','Démo'),('Grenade','explosif','💣',14,4,'u',3200,'Démo','Démo'),
 ('Fertilisant','composant','🧪',300,80,'u',20,'Démo','Démo'),('Boîtier de piratage','autre','📟',9,3,'u',4200,'Démo','Démo'),
 ('Outil de crochetage','autre','🗝️',40,10,'u',350,'Démo','Démo'),('Fausse plaque d''immatriculation','autre','🪪',22,6,'u',900,'Démo','Démo'),
 ('Serflex','autre','🔗',150,40,'u',15,'Démo','Démo'),('Radio chiffrée','radio','📻',16,4,'u',1200,'Démo','Démo');

insert into obsidian_mouvements (stock_id, stock_nom, type, quantite, motif, membre, prix_unitaire, total, created_by, created_at)
select s.id, s.nom, (array['entrée','sortie'])[1+floor(random()*2)::int], q.q,
       (array['Réassort fournisseur','Vente','Livraison contrat','Casse','Transfert entrepôt'])[1+floor(random()*5)::int],
       (array['Marcus Reed','Tony Rizzo','Sam Fletcher','Dante Cole'])[1+floor(random()*4)::int],
       s.prix_unitaire, q.q * s.prix_unitaire, 'Démo', now() - (random()*56 || ' days')::interval
from generate_series(1,45) g,
     lateral (select * from obsidian_stocks where created_by='Démo' order by random() limit 1) s,
     lateral (select (1+floor(random()*25))::numeric q) q;

-- 4) Transactions (ex-Cahier de vente)
insert into cahier_transactions (type, montant, categorie, motif, produit_nom, quantite, type_argent, created_by, created_at)
select t, s.prix_unitaire * q, s.categorie, (case when t='entrée' then 'Vente ' else 'Achat ' end) || q || ' × ' || s.nom, s.nom, q,
       (array['propre','sale','mixte'])[1+floor(random()*3)::int], 'Démo', now() - (random()*50 || ' days')::interval
from generate_series(1,22) g,
     lateral (select (array['entrée','sortie'])[1+floor(random()*2)::int] t, (1+floor(random()*8))::int q) x,
     lateral (select * from obsidian_stocks where created_by='Démo' and categorie in ('drogue','arme','munition') order by random() limit 1) s
where s.prix_unitaire > 0;

-- 5) Comptabilité dérivée (même logique que le site : actions, arrestations, transactions)
insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source, source_id)
select case when montant > 0 then 'recette' else 'dépense' end, action, abs(montant), 'sale', action || ' — ' || membre, membre,
       date_trunc('week', created_at)::date, 'Démo', created_at, 'action', id
from actions_illegales where created_by = 'Démo' and montant <> 0;

insert into obsidian_comptabilite (type, categorie, montant, type_argent, motif, membre, semaine, created_by, created_at, source)
select case when type='entrée' then 'recette' else 'dépense' end, (case when type='entrée' then 'Vente ' else 'Achat ' end) || categorie, montant, type_argent, motif, '',
       date_trunc('week', created_at)::date, 'Démo', created_at, 'transaction'
from cahier_transactions where created_by = 'Démo';

-- 6) Garage
insert into obsidian_garage (modele, plaque, couleur, position, statut, assigne_a, valeur, notes, created_by) values
 ('Sultan RS','OBS-001','Noir','Garage Mission Row','Disponible','Marcus Reed',68000,'Démo','Démo'),
 ('Kuruma blindé','OBS-002','Gris','Entrepôt du port','En mission','Dante Cole',142000,'Démo','Démo'),
 ('Speedo Custom','OBS-003','Blanc','Garage Mission Row','Disponible','Tony Rizzo',34000,'Démo','Démo'),
 ('Buffalo S','OBS-004','Bleu nuit','Parking sécurisé','En réparation','Sam Fletcher',52000,'Démo','Démo'),
 ('Zentorno','OBS-005','Rouge','Villa Vinewood','Disponible','Pierce Davenport',310000,'Démo','Démo'),
 ('Bison','OBS-006','Vert','Entrepôt du port','Disponible','',21000,'Démo','Démo'),
 ('Hexer','OBS-007','Noir','Garage Mission Row','En mission','Leo Martin',18000,'Démo','Démo');

-- 7) Contrats
insert into obsidian_contrats (titre, type, difficulte, recompense, statut, membres_affectes, description, rapport, date_cible, created_by) values
 ('Livraison Port → Entrepôt','Livraison','Facile',12000,'Terminé',array['Marcus Reed','Tony Rizzo'],'Convoi de caisses vers l''entrepôt.','Livré sans incident.',current_date-12,'Démo'),
 ('Escorte convoi Fleeca','Escorte','Difficile',45000,'Terminé',array['Dante Cole','Jack Sullivan','Leo Martin'],'Escorte d''un convoi sensible.','Succès, 1 véhicule endommagé.',current_date-9,'Démo'),
 ('Récupération marchandise Sandy','Collecte','Normale',18000,'En cours',array['Sam Fletcher'],'Récupérer un lot à Sandy Shores.','',current_date+2,'Démo'),
 ('Transfert d''armes','Livraison','Extrême',80000,'En attente',array['Marcus Reed','Dante Cole'],'Transfert discret, deux véhicules.','',current_date+5,'Démo'),
 ('Surveillance Vespucci','Surveillance','Facile',6000,'Terminé',array['Lucas Bennett'],'Filature 48 h.','Rapport remis.',current_date-20,'Démo'),
 ('Vol de données Pacific','Piratage','Difficile',52000,'Échoué',array['Tony Rizzo','Sam Fletcher'],'Extraction de données bancaires.','Alarme déclenchée.',current_date-6,'Démo'),
 ('Nettoyage entrepôt','Logistique','Facile',4000,'Terminé',array['Leo Martin'],'Inventaire et tri.','OK.',current_date-3,'Démo'),
 ('Négociation Famille Moni','Diplomatie','Normale',25000,'En cours',array['Elena Moretti','Adrian Vance'],'Accord de non-agression.','',current_date+7,'Démo'),
 ('Livraison express LS','Livraison','Normale',9000,'Terminé',array['Tony Rizzo'],'Livraison sous 30 minutes.','Livré en 24 min.',current_date-1,'Démo'),
 ('Audit sécurité QG','Sécurité','Normale',7000,'En attente',array['Jack Sullivan','Dante Cole'],'Contrôle des accès.','',current_date+10,'Démo');

-- 8) Rendez-vous
insert into obsidian_rdv (titre, type, date, heure, lieu, priorite, statut, notes, client, created_by, partage_avec)
select t, ty, current_date + d, h, l, p, 'planifié', 'Démo', c, 'Démo', array[]::text[]
from (values
 ('Brief hebdomadaire','Réunion',1,'20:00','QG Obsidian','Haute','Pierce Davenport'),
 ('Livraison client VIP','Livraison',2,'21:30','Port de Los Santos','Haute','Marcus Reed'),
 ('Recrutement stagiaire','Entretien',3,'19:00','Bureau RH','Normale','Elena Moretti'),
 ('Contrôle stock mensuel','Inventaire',4,'18:00','Entrepôt','Normale','Tony Rizzo'),
 ('Audience Black Order','Tribunal',5,'22:00','Tribunal de l''Ombre','Haute','Adrian Vance'),
 ('Formation sécurité','Formation',6,'20:30','Salle d''entraînement','Basse','Jack Sullivan'),
 ('Remise des paies','Paie',7,'21:00','QG Obsidian','Haute','Pierce Davenport'),
 ('Point comptable','Réunion',8,'19:30','Bureau compta','Normale','Elena Moretti')
) v(t,ty,d,h,l,p,c);

-- 9) Base de données : personnes + véhicules
insert into bdd_personnes (nom, prenom, surnom, telephone, age, origine, occupation, organisation, statut, priorite, notes_publiques, created_by) values
 ('Moretti','Vincenzo','Le Comptable','555-0142',44,'Italie','Banquier','Black Diamond Society','Actif','Haute','Blanchiment présumé.','Démo'),
 ('Okafor','Daniel','Dany','555-0177',31,'Nigeria','Chauffeur','VenTa','Actif','Normale','Convoyeur régulier.','Démo'),
 ('Kowalski','Anna','Ghost','555-0120',27,'Pologne','Hackeuse','Ghost Chain','Surveillé','Haute','Piratage ATM.','Démo'),
 ('Ramirez','Diego','El Gato','555-0199',36,'Mexique','Dealer','La Main de Minuit','Recherché','Haute','Trafic de stupéfiants.','Démo'),
 ('Whitaker','Joe','Whit','555-0166',52,'USA','Garagiste','','Actif','Basse','Contact fiable.','Démo'),
 ('Laurent','Sophie','','555-0108',29,'France','Avocate','','Actif','Normale','Avocate indépendante.','Démo');

insert into bdd_vehicules (plaque, marque_modele, couleur, proprietaire_id, notes)
select pl, mo, co, (select id from bdd_personnes where nom = ow and created_by='Démo' limit 1), 'Démo'
from (values ('VNT-204','Kuruma','Noir','Okafor'),('GHO-777','Sultan','Gris','Kowalski'),('MDM-013','Bison','Rouge','Ramirez'),('BDS-001','Cognoscenti','Blanc','Moretti'),('WHT-555','Rebel','Vert','Whitaker')) v(pl,mo,co,ow);

-- 10) Fiches (dont personnes recherchées) + journal
insert into obsidian_fiches (nom, type, priorite, statut, metier, tags, age, origine, organisation, occupation, telephone, notes_publiques, notes_privees, prime, surveille, created_by)
select p.prenom || ' ' || p.nom, 'personne', p.priorite, p.statut, 'civil', array['démo'], p.age, p.origine, p.organisation, p.occupation, p.telephone, p.notes_publiques, 'Fiche de démonstration.',
       case when p.statut = 'Recherché' then 25000 else 0 end, p.statut = 'Surveillé', 'Démo'
from bdd_personnes p where p.created_by = 'Démo';

insert into obsidian_journal (fiche_id, fiche_nom, action, par)
select id, nom, 'Fiche créée', 'Démo' from obsidian_fiches where created_by = 'Démo';
insert into obsidian_journal (fiche_id, fiche_nom, action, par)
select id, nom, 'Fiche modifiée (statut → ' || statut || ')', 'Démo' from obsidian_fiches where created_by = 'Démo' and statut <> 'Actif';

-- 11) Consortium : réputation, pactes, audits, tribunal, événements
insert into gm_reputation_log (organisation, delta, motif, source, created_by, created_at)
select o, (array[-15,-8,-3,4,6,10,12])[1+floor(random()*7)::int], (array['Respect d''un pacte','Incident en zone neutre','Livraison honorée','Violation de territoire','Aide ponctuelle','Retard de paiement'])[1+floor(random()*6)::int],
       'manuel', 'Démo', now() - (random()*45 || ' days')::interval
from generate_series(1,36) g, lateral (select (array['La Main de Minuit','WBS','VenTa','Ghost Chain','Black Diamond Society','The Black Order'])[1+floor(random()*6)::int] o) x;

insert into gm_pactes (organisation, statut, date_signature, date_fin, signataire, clauses, violations, created_by) values
 ('Black Diamond Society','actif',current_date-30,current_date+60,'Pierce Davenport','Non-agression, partage de routes.','[]'::jsonb,'Démo'),
 ('VenTa','actif',current_date-20,current_date+40,'Elena Moretti','Escorte mutuelle.','[{"texte":"Retard de livraison","date":"2026-09-28T20:00:00Z"}]'::jsonb,'Démo'),
 ('The Black Order','suspendu',current_date-50,current_date+10,'Pierce Davenport','Zone neutre au port.','[{"texte":"Tir en zone neutre","date":"2026-10-01T22:00:00Z"},{"texte":"Non-respect du couvre-feu","date":"2026-10-03T23:00:00Z"}]'::jsonb,'Démo'),
 ('Ghost Chain','rompu',current_date-80,current_date-5,'Elena Moretti','Échange d''informations.','[{"texte":"Fuite d''informations","date":"2026-09-20T19:00:00Z"}]'::jsonb,'Démo');

insert into gm_audits (organisation, note, appreciation, notes, created_by, created_at)
select o, n, (case when n >= 8 then 'Excellent' when n >= 5 then 'Correct' else 'Insuffisant' end), 'Audit de démonstration.', 'Démo', now() - (random()*40 || ' days')::interval
from (values ('La Main de Minuit',8),('WBS',6),('VenTa',9),('Ghost Chain',4),('Black Diamond Society',7),('The Black Order',3),('Lost Verity',5),('Spartan',8)) v(o,n);

insert into tribunal_dossiers (titre, accuse, organisation, statut, juge, procureur, avocat, date_audience, acte_accusation, defense, verdict, sentence, created_by) values
 ('Affaire du convoi détourné','Diego Ramirez','La Main de Minuit','verdict','Adrian Vance','Lucas Bennett','Camille Roux',now()-interval '8 days','Détournement d''un convoi.','Alibi contesté.','coupable','Amende 40 000 $ + interdiction de zone.','Démo'),
 ('Fuite d''informations','Anna Kowalski','Ghost Chain','defense','Adrian Vance','Lucas Bennett','Camille Roux',now()+interval '3 days','Divulgation de données.','Nie les faits.','en_cours','','Démo'),
 ('Tir en zone neutre','Membre anonyme','The Black Order','instruction','Adrian Vance','Lucas Bennett','',null,'Tirs au port.','','en_cours','','Démo'),
 ('Retard de paiement','Vincenzo Moretti','Black Diamond Society','verdict','Adrian Vance','Lucas Bennett','Camille Roux',now()-interval '15 days','Impayé de 30 000 $.','Erreur comptable.','innocent','Relaxe.','Démo');

insert into gm_evenements (type, titre, statut, partenaire, date_event, montant, notes, created_by) values
 ('convoi','Convoi Fleeca #12','livre','VenTa',now()-interval '10 days',60000,'Démo','Démo'),
 ('convoi','Convoi Pacific #3','livre','Black Diamond Society',now()-interval '6 days',85000,'Démo','Démo'),
 ('convoi','Convoi Sandy #7','echec','WBS',now()-interval '4 days',40000,'Démo','Démo'),
 ('convoi','Convoi Port #15','planifie','VenTa',now()+interval '2 days',70000,'Démo','Démo'),
 ('enchere','Enchère véhicules de luxe','cloturee','Vinewood',now()-interval '12 days',230000,'Démo','Démo'),
 ('enchere','Enchère œuvres d''art','annoncee','Vinewood',now()+interval '6 days',0,'Démo','Démo'),
 ('capture','Capture Diego Ramirez','a_faire','La Main de Minuit',now()+interval '1 day',25000,'Démo','Démo'),
 ('capture','Capture informateur','capturee','Ghost Chain',now()-interval '5 days',10000,'Démo','Démo'),
 ('alerte','Fuite chez un partenaire','traquee','Spartan',now()-interval '2 days',15000,'Démo','Démo');
