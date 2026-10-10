-- Lot 15 : catégories de stock → tags simplifiés, statuts garage valides.
update obsidian_stocks set categorie = 'objet illégal' where lower(categorie) in ('objet rare','autre','objet_illegal','objet illegal');
update obsidian_stocks set categorie = 'objet légal'   where lower(categorie) = 'radio';
update obsidian_stocks set categorie = 'kev'           where lower(categorie) = 'gilet';
update obsidian_stocks set categorie = 'composant'     where nom in ('Graine de strawberry','Fertilisant','Kit de fabrication de meth','Gaz BZ','Poudre à canon','B-Magic','Acide sulfurique','Feuilles de salvia','Branche de cannabis','Pavot','Feuilles de coca','Phosphore rouge','Pseudoéphédrine','Ammoniaque anhydre','Éther','Lithium','Prométhazine','Xylazine','Belladone','Datura','Salvia','Mexicana','Blacktrip','Spore X','Oyster rouge','Oyster bleu','Amanita rouge','Amanita vert','Psilocybe vert','Psilocybe rouge','Psilocybe violet','Moisissures spectrales','Spores de veloceps','Red fang','Ma-huang','Ladanum','Acide acétylsalicylique') and categorie in ('objet illégal','autre');
-- Garage : seuls Disponible / Sortie / Fourrière / Endommagé / Détruit existent (pas de changement automatique).
update obsidian_garage set statut = 'Sortie'    where statut = 'En mission';
update obsidian_garage set statut = 'Endommagé' where statut = 'En réparation';
