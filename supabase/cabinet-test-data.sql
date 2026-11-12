-- DONNÉES DE TEST (fictives). Toutes marquées "[TEST]" / "TEST_" pour les retirer avec cabinet-test-data-nettoyage.sql
-- Comparutions en octobre 2026 : elles ne seront PAS facturées automatiquement (le cron ne prend que la semaine précédente).
-- Pour tester la facture : Bilan → semaine du 5 octobre 2026 → "Générer la facture de cette semaine".

-- 1) Avocats et grades
insert into cabinet_avocat_grades (avocat_discord_id, avocat_nom, grade) values
  ('TEST_AV_1', '[TEST] Avocat Dupont', 'Collaborateur'),
  ('TEST_AV_2', '[TEST] Avocate Martin', 'Associé'),
  ('TEST_AV_3', '[TEST] Avocat Lefevre', 'Associé Sénior')
on conflict (avocat_discord_id) do update set avocat_nom = excluded.avocat_nom, grade = excluded.grade;

-- 2) Rendez-vous liés (4 comparutions)
insert into cabinet_rdv (id, discord_id, client_nom, motif, date_rdv, statut, avocat_discord_id, avocat_nom, prestation) values
  ('22222222-0000-4000-8000-000000000001', 'TEST_CLIENT_1', '[TEST] Client Robert', 'Comparution immédiate', '2026-10-06 09:30', 'attribue', 'TEST_AV_1', '[TEST] Avocat Dupont', 'Comparution immédiate'),
  ('22222222-0000-4000-8000-000000000002', 'TEST_CLIENT_2', '[TEST] Client Moreau', 'Comparution immédiate', '2026-10-13 14:00', 'attribue', 'TEST_AV_2', '[TEST] Avocate Martin', 'Comparution immédiate'),
  ('22222222-0000-4000-8000-000000000003', 'TEST_CLIENT_3', '[TEST] Client Girard', 'Comparution immédiate', '2026-10-20 10:00', 'attribue', 'TEST_AV_3', '[TEST] Avocat Lefevre', 'Comparution immédiate'),
  ('22222222-0000-4000-8000-000000000004', 'TEST_CLIENT_4', '[TEST] Client Petit', 'Comparution immédiate', '2026-10-27 16:30', 'attribue', 'TEST_AV_1', '[TEST] Avocat Dupont', 'Comparution immédiate');

-- 3) Comparutions immédiates (montant = honoraire selon la gravité : 0→3000, 1→7000, 2→10000, 3→15000, 4→20000, 5→25000)
with data(id, date_audience, heure, tribunal, client_nom, chefs, juge_proc, matricules, avocat_id, statut, montant, rdv_id) as (values
  ('11111111-0000-4000-8000-000000000001'::uuid, '2026-10-05'::date, '09:00', 'Tribunal de Los Santos', '[TEST] Client Robert', 'Détention de stupéfiants #2', 'Juge Hale', 'MAT-101', 'TEST_AV_1', 'prise_en_charge', 10000, '22222222-0000-4000-8000-000000000001'::uuid),
  ('11111111-0000-4000-8000-000000000002'::uuid, '2026-10-06'::date, '09:30', 'Tribunal de Los Santos', '[TEST] Client Robert', 'Vol de véhicule #3', 'Juge Hale', 'MAT-101', 'TEST_AV_1', 'prise_en_charge', 15000, null),
  ('11111111-0000-4000-8000-000000000003'::uuid, '2026-10-07'::date, '11:00', 'Cour d''appel de Blaine', '[TEST] Client Vance', 'Infraction routière #0', 'Juge Ortega', 'MAT-204', 'TEST_AV_2', 'prise_en_charge', 3000, null),
  ('11111111-0000-4000-8000-000000000004'::uuid, '2026-10-08'::date, '14:15', 'Tribunal de Los Santos', '[TEST] Client Diaz', 'Agression #2', 'Juge Hale', 'MAT-118', 'TEST_AV_3', 'refusee', 10000, null),
  ('11111111-0000-4000-8000-000000000005'::uuid, '2026-10-13'::date, '14:00', 'Tribunal de Los Santos', '[TEST] Client Moreau', 'Trafic d''armes #4', 'Juge Ortega', 'MAT-220', 'TEST_AV_2', 'prise_en_charge', 20000, '22222222-0000-4000-8000-000000000002'::uuid),
  ('11111111-0000-4000-8000-000000000006'::uuid, '2026-10-14'::date, '10:30', 'Cour d''appel de Blaine', '[TEST] Client Lambert', 'Infraction mineure #1', 'Juge Hale', 'MAT-133', 'TEST_AV_1', 'prise_en_charge', 7000, null),
  ('11111111-0000-4000-8000-000000000007'::uuid, '2026-10-15'::date, '09:00', 'Tribunal de Los Santos', '[TEST] Client Faure', 'Vol aggravé #4', 'Juge Hale', 'MAT-101', 'TEST_AV_3', 'en_attente', 20000, null),
  ('11111111-0000-4000-8000-000000000008'::uuid, '2026-10-20'::date, '10:00', 'Tribunal de Los Santos', '[TEST] Client Girard', 'Crime organisé #5', 'Juge Ortega', 'MAT-305', 'TEST_AV_3', 'prise_en_charge', 25000, '22222222-0000-4000-8000-000000000003'::uuid),
  ('11111111-0000-4000-8000-000000000009'::uuid, '2026-10-21'::date, '13:30', 'Cour d''appel de Blaine', '[TEST] Client Roux', 'Délit de fuite #2', 'Juge Hale', 'MAT-118', 'TEST_AV_2', 'prise_en_charge', 10000, null),
  ('11111111-0000-4000-8000-000000000010'::uuid, '2026-10-22'::date, '15:00', 'Tribunal de Los Santos', '[TEST] Client Blanc', 'Possession illégale #1', 'Juge Ortega', 'MAT-220', 'TEST_AV_1', 'prise_en_charge', 7000, null),
  ('11111111-0000-4000-8000-000000000011'::uuid, '2026-10-27'::date, '16:30', 'Tribunal de Los Santos', '[TEST] Client Petit', 'Escroquerie #3', 'Juge Hale', 'MAT-101', 'TEST_AV_1', 'prise_en_charge', 15000, '22222222-0000-4000-8000-000000000004'::uuid),
  ('11111111-0000-4000-8000-000000000012'::uuid, '2026-10-29'::date, '09:45', 'Cour d''appel de Blaine', '[TEST] Client Noir', 'Infraction non pénale #0', 'Juge Ortega', 'MAT-204', 'TEST_AV_2', 'refusee', 3000, null)
)
insert into cabinet_comparutions (id, date_audience, heure, tribunal, client_nom, chefs, juge_proc, matricules_officiers, avocat_discord_id, avocat_nom, statut, montant, rdv_id, taux_pct, part_avocat, notes)
select d.id, d.date_audience, d.heure, d.tribunal, d.client_nom, d.chefs, d.juge_proc, d.matricules, d.avocat_id, ag.avocat_nom, d.statut, d.montant, d.rdv_id,
       g.taux_pct, round(d.montant * g.taux_pct / 100), 'Donnée de test'
from data d
join cabinet_avocat_grades ag on ag.avocat_discord_id = d.avocat_id
join cabinet_grades g on g.grade = ag.grade;

-- 4) Factures clients de test (certaines payées)
insert into cabinet_factures (id, numero, client_discord_id, client_nom, libelle, montant, sous_total, tva_taux, statut, lignes, date_echeance, payee_at) values
  ('33333333-0000-4000-8000-000000000001', 'TEST-F-001', 'TEST_CLIENT_1', '[TEST] Client Robert', 'Honoraires dossier Robert', 24000, 24000, 0, 'payee',
   '[{"description":"Défense pénale","quantite":1,"prix":24000,"employe":"[TEST] Avocat Dupont","pct":50}]', '2026-10-31', '2026-10-10 12:00+00'),
  ('33333333-0000-4000-8000-000000000002', 'TEST-F-002', 'TEST_CLIENT_2', '[TEST] Client Moreau', 'Consultation et représentation', 5500, 5500, 0, 'en_attente',
   '[{"description":"Consultation","quantite":2,"prix":1500,"employe":"[TEST] Avocate Martin","pct":60},{"description":"Représentation","quantite":1,"prix":2500,"employe":"[TEST] Avocate Martin","pct":60}]', '2026-11-15', null),
  ('33333333-0000-4000-8000-000000000003', 'TEST-F-003', 'TEST_CLIENT_3', '[TEST] Client Girard', 'Dossier contentieux Girard', 12000, 12000, 0, 'payee',
   '[{"description":"Dossier contentieux","quantite":1,"prix":12000,"employe":"[TEST] Avocat Lefevre","pct":70}]', '2026-10-25', '2026-10-24 18:00+00');

insert into cabinet_paiements (facture_id, montant, mode, auteur_nom) values
  ('33333333-0000-4000-8000-000000000001', 24000, 'Virement', '[TEST] Secrétaire'),
  ('33333333-0000-4000-8000-000000000003', 12000, 'Espèces', '[TEST] Secrétaire');

-- 5) Dépenses et versements de test
insert into cabinet_depenses (date_depense, categorie, libelle, montant, auteur_nom) values
  ('2026-10-03', 'Fournitures', '[TEST] Papeterie', 350, '[TEST] Secrétaire'),
  ('2026-10-15', 'Loyer', '[TEST] Loyer bureau octobre', 4000, '[TEST] Secrétaire'),
  ('2026-10-22', 'Déplacement', '[TEST] Frais de route Blaine', 180, '[TEST] Secrétaire');

insert into cabinet_versements (employe_discord_id, employe_nom, montant, moyen, date_versement, auteur_nom) values
  ('TEST_AV_1', '[TEST] Avocat Dupont', 6000, 'Virement', '2026-10-09', '[TEST] Secrétaire'),
  ('TEST_AV_2', '[TEST] Avocate Martin', 8000, 'Virement', '2026-10-16', '[TEST] Secrétaire');
