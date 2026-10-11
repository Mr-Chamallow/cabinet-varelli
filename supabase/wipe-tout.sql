-- ============================================================
-- TOUT SUPPRIMER (donnees de test et de demo) - Obsidian Logistics
-- Supprime : compta, stocks + historique, transactions, actions illegales, arrestations,
--            paies, dons, garage, contrats, rendez-vous, clotures de semaines.
-- Remet a zero : capital de depart et seuil de tresorerie.
-- NE TOUCHE PAS : employes, roles et permissions, utilisateurs, tableau des prix, types d'actions,
--                 fiches / base de donnees / gestion de groupe (sauf lignes marquees 'Démo').
-- A lancer dans Supabase > SQL Editor.
-- ============================================================
alter table obsidian_comptabilite disable trigger trg_compta_lock;

delete from obsidian_dons;
do $$ begin if to_regclass('obsidian_fournisseurs') is not null then delete from obsidian_fournisseurs where created_by = 'Démo'; end if; end $$;
delete from obsidian_paiements;
delete from obsidian_comptabilite;
delete from obsidian_mouvements;
delete from cahier_transactions;
delete from actions_illegales;
delete from arrestations;
delete from obsidian_stocks;
delete from obsidian_garage;
delete from obsidian_contrats;
delete from obsidian_rdv;
delete from obsidian_semaines;

-- Lignes de demo des autres modules (marquees 'Démo')
delete from obsidian_journal  where par = 'Démo';
delete from obsidian_fiches   where created_by = 'Démo';
delete from bdd_vehicules     where notes = 'Démo';
delete from bdd_personnes     where created_by = 'Démo';
delete from gm_reputation_log where created_by = 'Démo';
delete from gm_pactes         where created_by = 'Démo';
delete from gm_audits         where created_by = 'Démo';
delete from tribunal_dossiers where created_by = 'Démo';
delete from gm_evenements     where created_by = 'Démo';


-- Lot 35 + annexes (lignes marquees Démo)
delete from obsidian_taxes_paiements where created_by = 'Démo';
delete from obsidian_taxes     where created_by = 'Démo';
delete from obsidian_recrutement where created_by = 'Démo';
delete from obsidian_guerres   where created_by = 'Démo';
delete from obsidian_journal  where fiche_id in (select id from obsidian_fiches where 'démo' = any(tags));
delete from obsidian_fiches   where 'démo' = any(tags);
delete from bdd_vehicules     where notes = 'Démo';
delete from bdd_personnes     where notes_privees = 'Démo';

-- Reset du classement "Membres les plus actifs" (Supervision) : il se base sur created_by des tables metier.
-- Les employes sont conserves mais on efface leur auteur de creation.
do $$ begin
  update obsidian_employes set created_by = null;
exception when others then
  begin update obsidian_employes set created_by = '-'; exception when others then null; end;
end $$;
delete from obsidian_journal;

update obsidian_settings set capital_depart = 0, seuil_tresorerie = 0, updated_at = now() where id = 'default';
alter table obsidian_comptabilite enable trigger trg_compta_lock;

select 'compta' as t, count(*) from obsidian_comptabilite union all select 'stocks', count(*) from obsidian_stocks union all select 'actions', count(*) from actions_illegales union all select 'employes (conserves)', count(*) from obsidian_employes;
