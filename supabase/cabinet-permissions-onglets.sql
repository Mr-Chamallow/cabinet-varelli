-- PERMISSIONS PAR ONGLET (Administration → Rôles & Permissions)
-- Chaque onglet a sa propre permission. Relançable sans risque.
--   cabinet_facturation : Devis & factures (édition)
--   cabinet_depenses    : Comptabilité → Dépenses
--   cabinet_commissions : Comptabilité → Commissions & versements
--   cabinet_bilan       : Comptabilité → Bilan
--   cabinet_direction   : Tableau de bord (lecture seule sans "edit_all")
--   cabinet_journal     : Journal d'activité

-- Associé Gérant : tous les onglets
update roles set permissions = (
  select coalesce(jsonb_agg(distinct p), '[]'::jsonb)
  from jsonb_array_elements_text(permissions || '["cabinet_facturation","cabinet_depenses","cabinet_commissions","cabinet_bilan","cabinet_direction","cabinet_journal","cabinet_compta"]'::jsonb) p
) where nom = 'Associé Gérant';

-- Secrétaire juridique : tout sauf le journal (tableau de bord en lecture seule)
update roles set permissions = (
  select coalesce(jsonb_agg(distinct p), '[]'::jsonb)
  from jsonb_array_elements_text(permissions || '["cabinet_facturation","cabinet_depenses","cabinet_commissions","cabinet_bilan","cabinet_direction","cabinet_compta"]'::jsonb) p
) where nom = 'Secrétaire juridique';

-- Vérification
select nom, permissions from roles where nom in ('Associé Gérant', 'Secrétaire juridique');
