-- TYPES DE DOSSIERS : 15 types complets (nom, description affichée au client, modèle du premier message, ordre)
-- Relançable sans risque : un type déjà présent (même nom) n'est pas recréé.
insert into cabinet_dossier_types (nom, description, template, ordre)
select v.nom, v.description, v.template, v.ordre from (values
  ('Défense pénale', $$Représentation devant les tribunaux pour un délit ou un crime, de la garde à vue au jugement.$$, $$Bonjour, je souhaite ouvrir un dossier de défense pénale.

Nom RP :
Faits reprochés :
Date et lieu des faits :
Étape actuelle (garde à vue, mise en examen, audience prévue…) :
Date de la prochaine audience si elle est connue :
Documents disponibles :$$, 1),
  ('Contravention et infraction routière', $$Contestation d'une amende, d'un PV ou d'une contravention mineure.$$, $$Bonjour, je souhaite contester une contravention ou une infraction routière.

Nom RP :
Infraction ou amende reçue :
Date et lieu :
Montant de l'amende et délai de paiement :
Photo ou copie du PV si disponible :$$, 2),
  ('Comparution immédiate', $$Défense urgente lors d'une comparution immédiate. Le dossier est traité en priorité par le cabinet.$$, $$Bonjour, je suis concerné par une comparution immédiate.

Nom RP :
Chefs d'accusation :
Tribunal et heure de l'audience :
Situation en garde à vue (oui / non) :
Personne à contacter :$$, 3),
  ('Divorce et séparation', $$Divorce, séparation de corps ou séparation de biens, à l'amiable ou contentieux.$$, $$Bonjour, je souhaite engager une procédure de divorce ou de séparation.

Nom RP :
Nom RP du conjoint :
Date du mariage :
Enfants concernés (oui / non) :
Biens communs à partager :
Souhait : amiable ou contentieux ?$$, 4),
  ('Garde et droit de la famille', $$Garde d'enfants, droit de visite, pension alimentaire, reconnaissance de paternité ou de maternité.$$, $$Bonjour, je souhaite un accompagnement en droit de la famille.

Nom RP :
Nom RP de l'autre parent :
Enfant(s) concerné(s) (âge) :
Situation actuelle de la garde :
Objectif (garde, droit de visite, pension) :$$, 5),
  ('Changement de nom et état civil', $$Changement de nom RP, rectificatif d'état civil, reconnaissance ou mariage.$$, $$Bonjour, je souhaite une démarche d'état civil.

Nom RP actuel :
Nom RP souhaité :
Motif :
Documents d'identité disponibles :$$, 6),
  ('Succession et héritage', $$Partage de succession, testament, acceptation ou renonciation d'un héritage.$$, $$Bonjour, je souhaite un accompagnement pour une succession.

Nom RP du défunt :
Date du décès :
Héritiers connus :
Biens concernés (argent, biens immobiliers, entreprise) :
Testament existant (oui / non) :$$, 7),
  ('Litige commercial et contrat', $$Rédaction, vérification ou contestation d'un contrat, rupture de partenariat, litige entre sociétés.$$, $$Bonjour, je souhaite un avis ou une défense sur un contrat ou un litige commercial.

Nom RP :
Nom de l'autre partie :
Nature du contrat ou du litige :
Montant en jeu :
Documents du contrat disponibles :$$, 8),
  ('Création et gestion d''entreprise', $$Création de société, rédaction des statuts, cession de parts, dissolution, mise en conformité.$$, $$Bonjour, je souhaite créer ou gérer une entreprise.

Nom RP :
Nom de l'entreprise :
Activité :
Associés :
Démarche souhaitée (création, statuts, cession, dissolution) :$$, 9),
  ('Droit du travail', $$Licenciement, salaire impayé, litige avec un employeur ou un employé.$$, $$Bonjour, je souhaite un accompagnement en droit du travail.

Nom RP :
Employeur ou employé concerné :
Poste et ancienneté :
Problème (licenciement, salaire, conditions) :
Date du dernier événement :$$, 10),
  ('Immobilier et location', $$Achat ou vente d'un bien, bail, expulsion, litige de voisinage.$$, $$Bonjour, je souhaite un accompagnement immobilier.

Nom RP :
Bien concerné (adresse RP) :
Nature (achat, vente, bail, expulsion, voisinage) :
Partie adverse :
Montant ou loyer concerné :$$, 11),
  ('Dette et recouvrement', $$Réclamation d'une dette impayée, mise en demeure, démarche de recouvrement.$$, $$Bonjour, je souhaite récupérer une somme qui m'est due.

Nom RP :
Nom RP du débiteur :
Montant de la dette :
Origine de la dette (prêt, facture, contrat) :
Démarches déjà faites :$$, 12),
  ('Recours administratif', $$Contestation d'une décision administrative : amende, permis, saisie de véhicule, sanction.$$, $$Bonjour, je souhaite contester une décision administrative.

Nom RP :
Décision contestée :
Date de la décision :
Autorité concernée :
Délai de recours connu (oui / non) :$$, 13),
  ('Plainte et victime', $$Dépôt de plainte, suivi d'une enquête, accompagnement d'une victime.$$, $$Bonjour, je souhaite déposer une plainte ou être accompagné en tant que victime.

Nom RP :
Faits subis :
Date et lieu :
Auteur présumé (si connu) :
Preuves disponibles :$$, 14),
  ('Consultation ponctuelle', $$Avis juridique rapide, sans ouverture de procédure. Un seul rendez-vous.$$, $$Bonjour, je souhaite une consultation juridique ponctuelle.

Nom RP :
Question juridique :
Contexte en quelques lignes :
Urgence (oui / non) :$$, 15)
) as v(nom, description, template, ordre)
where not exists (select 1 from cabinet_dossier_types t where t.nom = v.nom);
