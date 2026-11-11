-- Optionnel : efface les anciens messages de l'ancien salon direction (supprimé du site)
delete from cabinet_internes where canal = 'salon:direction';
