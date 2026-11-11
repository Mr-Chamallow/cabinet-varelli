-- Relances automatiques : date de la dernière relance envoyée pour une facture
alter table cabinet_factures add column if not exists derniere_relance date;
