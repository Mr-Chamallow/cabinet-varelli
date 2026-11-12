-- Montant numérique d'un tarif, utilisé pour la facturation (ex : 70000 pour "70 000 $")
alter table cabinet_tarifs add column if not exists prix_montant numeric;
