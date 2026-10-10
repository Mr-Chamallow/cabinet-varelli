-- LOT 13 : l'argent perdu / objets saisis en arrestation ne sont plus comptés en compta
delete from obsidian_comptabilite where source = 'arrestation';
