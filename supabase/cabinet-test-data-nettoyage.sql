-- SUPPRIME toutes les données de test (fictives). Ne touche pas aux vraies données.
delete from cabinet_paiements where facture_id in (select id from cabinet_factures where numero like 'TEST-%');
delete from cabinet_factures where numero like 'TEST-%';
delete from cabinet_comparutions where client_nom like '[TEST]%' or avocat_discord_id like 'TEST_%';
delete from cabinet_rdv where client_nom like '[TEST]%' or discord_id like 'TEST_%';
delete from cabinet_factures_gouvernement where detail::text like '%[TEST]%';
delete from cabinet_depenses where libelle like '[TEST]%';
delete from cabinet_versements where employe_discord_id like 'TEST_%';
delete from cabinet_avocat_grades where avocat_discord_id like 'TEST_%';
