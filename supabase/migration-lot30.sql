-- Lot 30 : une action illegale se saisit en argent propre OU sale (avant : toujours sale)
alter table actions_illegales add column if not exists type_argent text default 'sale';
update actions_illegales set type_argent = 'sale' where type_argent is null;
