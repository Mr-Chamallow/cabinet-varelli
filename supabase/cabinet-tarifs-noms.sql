-- Noms des prestations : sans prix ni doublon (le prix reste dans la colonne "prix")
update cabinet_tarifs set nom = 'Défense juridique' where nom = 'Défense' and categorie = 'Sur devis';
update cabinet_tarifs set nom = 'Demande de mariage' where nom = 'Mariage' and categorie = 'Civil';

-- Supprime les doublons éventuels (garde la ligne la plus ancienne de chaque catégorie + nom)
delete from cabinet_tarifs t using cabinet_tarifs d
where t.categorie = d.categorie and lower(trim(t.nom)) = lower(trim(d.nom)) and t.ctid > d.ctid;

select categorie, nom, prix from cabinet_tarifs order by categorie, ordre;
