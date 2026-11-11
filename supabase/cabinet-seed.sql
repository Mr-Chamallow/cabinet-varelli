-- Cabinet Varelli : contenu de départ (tarifs, présentation, organigramme)
-- À coller UNE FOIS dans Supabase > SQL Editor > Run. Ensuite tout se modifie depuis le site.

-- Tarifs (grille d'honoraires)
delete from cabinet_tarifs;
insert into cabinet_tarifs (categorie, nom, prix, description, ordre) values
  ('Civil', 'Mariage', '70 000 $', null, 1),
  ('Civil', 'Adoption', '70 000 $', null, 2),
  ('Civil', 'Divorce', '80 000 $', null, 3),
  ('Civil', 'Changement de nom', '100 000 $', null, 4),
  ('Effacement de casier', 'Si délits mineurs', '40 000 $', null, 5),
  ('Effacement de casier', 'Si délits majeurs', '60 000 $', null, 6),
  ('Effacement de casier', 'Si crimes', '120 000 $', null, 7),
  ('Sur devis', 'Assurance juridique', 'Sur devis', null, 8),
  ('Sur devis', 'Particuliers / Entreprises', 'Sur devis', null, 9),
  ('Sur devis', 'Poursuites judiciaires', 'Sur devis', null, 10),
  ('Sur devis', 'Défense', 'Sur devis', null, 11),
  ('Sur devis', 'Conseils', 'Sur devis', null, 12),
  ('Sur devis', 'Contrat de partenariat', 'Sur devis', null, 13),
  ('Sur devis', 'Contrat de travail', 'Sur devis', null, 14),
  ('Sur devis', 'Règlement intérieur', 'Sur devis', null, 15);

-- Présentation
insert into cabinet_pages (cle, contenu) values ('presentation', $$Cabinet Varelli & Associés

Un cabinet fondé sur une exigence simple : défendre chaque client avec rigueur, discrétion et loyauté, quelle que soit la complexité de son affaire.

Nous accompagnons particuliers et entreprises dans l'ensemble de leurs démarches juridiques : droit de la famille, changement d'identité, contentieux, défense pénale, conseils et rédaction de contrats.

Chaque dossier est suivi par un avocat désigné, qui vous informe à chaque étape. Vous échangez avec nous directement depuis votre espace client, et vous pouvez prendre rendez-vous à tout moment.

Nous ne promettons pas l'impossible. Nous vous disons la vérité sur vos chances, et nous mettons tout en œuvre pour les améliorer.

Marco Varelli, Associé Gérant$$)
on conflict (cle) do update set contenu = excluded.contenu, updated_at = now();

-- Organigramme
delete from cabinet_membres;
insert into cabinet_membres (nom_rp, poste, description, ordre) values
  ('Marco Varelli', 'Associé Gérant', 'Dirige le cabinet et attribue les dossiers.', 1),
  ('Poste à pourvoir', 'Associé Sénior', null, 2),
  ('Poste à pourvoir', 'Associé', null, 3),
  ('Poste à pourvoir', 'Collaborateur', null, 4),
  ('Poste à pourvoir', 'Secrétaire juridique', null, 5);
