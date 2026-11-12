-- Codes juridiques du cabinet (généré depuis le guide de la justice)
-- Relancer ce fichier remplace toutes les tables de codes (les retouches faites dans la base sont alors perdues).

-- Constitution des États-Unis (Bill of Rights)
drop table if exists cabinet_codes_constitution_usa;
create table cabinet_codes_constitution_usa (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_constitution_usa enable row level security;

insert into cabinet_codes_constitution_usa (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('constitution_usa_0001', 'Ier Amendement', null, 'CONSTITUTION (USA)', null, 'Le Congrès n''adoptera aucune loi relative à l''établissement d''une religion, ou à l''interdiction de son libre exercice ; ou pour limiter la liberté d''expression, de la presse ou le droit des citoyens de se réunir pacifiquement ou d''adresser au Gouvernement des pétitions pour obtenir réparations des torts subis.', null, '{}', 1),
  ('constitution_usa_0002', 'IIe Amendement', null, 'CONSTITUTION (USA)', null, 'Une milice bien organisée étant nécessaire à la sécurité d''un État libre, il ne pourra être porté atteinte au droit du peuple de détenir et de porter des armes.', null, '{armes}', 2),
  ('constitution_usa_0003', 'IIIe Amendement', null, 'CONSTITUTION (USA)', null, 'Aucune troupe ne pourra, en temps de paix, être cantonnée dans une maison privée, sans l''autorisation de son propriétaire ; en temps de guerre, le cantonnement ne pourra être effectué que conformément aux règles fixées par la loi.', null, '{}', 3),
  ('constitution_usa_0004', 'IVe Amendement', null, 'CONSTITUTION (USA)', null, 'Il ne sera pas porté atteinte au droit des citoyens d''être exempts de toute perquisition ou saisie déraisonnable concernant leur personne, leur domicile, les documents et biens leur appartenant ; aucun mandat de perquisition ne pourra être délivré s''il ne se fonde sur des motifs plausibles, s''il ne s''appuie sur des déclarations ou des affirmations sous serment et s''il ne mentionne de façon détaillée les lieux qui doivent faire l''objet de la perquisition et les personnes ou objets dont il faut s''assurer.', null, '{procedure}', 4),
  ('constitution_usa_0005', 'Ve Amendement', null, 'CONSTITUTION (USA)', null, 'Nul ne pourra répondre d''un crime capital ou infamant à moins d''avoir été inculpé ou renvoyé devant les tribunaux par un grand jury, à l''exception des poursuites engagées à l''occasion d''actes commis dans les forces armées terrestres ou navales ou dans la milice, dans le cadre d''un service actif en temps de guerre, ou de péril public ; nul ne pourra deux fois pour le même délit se trouver menacé dans sa vie ou dans sa personne ; nul ne pourra être contraint de témoigner contre lui-même dans un procès criminel, ni être privé de sa vie, de sa liberté ou de ses biens sans procédure légale régulière (due process of law) ; aucune expropriation dans l''intérêt public ne sera possible sans une juste indemnité.', null, '{armes,violence,organisation,procedure}', 5),
  ('constitution_usa_0006', 'VIe Amendement', null, 'CONSTITUTION (USA)', null, 'Lors de toute poursuite criminelle, l''accusé aura le droit d''être jugé rapidement et publiquement, par un jury impartial de l''État et du district où le crime aura été commis, le dit district ayant été préalablement déterminé par la loi ; d''être informé de la nature et des motifs des charges retenues contre lui ; d''être confronté avec les témoins à charge ; de faire citer des témoins à décharge ; et de bénéficier de l''assistance d''un avocat pour sa défense.', null, '{organisation,procedure}', 6),
  ('constitution_usa_0007', 'VIIe Amendement', null, 'CONSTITUTION (USA)', null, 'Dans les procès de droit commun (common law) où la valeur de l''objet du litige excédera vingt dollars, le droit à un jugement par jury sera maintenu, et aucun fait jugé par un jury ne pourra être réexaminé par une Cour quelconque des États-Unis autrement qu''en conformité avec les règles du droit commun (common law).', null, '{procedure}', 7),
  ('constitution_usa_0008', 'VIIIe Amendement', null, 'CONSTITUTION (USA)', null, 'Il ne pourra être exigé de caution disproportionnée, ni imposé d''amendes excessives, ni infligé de peines cruelles ou inhabituelles.', null, '{procedure}', 8),
  ('constitution_usa_0009', 'IXe Amendement', null, 'CONSTITUTION (USA)', null, 'L''énonciation dans la Constitution de certains droits ne devra pas être interprétée de façon à dénier ou à limiter d''autres droits conservés par le peuple.', null, '{}', 9),
  ('constitution_usa_0010', 'Xe Amendement', null, 'CONSTITUTION (USA)', null, 'Les pouvoirs qui ne sont pas délégués aux États-Unis par la Constitution, ni refusés par elle aux États, sont réservés aux États ou au peuple.', null, '{}', 10);

-- Constitution de l'État de San Andreas
drop table if exists cabinet_codes_constitution_sa;
create table cabinet_codes_constitution_sa (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_constitution_sa enable row level security;

insert into cabinet_codes_constitution_sa (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('constitution_sa_0001', 'Préambule', null, 'Préambule', null, 'Nous, le Peuple de l''Etat de San Andreas, reconnaissant envers Dieu Tout-Puissant pour notre liberté, afin d''assurer et de perpétuer ses bénédictions, établissons cette Constitution.', null, '{}', 1),
  ('constitution_sa_0002', 'Art. Ier · Section 1.', null, 'Article I - Déclaration des droits', null, 'Toute personne est, par nature, libre et indépendante et a des droits inaliénables. Parmi ceux-ci figurent le plaisir et la défense de la vie et de la liberté, l''acquisition, la possession et la protection de la propriété, et l''obtention de la sécurité, du bonheur et de l''intimité.', null, '{}', 2),
  ('constitution_sa_0003', 'Art. Ier · Section 2.', null, 'Article I - Déclaration des droits', null, 'Toute personne peut librement s''exprimer, écrire et publier ses opinions sur tous les sujets. Aucune loi ne peut restreindre la liberté d''expression ou de la presse.', null, '{}', 3),
  ('constitution_sa_0004', 'Art. Ier · Section 3.', null, 'Article I - Déclaration des droits', null, '(a) Le peuple a le droit d''élire ses représentants, de s''adresser au gouvernement pour obtenir réparation de ses griefs et de se réunir librement afin de se consulter pour le bien commun.', null, '{}', 4),
  ('constitution_sa_0005', 'Art. Ier · Section 3.', null, 'Article I - Déclaration des droits', null, '(b) Le peuple a le droit d’accéder aux informations concernant la conduite des affaires du peuple, et, par conséquent, les réunions des organismes publics et les écrits des agents publics et des agences d’État doivent être ouverts au contrôle du peuple, sous réserve que leur accès ne constitue pas un risque pour la sécurité des personnes ou ne porte sur des questions de confidentialité d’informations jugées sensibles.', null, '{circulation,procedure}', 5),
  ('constitution_sa_0006', 'Art. Ier · Section 4.', null, 'Article I - Déclaration des droits', null, 'Le libre exercice de la religion sans discrimination ni préférence sont garantis. Cette liberté de conscience n''excuse pas les actes licencieux ou incompatibles avec la paix ou la sécurité de l''État. La Législature ne fera aucune loi concernant l''établissement d''un culte.
Une personne ne peut pas être empêchée d''être témoin ou juré en raison de ses opinions sur les croyances religieuses.', null, '{}', 6),
  ('constitution_sa_0007', 'Art. Ier · Section 5.', null, 'Article I - Déclaration des droits', null, 'L''esclavage est interdit.', null, '{}', 7),
  ('constitution_sa_0008', 'Art. Ier · Section 6.', null, 'Article I - Déclaration des droits', null, '(a) Une personne ne peut être privée de sa vie, de sa liberté ou de ses biens sans une procédure légale régulière', null, '{procedure}', 8),
  ('constitution_sa_0009', 'Art. Ier · Section 6.', null, 'Article I - Déclaration des droits', null, '(b) Un citoyen ou une catégorie de citoyens ne peut se voir accorder des privilèges ou des immunités qui ne sont pas accordés dans les mêmes conditions à tous les citoyens ou catégories de citoyens. Les privilèges ou immunités accordés par la législature peuvent être modifiés ou révoqués.', null, '{}', 9),
  ('constitution_sa_0010', 'Art. Ier · Section 7.', null, 'Article I - Déclaration des droits', null, 'Une personne ne peut être empêchée d''exercer une profession, une vocation ou un emploi en raison de son sexe, de sa race, de ses croyances, de sa couleur ou de son origine nationale ou ethnique.', null, '{}', 10),
  ('constitution_sa_0011', 'Art. Ier · Section 8.', null, 'Article I - Déclaration des droits', null, 'Les témoins ne peuvent pas être détenus de manière déraisonnable. Une personne ne peut être emprisonnée dans une action civile pour dette ou délit.', null, '{}', 11),
  ('constitution_sa_0012', 'Art. Ier · Section 9.', null, 'Article I - Déclaration des droits', null, 'L''Habeas Corpus ne peut être suspendu que si la sécurité publique l''exige, en cas de rébellion ou d''invasion.', null, '{corruption}', 12),
  ('constitution_sa_0013', 'Art. Ier · Section 10.', null, 'Article I - Déclaration des droits', null, 'Une personne peut être libérée sur son propre engagement à la discrétion de la Cour.', null, '{procedure}', 13),
  ('constitution_sa_0014', 'Art. Ier · Section 11.', null, 'Article I - Déclaration des droits', null, 'Le droit des personnes à la sécurité de leur personne, de leurs maisons, de leurs papiers et de leurs effets contre les saisies et les perquisitions abusives ne peut être violé ; et un mandat ne peut être délivré sauf en cas de cause probable, appuyée d''un serment ou d''une affirmation solennelle, décrivant notamment le lieu à perquisitionner ainsi que les personnes et choses à saisir.', null, '{procedure}', 14),
  ('constitution_sa_0015', 'Art. Ier · Section 12.', null, 'Article I - Déclaration des droits', null, 'Les crimes sont poursuivis dans les conditions prévues par la loi, soit par mise en accusation, soit, après examen et engagement d''un magistrat, par dénonciation.', null, '{corruption}', 15),
  ('constitution_sa_0016', 'Art. Ier · Section 13.', null, 'Article I - Déclaration des droits', null, 'Des peines cruelles ou inhabituelles ne peuvent être infligées. Des amendes excessives ne peuvent être imposées.
Toutefois, la peine capitale constitue une sanction exceptionnelle autorisée par la Constitution lorsqu’elle est prononcée par la Cour Suprême de l’État de San Andreas conformément aux dispositions légales et procédurales en vigueur.', null, '{procedure}', 16),
  ('constitution_sa_0017', 'Art. Ier · Section 14.', null, 'Article I - Déclaration des droits', null, 'Dans une affaire pénale, les habitants de l’État de San Andreas ont droit à une procédure régulière et à un procès rapide et public sauf recours au huis clos dans un délai raisonnable en amont du procès uniquement.', null, '{procedure}', 17),
  ('constitution_sa_0018', 'Art. Ier · Section 15.', null, 'Article I - Déclaration des droits', null, 'Les non-citoyens ont les mêmes droits de propriété que les citoyens.', null, '{}', 18),
  ('constitution_sa_0019', 'Art. IIe · Section 1.', null, 'Article II - Vote', null, 'Tout pouvoir politique est inhérent aux habitants de l''Etat de San Andreas. Le Gouvernement est institué pour leur protection, leur sécurité et leur avantage. Ils ont le droit de le modifier ou de le réformer lorsque le bien public l''exige.', null, '{}', 19),
  ('constitution_sa_0020', 'Art. IIe · Section 2.', null, 'Article II - Vote', null, '(a) Un citoyen recensé dans l''Etat de San Andreas, âgé de 18 ans ou plus et résidant dans cet Etat peut voter.', null, '{}', 20),
  ('constitution_sa_0021', 'Art. IIe · Section 2.', null, 'Article II - Vote', null, '(b) Un électeur exclu du droit de vote, pendant qu''il purge une peine de prison d''État ou fédérale, verra son droit de vote rétabli à la fin de sa peine de prison.', null, '{procedure}', 21),
  ('constitution_sa_0022', 'Art. IIe · Section 3.', null, 'Article II - Vote', null, 'Un électeur qui vote lors d''une élection, conformément aux lois de cet État, doit voir son vote compté.', null, '{}', 22),
  ('constitution_sa_0023', 'Art. IIe · Section 4.', null, 'Article II - Vote', null, 'La Législature prévoit l''inscription et la tenue d''élections libres.', null, '{}', 23),
  ('constitution_sa_0024', 'Art. IIe · Section 5.', null, 'Article II - Vote', null, 'La Législature interdira les pratiques inappropriées qui affectent les élections et prévoira la disqualification des électeurs s''ils sont mentalement incapables ou purgent une peine de prison d''État ou fédérale suite à la condamnation pour un crime ou un délit.', null, '{procedure}', 24),
  ('constitution_sa_0025', 'Art. IIe · Section 6.', null, 'Article II - Vote', null, 'Le vote est secret.', null, '{}', 25),
  ('constitution_sa_0026', 'Art. IIIe · Section 1.', null, 'Article III - Etat de San Andreas', null, 'L''État de San Andreas est une partie inséparable des États-Unis d''Amérique et la Constitution des États-Unis est la loi suprême du pays et de cet Etat.', null, '{}', 26),
  ('constitution_sa_0027', 'Art. IIIe · Section 2.', null, 'Article III - Etat de San Andreas', null, 'Les pouvoirs du gouvernement de l''État sont législatifs, exécutifs et judiciaires. Les personnes chargées de l''exercice d''un pouvoir ne peuvent exercer dans aucun des autres, sauf dans la mesure permise par la présente Constitution.', null, '{circulation}', 27),
  ('constitution_sa_0028', 'Art. IIIe · Section 3.', null, 'Article III - Etat de San Andreas', null, 'Des poursuites peuvent être engagées contre l''État de la manière prescrite par la loi et devant les tribunaux prescrits par la loi.', null, '{procedure}', 28),
  ('constitution_sa_0029', 'Art. IIIe · Section 4.', null, 'Article III - Etat de San Andreas', null, 'L''État fédéré de San Andreas est divisé en trois comtés :
- Los Santos County, regroupant la ville de Los Santos et la localité de Chumash;
- Blaine County, regroupant les localités de Paleto Bay, Sandy Shores, Grapeseed et Harmony ;
- Cayo Perico County, correspondant à l’île de Cayo Perico, intégrée au territoire de l’État.', null, '{}', 29),
  ('constitution_sa_0030', 'Art. IVe · Section 1.', null, 'Article IV - Pouvoir Législatif', null, 'Le pouvoir législatif de cet État est dévolu au Sénat et de l''Etat de San Andreas mais le peuple se réserve les pouvoirs d''initiative et de référendum.', null, '{}', 30),
  ('constitution_sa_0031', 'Art. IVe · Section 2.', null, 'Article IV - Pouvoir Législatif', null, '(a) Le Sénat de l''Etat de San Andreas est composé de six Sénateurs.', null, '{}', 31),
  ('constitution_sa_0032', 'Art. IVe · Section 2.', null, 'Article IV - Pouvoir Législatif', null, '(b) Le Sénat de San Andreas est composé de six membres élus au suffrage universel indirect tous les trois mois par les grands électeurs de San Andreas.', null, '{}', 32),
  ('constitution_sa_0033', 'Art. IVe · Section 2.', null, 'Article IV - Pouvoir Législatif', null, '(c) Nul ne pourra être élu sénateur s''il n''a atteint l''âge de vingt-cinq ans, s''il n''est citoyen américain et citoyen de San Andreas recensé, au moment de l''élection, au sein de son État.', null, '{}', 33),
  ('constitution_sa_0034', 'Art. IVe · Section 2.', null, 'Article IV - Pouvoir Législatif', null, '(d) L’ensemble des Sénateurs élisent, parmi eux, un Président qui présidera le Sénat pendant les quatre mois de mandat.', null, '{procedure}', 34),
  ('constitution_sa_0035', 'Art. IVe · Section 2.', null, 'Article IV - Pouvoir Législatif', null, '(e) Un sénateur de l''Etat de San Andreas étant impliqué dans une affaire judiciaire ou ayant un casier judiciaire à son nom ne peut continuer d’assurer ses fonctions au sein de pouvoir législatif de notre Etat. Il pourra donc être démis de ses fonctions par le Président du Sénat.', null, '{}', 35),
  ('constitution_sa_0036', 'Art. IVe · Section 3.', null, 'Article IV - Pouvoir Législatif', null, '(a) La Législature de San Andreas a pour missions de représenter les citoyennes et les citoyens de notre Etat en proposant des lois et en les votant. Une proposition de loi est validée et peut être publiée et exécutée lorsqu’elle a été approuvée par plus de 50% des Sénateurs.', null, '{}', 36),
  ('constitution_sa_0037', 'Art. IVe · Section 3.', null, 'Article IV - Pouvoir Législatif', null, '(b) La Législature de l''Etat de San Andreas a pour mission de contrôler l''action du Gouvernement et le budget de l’Etat.', null, '{}', 37),
  ('constitution_sa_0038', 'Art. IVe · Section 3.', null, 'Article IV - Pouvoir Législatif', null, '(c) La Législature de l''Etat de San Andreas doit être consultée par le Gouverneur de cet Etat pour la nomination pour certains postes de l''administration de l’Etat de San Andreas : Juges d’Etat, Vice-Gouverneur (en cas de changement en cours de mandat).', null, '{organisation,procedure}', 38),
  ('constitution_sa_0039', 'Art. Ve · Section 1.', null, 'Article V - Pouvoir Exécutif', null, 'Le pouvoir exécutif suprême de l''État de San Andreas est exercé par le Gouverneur. Le Gouverneur veillera à l''exécution fidèle de la loi.', null, '{organisation}', 39),
  ('constitution_sa_0040', 'Art. Ve · Section 2.', null, 'Article V - Pouvoir Exécutif', null, '(a) Le Gouverneur est élu tous les trois mois au au suffrage indirect par les grands électeurs de l''Etat de San Andreas.', null, '{organisation}', 40),
  ('constitution_sa_0041', 'Art. Ve · Section 2.', null, 'Article V - Pouvoir Exécutif', null, '(b) Le Gouverneur est un électeur, âgé de 25 ans ou plus, qui a été citoyen des États-Unis et résident de cet État pendant les trois mois précédant directement l''élection du Gouverneur. Le Gouverneur ne peut exercer aucune autre fonction publique.', null, '{organisation}', 41),
  ('constitution_sa_0042', 'Art. Ve · Section 3.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur fait un bilan à la Législature sur la situation de l''État au début de chaque mois.', null, '{organisation}', 42),
  ('constitution_sa_0043', 'Art. Ve · Section 4.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur peut exiger des dirigeants des agences d''Etat et de leurs employés qu''ils fournissent des informations relatives à leurs fonctions et à leurs responsabilités.', null, '{organisation}', 43),
  ('constitution_sa_0044', 'Art. Ve · Section 5.', null, 'Article V - Pouvoir Exécutif', null, 'La loi peut conférer au Gouverneur le pouvoir d''attribuer et de réorganiser les fonctions entre les dirigeants et les agences d''Etat ainsi que leurs employés.', null, '{organisation}', 44),
  ('constitution_sa_0045', 'Art. Ve · Section 6.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur nomme les directeurs des différents départements, bureaux et agences dépendants du Gouvernement de l''Etat de San Andreas.', null, '{organisation}', 45),
  ('constitution_sa_0046', 'Art. Ve · Section 7.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur sera commandant en chef des forces du maintien de l’ordre et de la milice de l’Etat quand ceux-ci seront appelés au service actif du Gouvernement. Il nommera le principal fonctionnaire de chacun des services publics.', null, '{corruption,organisation}', 46),
  ('constitution_sa_0047', 'Art. Ve · Section 8.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur a un droit de veto sur toute proposition de loi émanant de la Législature de l''Etat de San Andreas. Ce droit de veto doit être utilisé pendant les procédures de vote de loi et peut être outrepassé par un vote au deux-tiers de chaque chambre de la Législature.', null, '{organisation,procedure}', 47),
  ('constitution_sa_0048', 'Art. Ve · Section 9.', null, 'Article V - Pouvoir Exécutif', null, 'Le Vice-Gouverneur assiste le Gouverneur dans l''exercice de ses fonctions et assure la coordination des actions gouvernementales. Il peut superviser certaines agences et départements d’Etat selon les délégations de pouvoir accordées par le Gouverneur.', null, '{organisation}', 48),
  ('constitution_sa_0049', 'Art. Ve · Section 10.', null, 'Article V - Pouvoir Exécutif', null, 'Le Vice-Gouverneur devient Gouverneur lorsqu''une vacance survient au poste de Gouverneur.
Le Vice-Gouverneur agit en tant que Gouverneur pendant la destitution, l''absence de l''État ou toute autre incapacité temporaire du Gouverneur ou d''un Gouverneur élu qui n''a pas pris ses fonctions.
La Législature établit un ordre de préséance après le Vice-Gouverneur pour la succession au poste de Gouverneur et pour l''exercice temporaire des fonctions du Gouverneur.
La Cour Suprême de cet Etat a la compétence exclusive pour trancher toutes les questions soulevées par la présente section.', null, '{organisation,procedure}', 49),
  ('constitution_sa_0050', 'Art. Ve · Section 11.', null, 'Article V - Pouvoir Exécutif', null, 'Sous réserve des pouvoirs et des devoirs du Gouverneur, le Procureur Général est le premier magistrat de l''État. Le Procureur Général supervise directement chaque procureur de comté, sheriff et autres agents chargés de l''application des lois. Lorsque l''intérêt public l''exige ou que le Gouverneur l''exige, le Procureur Général assiste tout procureur de comté dans l''exercice de ses fonctions.', null, '{corruption,organisation,procedure}', 50),
  ('constitution_sa_0051', 'Art. Ve · Section 12.', null, 'Article V - Pouvoir Exécutif', null, 'Le Gouverneur de l’Etat de San Andreas peut être destitué de ses fonctions si il est reconnu coupable d’un crime durant l’exercice de ses fonctions ou en cas de faute grave remettant en cause sa capacité de gouverner.', null, '{organisation}', 51),
  ('constitution_sa_0052', 'Art. VIe · Section 1.', null, 'Article VI - Pouvoir Judiciaire', null, 'Le pouvoir judiciaire de cet État est exercé par la Cour Suprême, les cours d''appel et les cours supérieures.', null, '{procedure}', 52),
  ('constitution_sa_0053', 'Art. VIe · Section 2.', null, 'Article VI - Pouvoir Judiciaire', null, 'La Cour Suprême se compose du Juge Président de San Andreas et de plusieurs juges associés. Le Juge Président peut convoquer la Cour à tout moment.', null, '{procedure}', 53),
  ('constitution_sa_0054', 'Art. VIe · Section 3.', null, 'Article VI - Pouvoir Judiciaire', null, 'Le Juge Président et/ou les juges associés, dans la mesure ou l''un de ces postes est vacant, sont nommés à vie par le Gouverneur en exercice avec approbation de la Législature de l''Etat de San Andreas.', null, '{organisation,procedure}', 54),
  ('constitution_sa_0055', 'Art. VIe · Section 4.', null, 'Article VI - Pouvoir Judiciaire', null, 'Une personne n''est pas éligible pour être juge d''une Cour à moins que pendant les deux semaines précédant immédiatement sa sélection, la personne ait été membre du barreau de l''État ou ait servi en tant que juge d''une Cour dans cet État.', null, '{procedure}', 55),
  ('constitution_sa_0056', 'Art. VIe · Section 5.', null, 'Article VI - Pouvoir Judiciaire', null, 'La Législature prévoit la retraite, avec une allocation raisonnable, des juges des cours pour l''âge ou l''invalidité.', null, '{procedure}', 56),
  ('constitution_sa_0057', 'Art. VIe · Section 6.', null, 'Article VI - Pouvoir Judiciaire', null, 'Un juge servant au sein de la Cour Suprême de l’Etat de San Andreas peut être destitué de ses fonctions si il est reconnu coupable d’un crime durant l’exercice de ses fonctions ou en cas de faute grave.', null, '{procedure}', 57),
  ('constitution_sa_0058', 'Art. VIe · Section 7.', null, 'Article VI - Pouvoir Judiciaire', null, 'Le Barreau de l''État de San Andreas est une société publique. Toute personne admise et autorisée à exercer le droit dans cet État est et sera membre du barreau de l''État, sauf pendant qu''elle exerce ses fonctions en tant que juge dans une Cour.', null, '{procedure}', 58),
  ('constitution_sa_0059', 'Art. VIe · Section 8.', null, 'Article VI - Pouvoir Judiciaire', null, 'Les constatations, déclarations et témoignages effectués par un agent des forces de l’ordre dans l’exercice de ses fonctions peuvent être reconnus comme des éléments de preuve recevables lorsqu’ils interviennent dans le cadre d’un flagrant délit.
La parole d’un agent des forces de l’ordre bénéficie, dans ce cadre, d’une présomption de crédibilité jusqu’à preuve contraire lorsqu’elle concerne des faits directement constatés par celui-ci.
Cette présomption s’exerce dans le respect du droit à la défense, du principe du contradictoire et de la présomption d’innocence.', null, '{procedure}', 59),
  ('constitution_sa_0060', 'Art. VIIe · Section 1.', null, 'Article VII - Référendum', null, 'Le référendum est une procédure permettant au peuple de San Andreas de se prononcer directemet sur un texte ou une question d''intérêt général.', null, '{procedure}', 60),
  ('constitution_sa_0061', 'Art. VIIe · Section 2.', null, 'Article VII - Référendum', null, 'Le Gouvernement peut soumettre au peuple, par voie de référendum, toute question ou projet d''intérêt général relevant de sa compétence. Les conditions d''organisation et les effets juridiques de ces référendums sont définis par la loi.', null, '{organisation}', 61),
  ('constitution_sa_0062', 'Art. VIIe · Section 3.', null, 'Article VII - Référendum', null, 'Tout citoyen peut proposer l''organisation d''un référendum d''initiative citoyenne. Les modalités de recevabilité, de soutien et d''organisation sont définies par la loi.', null, '{organisation}', 62);

-- Code de l'aviation civile
drop table if exists cabinet_codes_aviation;
create table cabinet_codes_aviation (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_aviation enable row level security;

insert into cabinet_codes_aviation (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('aviation_0001', '1101', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Définitions', 'Est considéré comme aéronef tout appareil capable de s’élever dans l’atmosphère et de s’y déplacer, avec ou sans équipage.', null, '{circulation}', 1),
  ('aviation_0002', '1102', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Définitions', 'La circulation des aéronefs civils est libre dans l’espace aérien relevant de la juridiction de l’Etat de San Andreas, sous réserve du respect des dispositions du présent Code et des mesures de sécurité publique.', null, '{circulation}', 2),
  ('aviation_0003', '1201', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Le pilotage d’un aéronef nécessite la reconnaissance préalable de l’aptitude médicale et psychologique du candidat. Cette aptitude est évaluée par un service médical agréé par l’Etat de San Andreas.', null, '{circulation}', 3),
  ('aviation_0004', '1202', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Nul ne peut piloter un aéronef civil sans être titulaire d’un brevet de pilotage valide.', null, '{circulation}', 4),
  ('aviation_0005', '1203', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Le brevet de pilotage est délivré par des organismes de formation agréés par l’Etat de San Andreas.', null, '{circulation}', 5),
  ('aviation_0006', '1204', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Les brevets de pilotage comportent les habilitations suivantes :
- civile : usage privé et non commercial,
- professionnelle : usage commercial ou professionnel,
- secours et sécurité : usage par les services publics.
Les habilitations peuvent être cumulées. 
Le brevet de pilotage est valable pour l’ensemble des aéronefs civils, sous réserve des limitations propres à chaque habilitation.', null, '{circulation}', 6),
  ('aviation_0007', '1205', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Le brevet de pilotage comprend :
- une épreuve théorique destinée à vérifier les connaissances réglementaires et de sécurité,
- une épreuve pratique, d''une durée d''environ quinze (15) minutes, destinée à évaluer l’aptitude à piloter un aéronef.', null, '{circulation}', 7),
  ('aviation_0008', '1206', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Brevet de pilotage', 'Le prix du passage du permis aerien s''élève à 15,000$', null, '{circulation}', 8),
  ('aviation_0009', '1301', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du pilote et  sécurité aérienne', 'Le pilote est responsable de la sécurité de l’aéronef, de ses occupants et des personnes au sol.', null, '{}', 9),
  ('aviation_0010', '1302', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du pilote et  sécurité aérienne', 'Avant chaque départ, le pilote doit s’assurer :
- de la conformité et du bon état de l’appareil,
- de la présence des équipements de sécurité obligatoires,
- de la compatibilité des conditions météorologiques avec la trajectoire de vol prévue.', null, '{vol}', 10),
  ('aviation_0011', '1303', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du pilote et  sécurité aérienne', 'Il est interdit de stationner un aéronef sur des hélipads ou zones d’atterrissage réservés aux services publics ou aux infrastructures sensibles. Cette interdiction ne s’applique pas en cas d’atterrissage d’urgence dûment justifié par une panne ou un danger immédiat.', null, '{circulation}', 11),
  ('aviation_0012', '2101', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'L’espace aérien de l’Etat de San Andreas est divisé en :
- zones libres (ZL),
- zones réglementées (ZR),
- zones interdites (ZI).
Tout aéronef à l''interdiction de survoler les bâtiments appartenant aux services publics', null, '{circulation}', 12),
  ('aviation_0013', '2101.1', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Bâtiments concernés par cette interdiction : Postes du BCSD, SAHP, LSPD, LSMD BCMD, Gouvernement, les mairies.', null, '{}', 13),
  ('aviation_0014', '2101.2', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Ne sont pas concernés par cette interdiction : les services publics, membres de la Mairie des mairies, et membres de la Cour Suprême.
Est autorisé pour un civil d’atterrir sur un bâtiment de services publics : si l’aéronef se situe en situation de danger et doit atterrir de toute urgence.', null, '{procedure,etat_urgence}', 14),
  ('aviation_0015', '2102', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Les zones libres correspondent aux espaces non soumis à des restrictions particulières, sous réserve des règles générales de sécurité.', null, '{}', 15),
  ('aviation_0016', '2103', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Dans les zones réglementées, les aéronefs doivent respecter les altitudes et trajectoires réglementaires. Ils ne peuvent voler plus bas que les points culminants des bâtiments.', null, '{circulation}', 16),
  ('aviation_0017', '2104', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Le survol des zones interdites est prohibé pour les aéronefs civils et commerciaux. Des dérogations peuvent être accordées aux aéronefs des services publics lorsqu’ils y sont expressément autorisés.', null, '{circulation}', 17),
  ('aviation_0018', '2105', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Certaines zones fortement urbanisées peuvent être qualifiées de zones dangereuses. Leur survol est autorisé mais fortement déconseillé.', null, '{}', 18),
  ('aviation_0019', '2106', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 1 - Classification de l’espace aérien', 'Les zones réglementées, interdites et dangereuses sont déterminées par décret du Gouvernement de l’Etat de San Andreas.', null, '{}', 19),
  ('aviation_0020', '2201', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 2 - Aéroports et infrastructures', 'L''aéroport international de Los Santos est habilité à accueillir les vols civils et commerciaux.', null, '{}', 20),
  ('aviation_0021', '2202', 'PARTIE I', 'Titre II Espace aérien et zonage', 'Chapitre 2 - Aéroports et infrastructures', 'Les aéroports de Sandy Shores et de Grapeseed sont habilitées à accueillir les vols civils.', null, '{}', 21),
  ('aviation_0022', '3101', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre unique', 'En cas de danger grave ou de circonstances exceptionnelles, le Gouvernement de l’Etat de San Andreas ou une Mairie de comté peut ordonner l’interdiction temporaire de tout décollage d’aéronefs civils dans sa juridiction.', null, '{}', 22),
  ('aviation_0023', '3102', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre unique', 'En cas de suspension temporaire de toute activité aérienne, tout aéronef en vol doit alors rejoindre l’aéroport ou l’aérodrome le plus proche et atterrir sans délai.', null, '{vol,circulation}', 23),
  ('aviation_0024', '3103', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre unique', 'Les aéronefs des services publics ne sont pas soumis à ces interdictions, sauf stipulation expresse contraire.
Texte
Titre', null, '{circulation}', 24),
  ('aviation_0025', '4101', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Tout aéronef est réputé immatriculé dès lors qu’un certificat d’immatriculation valide a été produit et peut être présenté. À défaut de production de ce document dans un délai de quarante-huit (48) heures suivant l’acquisition auprès d’une mairie de comté, l’aéronef est considéré comme non immatriculé et constitue une infraction.', null, '{circulation}', 25),
  ('aviation_0026', '4102', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Est considéré comme stationnement interdit, et constitue une infraction, le fait, pour tout pilote d''aéronef, de le stationner sur la voie publique ou sur des emplacements non prévus à cet effet.
Les exceptions faites pour les hélicoptères sont autorisées à atterrir sur une propriété privée, uniquement avec l''accord du propriétaire. L''aire d''atterrissage doit être dégagée et offrir un espace libre d''au moins 25 mètres de circonférence autour de l''appareil, ou avoir une distance minimum de 100 mètres d''une habitation ou lieu touristique.', null, '{circulation,ordre_public}', 26),
  ('aviation_0027', '4103', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Tout bloquage des zones d''atterrissage ou de décollage par un aéronef est reconnu comme entrave au trafic aérien et constitue une infraction.', null, '{corruption,circulation,organisation}', 27),
  ('aviation_0028', '4014', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Le fait d’abandonner, sur une piste ou sur un tarmac d’aéroport, un aéronef, ou le fait de laisser un aéronef stationné, sans pilote et sans autorisation de stationnement est reconnu comme abandon d''aéronef et constitue une infraction.', null, '{circulation}', 28);

-- Code civil
drop table if exists cabinet_codes_civil;
create table cabinet_codes_civil (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_civil enable row level security;

insert into cabinet_codes_civil (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('civil_0001', '1101', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 1 - Personnalité juridique', 'Toute personne physique dispose de la personnalité juridique et est titulaire de droits et d’obligations civils.', null, '{}', 1),
  ('civil_0002', '1102', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 1 - Personnalité juridique', 'La personnalité juridique de la personne physique prend fin à son décès, constaté conformément aux règles en vigueur.', null, '{}', 2),
  ('civil_0003', '1103', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 1 - Personnalité juridique', 'Les personnes morales légalement constituées en vertu des lois de l’Etat de San Andreas ou reconnues par celui-ci disposent de la personnalité juridique. Elles exercent leurs droits civils et assument leurs obligations dans les limites fixées par la loi, leur objet social et l’ordre public.', null, '{}', 3),
  ('civil_0004', '1104', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 1 - Personnalité juridique', 'Toutes les personnes jouissent des mêmes droits civils sans distinction fondée sur l’origine, le sexe, la nationalité, la religion, l’opinion ou toute autre considération protégée par les Constitutions des Etats-Unis d''Amérique et de l''Etat de San Andreas.', null, '{environnement}', 4),
  ('civil_0005', '1201', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 2 - Capacité juridique', 'Toute personne juridiquement capable peut exercer seule ses droits civils et contracter des obligations.', null, '{}', 5),
  ('civil_0006', '1202', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 2 - Capacité juridique', 'La majorité civile est fixée à dix-huit (18) ans. À compter de cet âge, la personne est présumée pleinement capable d’exercer l’ensemble de ses droits civils, sauf disposition contraire.', null, '{}', 6),
  ('civil_0007', '1203', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 2 - Capacité juridique', 'Les personnes mineures disposent de la capacité juridique dans les limites prévues par la loi. Elles ne peuvent exercer seules que les droits expressément reconnus comme compatibles avec leur âge et leur discernement.', null, '{}', 7),
  ('civil_0008', '1204', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 2 - Capacité juridique', 'Toute personne est présumée capable tant qu’aucune décision judiciaire définitive n’a établi le contraire.', null, '{}', 8),
  ('civil_0009', '1301', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'Une personne peut être déclarée juridiquement incompétente lorsqu’une altération durable ou temporaire de ses facultés mentales l’empêche d’exercer ses droits civils de manière éclairée. Cette déclaration ne peut résulter que d’une décision judiciaire motivée.', null, '{}', 9),
  ('civil_0010', '1302', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'La déclaration d’incompétence limite la capacité d’exercer certains droits civils, dans la stricte mesure nécessaire à la protection de la personne concernée.', null, '{}', 10),
  ('civil_0011', '1303', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'La tutelle ou la curatelle est instituée par décision judiciaire. Le juge détermine l’étendue des pouvoirs du tuteur ou du curateur, les actes nécessitant une autorisation préalable et les modalités de contrôle de la mesure.', null, '{procedure}', 11),
  ('civil_0012', '1304', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'Le représentant légal agit exclusivement dans l’intérêt de la personne protégée. Il engage sa responsabilité civile en cas de faute, de négligence ou d’abus de pouvoir.', null, '{environnement}', 12),
  ('civil_0013', '1305', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'Toute mesure de protection peut être révisée, modifiée ou levée par le juge si les circonstances le justifient.', null, '{procedure}', 13),
  ('civil_0014', '1306', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 3 - Incapacité, incompétence mentale et protection judiciaire', 'La personne protégée demeure civilement responsable des dommages qu’elle cause, conformément aux règles de la Common Law relatives à la responsabilité civile.', null, '{environnement}', 14),
  ('civil_0015', '1401', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 4 - Protection civile de la personne et des droits fondamentaux', 'Toute personne bénéficie d’une protection civile contre les atteintes illicites à son intégrité physique, sa liberté individuelle, sa dignité, sa vie privée, sa réputation.', null, '{violence}', 15),
  ('civil_0016', '1402', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 4 - Protection civile de la personne et des droits fondamentaux', 'Les atteintes à l’intégrité physique ouvrent droit à réparation civile conformément aux règles applicables en matière de torts.', null, '{}', 16),
  ('civil_0017', '1403', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 4 - Protection civile de la personne et des droits fondamentaux', 'Toute atteinte injustifiée à l’honneur ou à la réputation d’une personne peut donner lieu à une action civile en diffamation.', null, '{}', 17),
  ('civil_0018', '1404', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 4 - Protection civile de la personne et des droits fondamentaux', 'Toute personne a droit au respect de sa vie privée. Les atteintes à ce droit sont appréciées au regard des principes de la Common Law et des garanties constitutionnelles.', null, '{}', 18),
  ('civil_0019', '1405', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 4 - Protection civile de la personne et des droits fondamentaux', 'Nul ne peut être privé de sa liberté individuelle sans procédure légale régulière.', null, '{procedure}', 19),
  ('civil_0020', '1501', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 5 - Recensement et statut civique', 'Toute personne résidant sur le territoire de l’Etat de San Andreas, qu’elle soit citoyenne des Etats-Unis ou résidente légalement admise, est tenue de se faire recenser auprès des services de l’Etat à compter de l’âge de dix-huit (18) ans.', null, '{}', 20),
  ('civil_0021', '1502', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 5 - Recensement et statut civique', 'Le recensement a pour objet l’identification administrative des résidents de l’Etat, l’exercice effectif des droits civiques et civils, l’accès aux services publics et aux procédures administratives de l’Etat.', null, '{procedure}', 21),
  ('civil_0022', '1503', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 5 - Recensement et statut civique', 'Le recensement permet notamment l’exercice du droit de vote lorsque celui-ci est applicable, l’accès à l’emploi public ou aux activités réglementées par l’Etat, l’accomplissement des démarches civiles nécessitant une identification officielle.', null, '{}', 22),
  ('civil_0023', '1504', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 5 - Recensement et statut civique', 'L’absence de recensement peut entraîner, dans les conditions prévues par la loi la suspension ou la limitation de certains droits ou démarches civiles, l’impossibilité temporaire d’accéder à certains services administratifs. Les modalités de contrôle et les sanctions applicables sont définies par les lois ou règlements compétents.', null, '{procedure}', 23),
  ('civil_0024', '1505', null, 'Titre I Droits civils et capacité juridique', 'Chapitre 5 - Recensement et statut civique', 'Aucune disposition relative au recensement ne peut être appliquée en violation des droits et garanties constitutionnels, notamment ceux relatifs à l''application régulière de la loi (due process of law) et à l’égalité devant la loi.', null, '{}', 24),
  ('civil_0025', '2101', null, 'Titre II Droit de la famille', 'Chapitre 1 - Principes généraux', 'Le droit de la famille régit les relations juridiques résultant du mariage, de l’union civile, de la filiation et de l’autorité parentale, sous réserve des garanties constitutionnelles.', null, '{}', 25),
  ('civil_0026', '2102', null, 'Titre II Droit de la famille', 'Chapitre 1 - Principes généraux', 'Dans toute décision concernant un enfant mineur, l’intérêt supérieur de l’enfant constitue une considération primordiale.', null, '{}', 26),
  ('civil_0027', '2201', null, 'Titre II Droit de la famille', 'Chapitre 2 - Mariage', 'Le mariage est une union civile contractée librement entre deux personnes juridiquement capables.', null, '{}', 27),
  ('civil_0028', '2202', null, 'Titre II Droit de la famille', 'Chapitre 2 - Mariage', 'Le mariage requiert la majorité révolue et le consentement libre et éclairé des parties.', null, '{}', 28),
  ('civil_0029', '2203', null, 'Titre II Droit de la famille', 'Chapitre 2 - Mariage', 'Le mariage est interdit entre parents en ligne directe, ainsi qu’entre frères et sœurs consanguins, utérins ou même résultant d’une procédure d’adoption.', null, '{procedure}', 29),
  ('civil_0030', '2204', null, 'Titre II Droit de la famille', 'Chapitre 2 - Mariage', 'Toute personne qui veut se remarier doit établir que son précédent mariage a été annulé ou dissous. La mort provoque la dissolution automatique du contrat de mariage.', null, '{}', 30),
  ('civil_0031', '2205', null, 'Titre II Droit de la famille', 'Chapitre 2 - Mariage', 'L’officiant examine si :
1) La demande a été déposée régulièrement.
2) L’identité des fiancés a été établie.
3) Les conditions du mariage sont remplies.
Si toutes les conditions sont remplies, l’officiant demande séparément aux fiancés s’ils veulent s’unir par les liens du mariage. Il demande ensuite si personne ne s’oppose à cette union matrimoniale. 
Si les deux fiancés acquiescent et que personne n’a d’objection fondée à opposer à l’union, les fiancés sont déclarés unis par les liens sacrés du mariage.', null, '{}', 31),
  ('civil_0032', '2301', null, 'Titre II Droit de la famille', 'Chapitre 3 - Dissolution du mariage  ou divorce', 'Un mariage peut être annulé par décision judiciaire :
1) Si l’un des époux était incapable de discernement au moment du mariage.
2) L’un des époux était déjà marié au moment de la célébration.
3) Lorsque le mariage est interdit en raison de la nature d’un lien de parenté ou d’alliance avec un enfant du conjoint.', null, '{}', 32),
  ('civil_0033', '2302', null, 'Titre II Droit de la famille', 'Chapitre 3 - Dissolution du mariage  ou divorce', 'La dissolution du mariage ne peut être prononcée que par une juridiction compétente.', null, '{}', 33),
  ('civil_0034', '2303', null, 'Titre II Droit de la famille', 'Chapitre 3 - Dissolution du mariage  ou divorce', 'Le divorce peut être prononcé par consentement mutuel ou de manière contentieuse.', null, '{}', 34),
  ('civil_0035', '2304', null, 'Titre II Droit de la famille', 'Chapitre 3 - Dissolution du mariage  ou divorce', 'La juridiction statue sur les effets du divorce conformément à la loi et à l’équité.', null, '{}', 35),
  ('civil_0036', '2305', null, 'Titre II Droit de la famille', 'Chapitre 3 - Dissolution du mariage  ou divorce', 'Pour décider si une contribution d’entretien doit être allouée, la juridiction, dans le cas d''un litige, examine :
1) La durée du mariage.
2) Le niveau de vie des époux.
3) L’ampleur et de la prise en charge des enfants.
4) Les perspectives de gains des époux.', null, '{}', 36),
  ('civil_0037', '2401', null, 'Titre II Droit de la famille', 'Chapitre 4 - Filiation et autorité parentale', 'La filiation établit un lien juridique entre l’enfant et ses parents, indépendamment du statut matrimonial.', null, '{}', 37),
  ('civil_0038', '2402', null, 'Titre II Droit de la famille', 'Chapitre 4 - Filiation et autorité parentale', 'L’autorité parentale est exercée dans l’intérêt de l’enfant et inclut la protection, l’éducation et la prise de décisions essentielles.', null, '{}', 38),
  ('civil_0039', '2403', null, 'Titre II Droit de la famille', 'Chapitre 4 - Filiation et autorité parentale', 'Les parents sont civilement responsables des actes de leurs enfants mineurs dans les conditions prévues par la Common Law.', null, '{}', 39),
  ('civil_0040', '2501', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'L’adoption est prononcée par décision judiciaire.', null, '{}', 40),
  ('civil_0041', '2502', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'Toute adoption est subordonnée à une évaluation du foyer et à l’intérêt supérieur de l’enfant.', null, '{}', 41),
  ('civil_0042', '2503', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'Les dispositions sur l’adoption restent applicables si l’enfant devient majeur.', null, '{}', 42),
  ('civil_0043', '2504', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'Une personne peut adopter un mineur à condition d’avoir 25 ans révolus et de disposer d’un casier judiciaire vierge de tout crime.', null, '{}', 43),
  ('civil_0044', '2505', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'La différence d’âge entre l’adoptant et le mineur ne peut être inférieure à 10 ans ni supérieure à 55 ans. Des exceptions sont possibles si le bien de l’enfant le commande.', null, '{}', 44),
  ('civil_0045', '2506', null, 'Titre II Droit de la famille', 'Chapitre 5 - Adoption', 'Un nouveau prénom d’usage peut être donné lors de la procédure d’adoption.', null, '{procedure}', 45),
  ('civil_0046', '3101', null, 'Titre III Droit de propriété', 'Chapitre 1 - Principes généraux du droit de propriété', 'Le droit de propriété est le droit légalement reconnu d’user, de jouir et de disposer d’un bien, dans les limites prévues par la Constitution, la loi et la Common Law.', null, '{}', 46),
  ('civil_0047', '3102', null, 'Titre III Droit de propriété', 'Chapitre 1 - Principes généraux du droit de propriété', 'Le droit de propriété est garanti par la Constitution des Etats-Unis et la Constitution de l’Etat de San Andreas. Nul ne peut être privé de sa propriété sans procédure légale régulière.', null, '{procedure}', 47),
  ('civil_0048', '3103', null, 'Titre III Droit de propriété', 'Chapitre 1 - Principes généraux du droit de propriété', 'Le droit de propriété peut appartenir à une personne physique, à une personne morale, à plusieurs personnes conjointement.', null, '{}', 48),
  ('civil_0049', '3104', null, 'Titre III Droit de propriété', 'Chapitre 1 - Principes généraux du droit de propriété', 'L’exercice du droit de propriété est soumis aux lois et règlements en vigueur, aux droits d’autrui, aux impératifs d’intérêt public.', null, '{}', 49),
  ('civil_0050', '3201', null, 'Titre III Droit de propriété', 'Chapitre 2 - Classification des biens', 'Sont considérés comme biens immobiliers les terrains, les constructions et améliorations fixées au sol.', null, '{}', 50),
  ('civil_0051', '3202', null, 'Titre III Droit de propriété', 'Chapitre 2 - Classification des biens', 'Sont considérés comme biens mobiliers les biens corporels non fixés au sol, les véhicules, les biens incorporels et droits patrimoniaux, sauf disposition contraire.', null, '{circulation}', 51),
  ('civil_0052', '3203', null, 'Titre III Droit de propriété', 'Chapitre 2 - Classification des biens', 'Le transfert de propriété d''un bien s’opère conformément à l’intention des parties et aux formalités prévues par la loi. Le transfert est opposable aux tiers après enregistrement légal.', null, '{}', 52),
  ('civil_0053', '3204', null, 'Titre III Droit de propriété', 'Chapitre 2 - Classification des biens', '.Toute œuvre de l’esprit est protégée au titre de la propriété intellectuelle. Sont, entre autres, considérées comme des œuvres de l’esprit, les œuvres artistiques, littéraires, scientifiques, les productions journalistiques. Tout non-respect de l’article 2 du présent décret constitue une atteinte à la propriété intellectuelle et pourra faire l’objet de poursuite judiciaire par l’ayant droit.', 'Applicable uniquement à Los Santos.', '{procedure,environnement}', 53),
  ('civil_0054', '3205', null, 'Titre III Droit de propriété', 'Chapitre 2 - Classification des biens', 'Le créateur·rice d’une œuvre en est le titulaire exclusif. Toute reproduction, diffusion ou exploitation d’une œuvre nécessite l’autorisation de l’ayant droit.', 'Applicable uniquement à Los Santos.', '{}', 54),
  ('civil_0055', '3301', null, 'Titre III Droit de propriété', 'Chapitre 3 - Possession et occupation', 'La possession est l’exercice de fait d’un pouvoir sur un bien avec l’intention de se comporter comme titulaire du droit.', null, '{}', 55),
  ('civil_0056', '3302', null, 'Titre III Droit de propriété', 'Chapitre 3 - Possession et occupation', 'Toute occupation d’un bien sans droit ni titre constitue une atteinte au droit de propriété, sous réserve des exceptions prévues par la loi.', null, '{}', 56),
  ('civil_0057', '3401', null, 'Titre III Droit de propriété', 'Chapitre 4 - Protection du droit de propriété', 'Le titulaire d’un droit de propriété peut exercer toute action civile nécessaire à la protection de son bien.', null, '{}', 57),
  ('civil_0058', '3402', null, 'Titre III Droit de propriété', 'Chapitre 4 - Protection du droit de propriété', 'Toute atteinte illicite au droit de propriété ouvre droit à réparation conformément aux règles de la responsabilité civile.', null, '{}', 58),
  ('civil_0059', '3403', null, 'Titre III Droit de propriété', 'Chapitre 4 - Protection du droit de propriété', 'L’expropriation ou la réquisition d’un bien ne peut intervenir que pour un usage public, selon une procédure légale régulière, moyennant une compensation équitable.', null, '{procedure}', 59),
  ('civil_0060', '4101', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Les personnes juridiquement capables peuvent contracter librement.', null, '{}', 60),
  ('civil_0061', '4102', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Un contrat valide requiert une offre, une acceptation et une contrepartie.', null, '{}', 61),
  ('civil_0062', '4103', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Pour qu''un contrat soit valide, toute partie contractante doit être juridiquement capable. Le consentement doit être libre de toute contrainte, fraude ou erreur substantielle.', null, '{fraude}', 62),
  ('civil_0063', '4104', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Les contrats sont exécutés de bonne foi.', null, '{}', 63),
  ('civil_0064', '4105', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'L’inexécution contractuelle ouvre droit aux recours prévus par la Common Law.', null, '{}', 64),
  ('civil_0065', '4106', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Le contrat peut être résolu en cas de manquement substantiel.', null, '{}', 65),
  ('civil_0066', '4107', null, 'Titre IV Droit des contrats', 'Chapitre unique', 'Un contrat contraire à l’ordre public ou à la loi est nul.', null, '{}', 66),
  ('civil_0067', '5101', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'Toute personne qui cause un dommage à autrui engage sa responsabilité civile.', null, '{}', 67),
  ('civil_0068', '5102', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'La responsabilité civile est fondée sur la faute, la négligence, la responsabilité objective, selon les cas.', null, '{}', 68),
  ('civil_0069', '5103', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'Constituent des torts les atteintes illicites aux personnes, aux biens ou aux droits.', null, '{}', 69),
  ('civil_0070', '5104', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'La négligence est caractérisée par le manquement à une obligation de prudence raisonnable.', null, '{}', 70),
  ('civil_0071', '5105', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'Le dommage peut être matériel, corporel ou moral.', null, '{}', 71),
  ('civil_0072', '5106', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'La réparation vise à replacer la victime dans la situation où elle se serait trouvée sans le dommage.', null, '{}', 72),
  ('civil_0073', '5107', null, 'Titre V Responsabilité civile', 'Chapitre unique', 'Les dommages-intérêts peuvent être compensatoires ou punitifs selon les règles applicables.', null, '{}', 73),
  ('civil_0074', '6101', null, 'Titre VI Procédures civiles', 'Chapitre 1 - Principes généraux de la  procédure civile', 'Toute personne dispose du droit d’introduire une action civile devant une juridiction compétente pour la protection de ses droits et intérêts légitimes.', null, '{procedure}', 74),
  ('civil_0075', '6102', null, 'Titre VI Procédures civiles', 'Chapitre 1 - Principes généraux de la  procédure civile', 'Toute procédure civile doit respecter les principes du due process of law, notamment le droit d’être entendu, le droit à une décision impartiale, le droit à une procédure contradictoire.', null, '{procedure}', 75),
  ('civil_0076', '6103', null, 'Titre VI Procédures civiles', 'Chapitre 1 - Principes généraux de la  procédure civile', 'Les audiences civiles sont publiques, sauf exception justifiée par la loi ou la protection de la vie privée, de l’ordre public ou des intérêts supérieurs de la justice.', null, '{procedure}', 76),
  ('civil_0077', '6104', null, 'Titre VI Procédures civiles', 'Chapitre 1 - Principes généraux de la  procédure civile', 'Les parties disposent de droits procéduraux égaux et bénéficient des mêmes garanties devant la juridiction saisie.', null, '{procedure}', 77),
  ('civil_0078', '6201', null, 'Titre VI Procédures civiles', 'Chapitre 2 - Compétence et juridiction', 'Les juridictions civiles de l’Etat de San Andreas sont compétentes pour connaître des litiges de nature civile, sauf attribution expresse à une autre juridiction.', null, '{procedure}', 78),
  ('civil_0079', '6202', null, 'Titre VI Procédures civiles', 'Chapitre 2 - Compétence et juridiction', 'La compétence territoriale est déterminée par le domicile ou la résidence de la partie de la défense, le lieu du fait générateur du litige, le lieu d’exécution de l’obligation, selon les cas.', null, '{procedure}', 79),
  ('civil_0080', '6203', null, 'Titre VI Procédures civiles', 'Chapitre 2 - Compétence et juridiction', 'La compétence matérielle est déterminée par la nature du litige et le montant de la demande, conformément aux lois applicables.', null, '{procedure}', 80),
  ('civil_0081', '6301', null, 'Titre VI Procédures civiles', 'Chapitre 3 - Introduction de l’instance', 'L’instance civile est introduite par le dépôt d’une demande conforme aux formes prévues par la loi ou les règles de procédure applicables.', null, '{procedure}', 81),
  ('civil_0082', '6302', null, 'Titre VI Procédures civiles', 'Chapitre 3 - Introduction de l’instance', 'Toute partie doit être valablement informée de l’introduction d’une instance et des prétentions formulées contre elle.', null, '{procedure}', 82),
  ('civil_0083', '6303', null, 'Titre VI Procédures civiles', 'Chapitre 3 - Introduction de l’instance', 'Les parties peuvent se faire assister ou représenter par un avocat ou toute personne autorisée par la loi.', null, '{procedure}', 83),
  ('civil_0084', '6401', null, 'Titre VI Procédures civiles', 'Chapitre 4 - Déroulement de la procédure', 'Aucune décision ne peut être rendue sans que chaque partie ait été mise en mesure de présenter ses arguments et ses preuves.', null, '{procedure}', 84),
  ('civil_0085', '6402', null, 'Titre VI Procédures civiles', 'Chapitre 4 - Déroulement de la procédure', 'Les parties supportent la charge de la preuve conformément aux règles de la Common Law. Le juge veille à la légalité et à la pertinence des preuves produites.', null, '{procedure}', 85),
  ('civil_0086', '6403', null, 'Titre VI Procédures civiles', 'Chapitre 4 - Déroulement de la procédure', 'Le juge dirige la procédure, assure son bon déroulement et peut prendre toute mesure nécessaire à la manifestation de la vérité, dans le respect des droits des parties.', null, '{procedure,ordre_public}', 86),
  ('civil_0087', '6404', null, 'Titre VI Procédures civiles', 'Chapitre 4 - Déroulement de la procédure', 'Toute décision civile est motivée en droit et en fait.', null, '{procedure}', 87),
  ('civil_0088', '6501', null, 'Titre VI Procédures civiles', 'Chapitre 5 - Dispositions complémentaires', 'Toute partie dispose du droit d’exercer un recours contre une décision civile, dans les formes et délais prévus par la loi.', null, '{procedure}', 88),
  ('civil_0089', '6502', null, 'Titre VI Procédures civiles', 'Chapitre 5 - Dispositions complémentaires', 'Les actions civiles sont soumises aux règles de prescription et de délais prévues par la loi.', null, '{procedure}', 89),
  ('civil_0090', '6503', null, 'Titre VI Procédures civiles', 'Chapitre 5 - Dispositions complémentaires', 'Les parties peuvent recourir à des modes alternatifs de résolution des litiges, notamment la médiation ou l’arbitrage, lorsque la loi le permet.', null, '{procedure}', 90);

-- Code électoral
drop table if exists cabinet_codes_electoral;
create table cabinet_codes_electoral (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_electoral enable row level security;

insert into cabinet_codes_electoral (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('electoral_0001', '1101', null, 'Titre I Des élections du Gouverneur de l''Etat de San Andreas', 'Chapitre 1 - Dispositions générales', 'Le Gouverneur de l''Etat de San Andreas est élu au suffrage indirect.', null, '{organisation}', 1),
  ('electoral_0002', '1102', null, 'Titre I Des élections du Gouverneur de l''Etat de San Andreas', 'Chapitre 1 - Dispositions générales', 'Peut être candidate à la fonction de Gouverneur de l''Etat de San Andreas, toute personne remplissant les conditions d''éligibilité prévues par la Constitution de l''Etat de San Andreas.', null, '{organisation}', 2),
  ('electoral_0003', '1103', null, 'Titre I Des élections du Gouverneur de l''Etat de San Andreas', 'Chapitre 1 - Dispositions générales', 'Est élu Gouverneur de l''Etat de San Andreas, le candidat qui, lors des élections, réunis le plus grand nombre de voix des grands électeurs de l''Etat de San Andreas.', null, '{organisation}', 3),
  ('electoral_0004', '2101', null, 'Titre II Des élections des Maires de comté', 'Chapitre 1 - Dispositions générales', 'Le Maire de comté est élu au suffrage universel direct.', null, '{organisation}', 4),
  ('electoral_0005', '2102', null, 'Titre II Des élections des Maires de comté', 'Chapitre 1 - Dispositions générales', 'Peut être candidat à la fonction Maire de comté, toute personne qui :
- est citoyenne de l’Etat de San Andreas,
- est légalement domiciliée dans le comté concerné,
- est âgée d’au moins vingt-et-un (21) ans,
- jouit de l’intégralité de ses droits civils,
- ne fait l’objet d’aucune inéligibilité judiciaire.', null, '{organisation}', 5),
  ('electoral_0006', '2103', null, 'Titre II Des élections des Maires de comté', 'Chapitre 1 - Dispositions générales', 'Toute personne éligible souhaitant se porter candidate à la fonction de Maire de comté doit déposer une déclaration de candidature auprès de la Mairie de son comté au plus tard huit (8) jours avant la date du scrutin.', null, '{organisation}', 6),
  ('electoral_0007', '2104', null, 'Titre II Des élections des Maires de comté', 'Chapitre 1 - Dispositions générales', 'La Mairie de comté vérifie la légalité de chaque candidature reçue. Toute candidature ne remplissant pas les conditions légales est rejetée par décision motivée.', null, '{organisation}', 7),
  ('electoral_0008', '2105', null, 'Titre II Des élections des Maires de comté', 'Chapitre 1 - Dispositions générales', 'L’élection pour le poste de Maire du Comté de Los Santos et du Comté de Blaine County se déroule le deuxième dimanche des mois de janvier, avril, juillet et octobre.', null, '{organisation}', 8),
  ('electoral_0009', '2201', null, 'Titre II Des élections des Maires de comté', 'Chapitre 2 - Campagne électorale', 'La période officielle de campagne prend fin la veille de la date du scrutin.', null, '{organisation}', 9),
  ('electoral_0010', '2202', null, 'Titre II Des élections des Maires de comté', 'Chapitre 2 - Campagne électorale', 'Les activités de campagne doivent respecter l''ordre public et la dignité des institutions.', null, '{organisation,ordre_public}', 10),
  ('electoral_0011', '2203', null, 'Titre II Des élections des Maires de comté', 'Chapitre 2 - Campagne électorale', 'Toute pratique contraire aux lois de l''Etat de San Andreas est prohibée et peut donner suite à des poursuites judiciaires.', null, '{organisation,procedure}', 11),
  ('electoral_0012', '2204', null, 'Titre II Des élections des Maires de comté', 'Chapitre 2 - Campagne électorale', 'Toute action de campagne réalisée après la période de campagne et avant la fermeture des bureaux de vote peut donner suite à des poursuites judiciaires et à une disqualification du scrutin en cours.', null, '{organisation,procedure}', 12),
  ('electoral_0013', '2301', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Le scrutin est organisé et supervisé par la Mairie de chaque comté, le Gouvernement de l''Etat de San Andreas et la Cour Suprême de l''Etat de San Andreas.', null, '{organisation,procedure}', 13),
  ('electoral_0014', '2302', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Peut voter tout citoyen recensé de l''Etat de San Andreas et légalement domicilié dans le comté concerné.', null, '{organisation}', 14),
  ('electoral_0015', '2303', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Chaque électeur dispose d’une seule voix.', null, '{organisation}', 15),
  ('electoral_0016', '2304', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Le Maire de comté est élu au scrutin majoritaire uninominal à un tour.', null, '{organisation}', 16),
  ('electoral_0017', '2305', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'En cas d''égalité parfaite, le candidat le plus âgé est proclamé élu.', null, '{organisation}', 17),
  ('electoral_0018', '2306', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Les votes peuvent se faire dans un bureau de vote ou par correspondance. Les votes par correspondance peuvent être ouverts avant les bureaux de vote mais doivent être fermés au même moment.', null, '{organisation}', 18),
  ('electoral_0019', '2307', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Toute entrave ou perturbation du déroulement du scrutin peut donner suite à des poursuites judiciaires.', null, '{corruption,organisation,procedure}', 19),
  ('electoral_0020', '2308', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Le dépouillement des votes a lieu immédiatement après la fermeture des bureaux de vote et des votes par correspondance.', null, '{organisation}', 20),
  ('electoral_0021', '2309', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'A la fin du dépouillement, la Mairie de comté transmet les résultats du scrutin à la Cour Suprême de l''Etat de San Andreas.', null, '{organisation,procedure}', 21),
  ('electoral_0022', '2310', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Le Maire de comté proclame officiellement les résultats du scrutin qui doivent être publiés sans délais.', null, '{organisation}', 22),
  ('electoral_0023', '2311', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'La proclamation des résultats du scrutin confère pleine autorité légale au Maire de comté élu qui entre en fonction après avoir prêté serment.', null, '{organisation}', 23),
  ('electoral_0024', '2312', null, 'Titre II Des élections des Maires de comté', 'Chapitre 3 - Déroulement du scrutin', 'Toute contestation des résultats d''un scrutin peut être portée devant le pouvoir judiciaire qui suspend le processus électoral le temps qu''une décision soit prise. La juridiction saisie peut valider l''élection, annuler l''élection ou ordonner l''organisation d''un nouveau scrutin en cas d''irrégularités graves.', null, '{organisation}', 24),
  ('electoral_0025', '2401', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Les membres du Conseil municipal de chaque comté sont élus au suffrage universel direct par les citoyens domiciliés dans le comté concerné. Le Conseil municipal est composé de cinq (5) Conseillers municipaux élus, auxquels s''ajoutent le Maire, qui préside le Conseil, ainsi que son Adjoint lorsque sa présence est nécessaire.', null, '{organisation}', 25),
  ('electoral_0026', '2402', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Peut être candidate à la fonction de Conseiller municipal toute personne qui :
- est citoyenne de l''État de San Andreas ;
- est légalement domiciliée dans le comté concerné ;
- est âgée d''au moins vingt-et-un (21) ans ;
- jouit de l''intégralité de ses droits civils ;
- ne fait l''objet d''aucune inéligibilité judiciaire.', null, '{organisation}', 26),
  ('electoral_0027', '2403', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Toute personne souhaitant se porter candidate à la fonction de Conseiller municipal doit déposer une déclaration de candidature auprès de la Mairie de son comté au plus tard huit (8) jours avant la date du scrutin. La Mairie vérifie la légalité de chaque candidature reçue. Toute candidature ne remplissant pas les conditions prévues par le présent Code est rejetée par décision motivée.', null, '{organisation}', 27),
  ('electoral_0028', '2404', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'L''élection des Conseillers municipaux est organisée simultanément à l''élection du Maire du comté. Elle se déroule en conséquence le deuxième dimanche des mois de janvier, avril, juillet et octobre.', null, '{organisation}', 28),
  ('electoral_0029', '2405', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Les Conseillers municipaux sont élus pour une durée de trois (3) mois. Leur mandat débute après la proclamation officielle des résultats et prend fin lors de l''entrée en fonction des Conseillers élus à l''élection municipale suivante. Les Conseillers municipaux sortants peuvent se présenter à nouveau sans limitation du nombre de mandats, sauf disposition légale contraire.', null, '{organisation,procedure}', 29),
  ('electoral_0030', '2406', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'L''élection des Conseillers municipaux est organisée au scrutin plurinominal majoritaire à un tour. Chaque électeur peut voter pour un nombre de candidats inférieur ou égal au nombre de sièges à pourvoir. Un électeur ne peut attribuer plus d''une voix au même candidat.', null, '{organisation}', 30),
  ('electoral_0031', '2407', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'À l''issue du dépouillement, les cinq (5) candidats ayant obtenu le plus grand nombre de suffrages sont proclamés élus Conseillers municipaux. Les sièges sont attribués dans l''ordre décroissant du nombre de suffrages obtenus.', null, '{organisation}', 31),
  ('electoral_0032', '2408', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'En cas d''égalité de suffrages entre plusieurs candidats lorsque cette égalité détermine l''attribution du dernier siège disponible, un second tour limité aux candidats concernés est organisé. Le candidat obtenant le plus grand nombre de suffrages lors de ce second tour est proclamé élu. En cas de nouvelle égalité, les modalités de départage sont déterminées par l''autorité chargée de superviser le scrutin conformément aux dispositions du présent Code.', null, '{organisation}', 32),
  ('electoral_0033', '2409', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'L''élection des Conseillers municipaux est organisée et supervisée dans les mêmes conditions que l''élection du Maire du comté. La Mairie du comté, le Gouvernement de l''État de San Andreas et la Cour Suprême de l''État de San Andreas assurent les missions qui leur sont respectivement attribuées par le présent Code. Chaque électeur dispose d''un vote personnel et ne peut voter qu''une seule fois lors d''un même scrutin.', null, '{organisation,procedure}', 33),
  ('electoral_0034', '2410', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Le dépouillement des votes des Conseillers municipaux intervient immédiatement après la fermeture du scrutin. À la fin du dépouillement, la Mairie transmet les résultats à la Cour Suprême de l''État de San Andreas. La Mairie communique officiellement les résultats du scrutin dans les plus brefs délais après leur validation. La proclamation officielle des résultats confère aux candidats élus la qualité de Conseiller municipal.', null, '{organisation,procedure}', 34),
  ('electoral_0035', '2411', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Le siège d''un Conseiller municipal devient vacant notamment en cas de décès, démission, perte des conditions légales d''éligibilité, incompatibilité légalement constatée ou destitution prononcée par une autorité compétente conformément à la loi. Lorsqu''un siège devient vacant, celui-ci est proposé au candidat non élu ayant obtenu le plus grand nombre de suffrages lors de la dernière élection du Conseil municipal. Le candidat concerné peut accepter ou refuser le siège. En cas de refus, le siège est proposé successivement aux candidats suivants selon leur nombre de suffrages.', null, '{organisation}', 35),
  ('electoral_0036', '2412', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Lorsqu''aucun candidat issu du précédent scrutin ne peut ou ne souhaite occuper un siège devenu vacant, une élection municipale partielle peut être organisée afin de pourvoir le siège. Le Conseiller élu dans le cadre d''une élection partielle exerce ses fonctions uniquement pour la durée restante du mandat en cours. Lorsque la prochaine élection générale doit intervenir dans un délai suffisamment court, le siège peut demeurer vacant jusqu''à celle-ci afin d''éviter l''organisation d''un scrutin manifestement disproportionné.', null, '{organisation,procedure}', 36),
  ('electoral_0037', '2413', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Les fonctions de Maire du comté et de Conseiller municipal sont incompatibles. Une même personne peut présenter sa candidature à l''une ou l''autre de ces fonctions mais ne peut exercer simultanément les deux mandats. L''Adjoint au Maire n''acquiert pas, du seul fait de sa fonction, la qualité de Conseiller municipal élu.', null, '{organisation,procedure}', 37),
  ('electoral_0038', '2414', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Les dispositions du Chapitre 2 du présent Titre relatives à la campagne électorale sont applicables aux candidats au Conseil municipal. Les candidats sont soumis aux mêmes obligations de respect de l''ordre public, de la dignité des institutions et des lois de l''État de San Andreas.', null, '{organisation,ordre_public}', 38),
  ('electoral_0039', '2415', null, 'Titre II Des élections des Maires de comté', 'Chapitre 4 - Des élections du Conseil municipal', 'Toute contestation relative à l''élection des Conseillers municipaux est portée devant le pouvoir judiciaire dans les mêmes conditions que celles applicables à l''élection du Maire du comté. La juridiction saisie peut notamment valider l''élection, annuler tout ou partie du scrutin ou ordonner l''organisation d''un nouveau scrutin en cas d''irrégularités graves.', null, '{organisation}', 39),
  ('electoral_0040', '3101', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Le Gouverneur de l’État de San Andreas ainsi que les Maires des comtés de Los Santos et de Blaine County peuvent demander l’organisation d’un référendum sur toute question d’intérêt public ou sur un projet relevant de leur compétence.', null, '{organisation}', 40),
  ('electoral_0041', '3102', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'L’autorité initiatrice du référendum doit soumettre à la Cour Suprême et au Sénat de l’État de San Andreas un projet de texte ou une question clairement formulée.La Cour et le Sénat statuent, dans un délai de 72 heures, sur la recevabilité constitutionnelle de la proposition.', null, '{procedure}', 41),
  ('electoral_0042', '3103', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Une fois la proposition jugée recevable par la Cour et le Sénat, le référendum doit être organisé dans un délai de sept (7) jours.', null, '{procedure}', 42),
  ('electoral_0043', '3104', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Le référendum se tient selon les dispositions générales applicables à l’Election Day. Un scrutin électronique ou physique peut être organisé sous contrôle du Gouvernement de l’État de San Andreas ou de l’autorité municipale compétente.', null, '{}', 43),
  ('electoral_0044', '3105', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Si le référendum est approuvé à la majorité absolue des suffrages exprimés, le texte ou la décision soumise devient obligatoire et doit être promulgué par l’autorité compétente.', null, '{}', 44),
  ('electoral_0045', '3106', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Ne peuvent faire l’objet d’un référendum gouvernemental ou municipal :
- les sujets relevant exclusivement du pouvoir judiciaire,
- les nominations individuelles,
- les questions fiscales ou budgétaires.', null, '{}', 45),
  ('electoral_0046', '3107', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'L’autorité organisatrice est tenue de publier une note explicative sur chaque référendum organisé, accessible à l’ensemble des citoyens au moins 48 heures avant le vote. Les services publics de communication doivent garantir une présentation équilibrée des arguments pour et contre.', null, '{}', 46),
  ('electoral_0047', '3108', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 1 - Référendum à l''initiative du Gouvernement', 'Le Gouverneur de l’État de San Andreas ainsi que les Maires des comtés de Los Santos et de Blaine County ne peuvent organiser plus de trois (3) référendums par trimestre civil.', null, '{organisation}', 47),
  ('electoral_0048', '3201', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Tout citoyen recensé de l’Etat de San Andreas peut initier une procédure de référendum d’initiative populaire.', null, '{procedure}', 48),
  ('electoral_0049', '3202', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Le citoyen initiateur doit soumettre à la Cour Suprême et au Sénat de l’Etat de San Andreas un projet de texte ou une question clairement formulée. La Cour et le Sénat statuent, dans un délai de 72 heures, sur la recevabilité constitutionnelle de la proposition.', null, '{procedure}', 49),
  ('electoral_0050', '3203', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Une fois la proposition jugée recevable par la Cour et le Sénat, le citoyen dispose d’un délai de 15 jours pour réunir :
- un nombre de signatures de citoyens recensés équivalant à au moins 20 % de la participation électorale enregistrée lors des dernières élections générales.
Les signatures, une fois réunies, doivent être déposées auprès du Gouvernement de l’Etat de San Andreas.', null, '{procedure}', 50),
  ('electoral_0051', '3204', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Dès réception des signatures et après vérification formelle par les services du Gouvernement, le référendum doit être organisé dans un délai de sept (7) jours.', null, '{}', 51),
  ('electoral_0052', '3205', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Le référendum se tient selon les dispositions générales applicables à l’Election Day. Un scrutin électronique ou physique peut être organisé, sous contrôle du Gouvernement.', null, '{}', 52),
  ('electoral_0053', '3206', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Si le référendum est approuvé à la majorité absolue des suffrages exprimés, le texte ou la décision soumise devient obligatoire et doit être promulgué par le Gouvernement.', null, '{}', 53),
  ('electoral_0054', '3207', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Ne peuvent faire l’objet d’un référendum d’initiative citoyenne :
- les sujets relevant exclusivement du pouvoir judiciaire,
- les nominations individuelles,
- les questions fiscales ou budgétaires.', null, '{}', 54),
  ('electoral_0055', '3208', null, 'Titre III Du Référendum dans l''Etat de San Andreas', 'Chapitre 2 - Référendum d''initiative citoyenne', 'Un même citoyen ne peut initier plus d’un référendum par trimestre civil.', null, '{}', 55),
  ('electoral_0056', '10001', null, 'Titre X Processus électoral et intégrité du scrutin', 'Chapitre unique', 'Toute modification du comté de recensement d’un citoyen est interdite dans un délai de trois (3) semaines précédant la tenue d’une élection officielle organisée sur le territoire de l’État de San Andreas. Cette disposition vise à garantir l’intégrité du processus électoral et à prévenir toute manipulation du corps électoral.', null, '{}', 56),
  ('electoral_0057', '10002', null, 'Titre X Processus électoral et intégrité du scrutin', 'Chapitre unique', 'Toute personne peut procéder à sa première inscription au recensement électoral jusqu’à quatre (4) jours avant la tenue d’une élection officielle. Toute inscription réalisée dans ce délai permet la participation au scrutin dans le comté concerné. Toutefois, cette disposition ne permet pas de modifier un comté de recensement existant dans la période prévue à l’article 10001.', null, '{}', 57);

-- Code environnemental (chasse, pêche, parcs)
drop table if exists cabinet_codes_environnemental;
create table cabinet_codes_environnemental (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_environnemental enable row level security;

insert into cabinet_codes_environnemental (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('environnemental_0001', '1101', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 1 - Création et gestion des parcs nationaux', 'Un parc national est un espace terrestre ou maritime présentant un intérêt environnemental, écologique, paysager ou culturel particulier, justifiant une protection renforcée afin de préserver les écosystèmes naturels contre les dégradations.', null, '{environnement}', 1),
  ('environnemental_0002', '1102', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 1 - Création et gestion des parcs nationaux', 'La création d’un parc national est décidée par décret du Gouvernement de l’Etat de San Andreas, après consultation de l’autorité compétente en matière de gestion des parcs naturels. Le décret de création délimite les zones protégées, fixe les règles générales applicables au parc et approuve, le cas échéant, une charte de gestion.', null, '{environnement}', 2),
  ('environnemental_0003', '1103', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 1 - Création et gestion des parcs nationaux', 'La gestion, la surveillance et l’aménagement des parcs nationaux relèvent du Bureau des Park Rangers de l’Etat de San Andreas, agissant sous l’autorité du Gouvernement de l’Etat et des mairies de comté.', null, '{environnement}', 3),
  ('environnemental_0004', '1104', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 1 - Création et gestion des parcs nationaux', 'Sont reconnus comme parcs nationaux de l’Etat de San Andreas :
- le Parc du Mont Chiliad
- le Parc du Mont Gordo,
- le Parc du Grand Senora Desert.', null, '{environnement}', 4),
  ('environnemental_0005', '1201', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 2 - Règlementation interne et usage', 'Chaque parc national est régi par un règlement intérieur adopté par l’autorité gestionnaire. Toute personne présente dans un parc national est tenue de s’y conformer.', null, '{environnement}', 5),
  ('environnemental_0006', '1202', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 2 - Règlementation interne et usage', 'La circulation à pied, à vélo ou à véhcule motorisé est autorisée exclusivement sur les routes, chemins et sentiers aménagés à cet effet.', null, '{circulation,environnement}', 6),
  ('environnemental_0007', '1203', 'PARTIE I', 'Titre I Parcs nationaux et espaces protégés', 'Chapitre 2 - Règlementation interne et usage', 'La vitesse maximale autorisée dans les parcs nationaux est fixée à 40 km/h, sauf disposition contraire.', null, '{environnement}', 7),
  ('environnemental_0008', '2101', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'La chasse est interdite dans les parcs nationaux et réserves naturelles, sauf dans les zones expressément autorisées.', null, '{environnement}', 8),
  ('environnemental_0009', '2102', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'Toute personne souhaitant pratiquer la chasse doit être titulaire d’un permis de chasse valide délivré par l’Etat ou par un organisme agréé.', null, '{circulation,environnement}', 9),
  ('environnemental_0010', '2103', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'Les chasseurs sont tenus de porter des vêtements de haute visibilité pendant toute activité de chasse.', null, '{environnement}', 10),
  ('environnemental_0011', '2104', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'Il est interdit de chasser sous l’influence de l’alcool ou de substances altérant les capacités.', null, '{environnement}', 11),
  ('environnemental_0012', '2105', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'Les Park Rangers sont autorisés à effectuer des contrôles dans les zones de chasse autorisées, dans le respect des garanties constitutionnelles applicables.', null, '{environnement}', 12),
  ('environnemental_0013', '2106', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'Afin d’assurer la conservation des espèces, des quotas de chasse sont fixés à 100 unités. Les quotas peuvent être modifiés par décret par les mairies de comté ou le Gouvernement de l''Etat de San Andreas.', null, '{environnement}', 13),
  ('environnemental_0014', '2107', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 1 - Pratique de la chasse', 'La chasse, la capture ou la mise à mort des espèces animales terrestres suivantes est strictement interdite sur l’ensemble du territoire du comté de Blaine :
- Puma (Cougar)
- Coyote', 'Applicable uniquement à Blaine County.', '{homicide,environnement}', 14),
  ('environnemental_0015', '2201', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 2 - Pratique de la pêche', 'La pêche est interdite dans les parcs nationaux et réserves naturelles, sauf dans les zones expressément autorisées.', null, '{environnement}', 15),
  ('environnemental_0016', '2202', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 2 - Pratique de la pêche', 'Toute personne souhaitant pratiquer la pêche doit être titulaire d’un permis de pêche valide délivré par l’Etat ou par un organisme agréé.', null, '{circulation,environnement}', 16),
  ('environnemental_0017', '2203', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 2 - Pratique de la pêche', 'La pêche du poisson-chat et du piranha est interdite sur l’ensemble du territoire de l’Etat de San Andreas.
Règlement intérieur des parcs nationaux de l''Etat de San Andreas (cliquez ici)', null, '{environnement}', 17),
  ('environnemental_0018', '2204', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 2 - Pratique de la pêche', 'Des quotas de pêche sont fixés sont fixés à 100 unités. Les quotas peuvent être modifiés par décret par les mairies de comté ou le Gouvernement de l''Etat de San Andreas.', 'Sur Los Santos les quotas de pêche sont fixés à 50 unités.', '{environnement}', 18),
  ('environnemental_0019', '2205', 'PARTIE I', 'Titre II Chasse et pêche', 'Chapitre 2 - Pratique de la pêche', 'La pêche, la capture ou la mise à mort des espèces aquatiques suivantes est strictement interdite :
- Baleine
- Orque
- Piranha
- Poisson-chat', 'Applicable uniquement à Blaine County.', '{homicide,environnement}', 19),
  ('environnemental_0020', '3101', 'PARTIE I', 'Titre III Sanctions', 'Chapitre unique', 'Toute infraction au présent Code peut entrainer une sanction administrative ou pénal, selon la gravité de l''infraction.', null, '{procedure}', 20),
  ('environnemental_0021', '3102', 'PARTIE I', 'Titre III Sanctions', 'Chapitre unique', 'Les sanctions administratives applicables prennent la forme d''amendes administratives. Aucune peine privative de liberté ne peut être prononcée sur le fondement du présent Code.', null, '{procedure}', 21),
  ('environnemental_0022', '3103', 'PARTIE I', 'Titre III Sanctions', 'Chapitre unique', 'Toute sanction administrative peut faire l’objet d’une contestation devant une autorité compétente, dans les conditions prévues par la loi.', null, '{procedure}', 22),
  ('environnemental_0023', '3104', 'PARTIE I', 'Titre III Sanctions', 'Chapitre unique', 'Tout comportement constituant une infraction pénale est poursuivi et sanctionné conformément au Code pénal de l’Etat de San Andreas.', null, '{procedure}', 23),
  ('environnemental_0024', '3105', 'PARTIE I', 'Titre III Sanctions', 'Chapitre unique', 'Toute tentative de capture, de chasse ou de pêche visant les espèces mentionnées aux articles 2205 et 2107 constitue une infraction aux règles de protection de la faune sauvage.

Texte
Titre', 'Applicable uniquement à Blaine County.', '{procedure,environnement}', 24),
  ('environnemental_0025', '4101', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 1 - Espaces protégés', 'Tout non-respect du calme et de la tranquilité des lieux, dans un espace protégé, est reconnu comme trouble au calme et à la tranquilité dans un espace protégé et constitue une infraction.', null, '{ordre_public,environnement}', 25),
  ('environnemental_0026', '4102', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 1 - Espaces protégés', 'Tout abandon de détritus ou d''objet, dans les limites d''un espace protégé, avec pour objectif de se débarasser de l''objet en question constitue une infraction.', null, '{environnement}', 26),
  ('environnemental_0027', '4103', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 1 - Espaces protégés', 'Toute infraction à l''une des règles fixée par le règlement intérieur d''un espace protégé est reconnu comme non-respect du règlement intérieur d''un espace protégé et constitue une infraction.', null, '{environnement}', 27),
  ('environnemental_0028', '4104', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 1 - Espaces protégés', 'Toute dégradation de végétaux, minéraux ou de tout objet présents dans un espace protégé est reconnu comme détérioration d''un espace protégé et constitue une infraction.', null, '{environnement}', 28),
  ('environnemental_0029', '4201', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 2 - Pratique de la chasse et de la pêche', 'Toute pratique de la chasse sans être en possession du permis, des licences ou des autorisations nécessaires et permettant la pratique de cette activité, est reconnue comme chasse sans permis et constitue une infraction.', null, '{circulation,environnement}', 29),
  ('environnemental_0030', '4202', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 2 - Pratique de la chasse et de la pêche', 'Tout non respect des règles de sécurité pour la pratique de la chasse constitue une infraction.', null, '{environnement}', 30),
  ('environnemental_0031', '4203', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 2 - Pratique de la chasse et de la pêche', 'Toute pratique de la pêche sans être en possession du permis, des licences ou des autorisations nécessaires et permettant la pratique de cette activité, est reconnue comme pêche sans permis et constitue une infraction.', null, '{circulation,environnement}', 31),
  ('environnemental_0032', '4301', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 3 - Espaces urbanisés  Applicable uniquement à Los Santos.', 'L’installation et/ou la diffusion de tout panneau ou support publicitaire est interdite en dehors des emplacements spécifiquement prévus à cet effet et constitue un délit de destruction de pollution visuelle.', 'Applicable uniquement à Los Santos.', '{environnement}', 32),
  ('environnemental_0033', '4301.1', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 3 - Espaces urbanisés  Applicable uniquement à Los Santos.', 'Les façades de commerces ne sont pas soumises à l’article 1 du présent décret municipal.', 'Applicable uniquement à Los Santos.', '{}', 33),
  ('environnemental_0034', '4303.2', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 3 - Espaces urbanisés  Applicable uniquement à Los Santos.', 'Le non-respect de l’article 4301 entraînera le démontage du support et une amende de 10000$', 'Applicable uniquement à Los Santos.', '{}', 34),
  ('environnemental_0035', '4304', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre 3 - Espaces urbanisés  Applicable uniquement à Los Santos.', 'Il est institué une amende pécuniaire de 2,500$ à l’encontre de toute personne jetant des objets sur la voie publique, en dehors des emplacements prévus à cet effet.', 'Applicable uniquement à Los Santos.', '{ordre_public}', 35);

-- Code gouvernemental
drop table if exists cabinet_codes_gouvernemental;
create table cabinet_codes_gouvernemental (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_gouvernemental enable row level security;

insert into cabinet_codes_gouvernemental (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('gouvernemental_0001', '1101', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 1 - Dispositions générales', 'Le pouvoir exécutif de l''Etat fédéré de San Andreas est incarné par le Gouvernement de l''Etat de San Andreas. Le Gouvernement de l''Etat de San Andreeas met en œuvre les lois et conduit la politique de l''Etat.', null, '{circulation}', 1),
  ('gouvernemental_0002', '1102', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 1 - Dispositions générales', 'Le Gouvernement de l''Etat de San Andreas est composé de plusieurs départements exécutifs dont le Bureau du Gouverneur qui est le principal organe et organe directeur du Gouvernement de l''Etat de San Andreas.', null, '{organisation}', 2),
  ('gouvernemental_0003', '1201', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Bureau du Gouverneur de l''Etat de San Andreas est le principal département exécutif de l''Etat de San Andreas.', null, '{organisation}', 3),
  ('gouvernemental_0004', '1202', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Bureau du Gouverneur de l''Etat de San Andreas est dirigé par le Gouverneur de l''Etat de San Andreas, élu conforméments à la Constitution de l''Etat de San Andreas.', null, '{organisation}', 4),
  ('gouvernemental_0005', '1203', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Gouverneur de l''Etat de San Andreas est le chef de l''exécutif de l''Etat de San Andreas. Il incarne l''autorité de l''Etat, assure l''application des lois, dirige la politique publique et représente l''Etat auprès des autres institutions et juridictions.', null, '{organisation}', 5),
  ('gouvernemental_0006', '1204', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Gouverneur de l''Etat de San Andreas peut proposer des projets de loi, signer des décrets réglementaires, et déléguer certaines de ses compétences à des membres de son Cabinet.', null, '{organisation}', 6),
  ('gouvernemental_0007', '1205', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Gouverneur de l''Etat de San Andreas est responsable de l''organisation des services publics.', null, '{organisation}', 7),
  ('gouvernemental_0008', '1206', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Gouverneur exerce une tutelle administrative et financière sur les comtés afin de garantir la conformité de leur action avec les lois de l’Etat.', null, '{organisation}', 8),
  ('gouvernemental_0009', '1207', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Gouverneur de l''Etat de San Andreas est garant et veille au bon déroulé des opérations électorales conformément à la loi en vigueur.', null, '{organisation}', 9),
  ('gouvernemental_0010', '1208', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'Le Vice-Gouverneur de l''Etat de San Andreas assiste le Gouverneur de l''Etat de San Andreas dans l’exercice de ses fonctions. Il peut le représenter lors d’évènements officiels ou administratifs. Il peut être chargé de la coordination des services gouvernementaux ou de dossiers particuliers à la demande du Gouverneur.', null, '{organisation}', 10),
  ('gouvernemental_0011', '1209', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 2 - Bureau du Gouverneur', 'En cas d''empêchement temporaire ou de vacance du poste de Gouverneur, le Vice-Gouverneur assure l’intérim jusqu’à l''élection d’un nouveau Gouverneur selon les dispositifs prévus par la loi.', null, '{organisation}', 11),
  ('gouvernemental_0012', '1301', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 3 - Conseillers du Gouverneur', 'Le Gouverneur de l''Etat de San Andreas peut librement nommer des Conseillers, chargés de le conseiller et de l’assister dans la préparation, la réflexion et le suivi de sa politique.', null, '{organisation}', 12),
  ('gouvernemental_0013', '1302', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 3 - Conseillers du Gouverneur', 'Les Conseillers n’ont aucun pouvoir exécutif propre et ne peuvent exercer aucune délégation d’autorité.', null, '{organisation}', 13),
  ('gouvernemental_0014', '1303', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 3 - Conseillers du Gouverneur', 'Les Conseillers peuvent être révoqués librement par décision du Gouverneur, sans procédure formelle.', null, '{organisation,procedure}', 14),
  ('gouvernemental_0015', '1401', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 4 - Département de la Justice', 'Le Département de la Justice de l''Etat de San Andreas (DoJ-SA) est un département exécutif de l''Etat de San Andreas.', null, '{}', 15),
  ('gouvernemental_0016', '1402', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 4 - Département de la Justice', 'Le Département de la Justice de l''Etat de San Andreas (DoJ-SA) est dirigé par le Procureur Général de l''Etat de San Andreas qui est nommé par le Gouverneur de l''Etat de San Andreas.', null, '{organisation,procedure}', 16),
  ('gouvernemental_0017', '1403', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 4 - Département de la Justice', 'Le Procureur Général de l''Etat de San Andreas est chargé de :
- veiller, en tant que responsable des affaires juridiques de l''Etat, à la bonne application des lois de l’Etat de San Andreas,
- superviser les procureurs de comté et les assister dans leurs misisons,
- agir en tant qu''avocat principal dans les litiges de l''Etat.', null, '{organisation,procedure}', 17),
  ('gouvernemental_0018', '1404', null, 'Titre I Gouvernement de l''Etat de San Andreas', 'Chapitre 4 - Département de la Justice', 'Le Procureur Général de l''Etat de San Andreas ne peut intervenir dans une affaire locale que :
- en cas de carence manifeste,
- de conflit de compétence,
- de menace grave à l’ordre public ou à l’unité de l’Etat.', null, '{violence,organisation,procedure}', 18),
  ('gouvernemental_0019', '2101', null, 'Titre II Pouvoirs locaux', 'Chapitre 1 - Dispositions générales', 'Les pouvoirs locaux de l’Etat de San Andreas sont incarnés par les Maires de comté. Ils sont élus pour un mandat de trois mois et exercent l’autorité exécutive locale, sous réserve du respect des lois et règlements de l’Etat.', null, '{organisation,procedure}', 19),
  ('gouvernemental_0020', '2102', null, 'Titre II Pouvoirs locaux', 'Chapitre 1 - Dispositions générales', 'Chaque comté de l’État de San Andreas dispose d’une organisation administrative :
- Los Santos County, dirigé par le Maire de Los Santos County,
- Blaine County, dirigé par le Maire de Blaine County,
- Cayo Perico County, placé sous l’autorité du Gouvernement de l’État de San Andreas et dont la gestion administrative est assurée par le comté de Los Santos.', null, '{organisation}', 20),
  ('gouvernemental_0021', '2201', null, 'Titre II Pouvoirs locaux', 'Chapitre 2 - Maires de comté', 'Les Maires de comté assurent l’administration générale de leur territoire. Ils veillent au bon fonctionnement des services publics locaux et disposent d’un pouvoir réglementaire local.', null, '{organisation}', 21),
  ('gouvernemental_0022', '2202', null, 'Titre II Pouvoirs locaux', 'Chapitre 2 - Maires de comté', 'Les Maires de comté ont pour compétence :
- l''organisation et supervisation des services publics locaux (forces de l’ordre locales, services médicaux, services incendie, etc),
- la gestion du budget local, y compris des recettes fiscales locales,
- l''administration de l’état civil et des registres locaux (naissances, décès, mariages, associations),
- la délivrance des licences commerciales et autorisations administratives locales,
- de veiller au respect des lois de l’Etat et adopter des règlements complémentaires applicables dans leur comté,
- la mise en place et la promotion des politiques sociales, culturelles et économiques locales.', null, '{organisation}', 22),
  ('gouvernemental_0023', '2203', null, 'Titre II Pouvoirs locaux', 'Chapitre 2 - Maires de comté', 'Les Maires de comté disposent d’un pouvoir fiscal local leur permettant de lever des impôts additionnels, en plus des impôts définis dans le Code Général des Impôts et qui s''appliquent à l''ensemble du territoire de l''Etat de San Andreas, dans les limites fixées par la loi de l’Etat.
Ces impôts peuvent porter notamment sur :
- les activités commerciales locales,
- les services municipaux,
- la résidence des habitants,
- toute autre ressource locale explicitement autorisée par la loi.', null, '{fraude,organisation}', 23),
  ('gouvernemental_0024', '2301', null, 'Titre II Pouvoirs locaux', 'Chapitre 3 - Procureurs de comté', 'Le Procureur de comté est l’autorité chargée de l’action publique au nom du peuple du comté, nommé par le Maire de comté. Il exerce ses fonctions sur l’ensemble du territoire du comté auquel il est rattaché, sous l’autorité de la loi de l’Etat et dans le respect de la Constitution de San Andreas et de la Consitution des Etats-Unis d''Amérique.', null, '{organisation,procedure}', 24),
  ('gouvernemental_0025', '2302', null, 'Titre II Pouvoirs locaux', 'Chapitre 3 - Procureurs de comté', 'Le Procureur de comté exerce une autorité fonctionnelle sur les forces de l’ordre locales dans le cadre des procédures judiciaires. Cette autorité ne s’étend pas à la gestion administrative du service.', null, '{organisation,procedure}', 25),
  ('gouvernemental_0026', '2303', null, 'Titre II Pouvoirs locaux', 'Chapitre 3 - Procureurs de comté', 'Le Procureur de comté est chargé notamment :
- d’engager, de conduire ou de classer les poursuites pénales,
- de représenter le peuple du comté devant les juridictions,
- de superviser les enquêtes judiciaires menées par les forces de l''ordre locales,
- de veiller à l’exécution des décisions de justice pénale,
- de traiter les affaires internes relatives aux services de son comté.', null, '{corruption,organisation,procedure}', 26),
  ('gouvernemental_0027', '2304', null, 'Titre II Pouvoirs locaux', 'Chapitre 3 - Procureurs de comté', 'Le Procureur de comté organise son Bureau. Il peut être assisté par des procureurs adjoints qui agissent alors par délégation du Procureur de comté.', null, '{organisation,procedure}', 27),
  ('gouvernemental_0028', '2305', null, 'Titre II Pouvoirs locaux', 'Chapitre 3 - Procureurs de comté', 'Le Procureur de comté est responsable devant les juridictions compétentes et devant la Cour Suprême de San Andreas pour les questions constitutionnelles. Il peut être suspendu ou révoqué en cas de faute grave, d’atteinte manifeste aux droits fondamentaux, de violation grave de la loi de l’Etat, selon une procédure contradictoire.', null, '{organisation,procedure}', 28),
  ('gouvernemental_0029', '3401', null, 'Titre II Pouvoirs locaux', 'Chapitre 4 - Relations avec l''Etat et le Gouvernement', 'Le Gouverneur de l''Etat de San Andreas et les Maires des comtés de l’Etat de San Andreas exercent leurs compétences respectives dans un esprit de coopération et de complémentarité. Les Maires mettent en œuvre les lois et politiques publiques de l’Etat au niveau local, sous réserve de leur pouvoir réglementaire propre.', null, '{organisation}', 29),
  ('gouvernemental_0030', '3402', null, 'Titre II Pouvoirs locaux', 'Chapitre 4 - Relations avec l''Etat et le Gouvernement', 'Les règlements et décisions des Maires de comté doivent être conformes à la Constitution et aux lois de l’Etat. En cas de contradiction manifeste, le Gouverneur peut suspendre ou annuler, par décret motivé, un acte réglementaire local contraire au droit de l’Etat.', null, '{organisation}', 30),
  ('gouvernemental_0031', '3403', null, 'Titre II Pouvoirs locaux', 'Chapitre 4 - Relations avec l''Etat et le Gouvernement', 'Lorsqu’un service public est placé à la fois sous compétence de l’Etat et d’un comté, les autorités locales sont tenues d’appliquer les directives générales édictées par le Gouverneur de l''Etat de San Andreas. Les Maires peuvent, dans leur ressort, adopter des mesures complémentaires, à condition qu’elles ne contredisent pas les normes de l’Etat.', null, '{organisation}', 31),
  ('gouvernemental_0032', '3404', null, 'Titre II Pouvoirs locaux', 'Chapitre 4 - Relations avec l''Etat et le Gouvernement', 'Les Maires supervisent politiquement les forces de l’ordre locales et services médicaux de leur comté.
En cas de crise de sécurité majeure excédant les capacités locales, le Maire peut saisir le Gouverneur pour obtenir l’appui des forces d’Etat (SAHP, etc.).
Le Gouverneur peut, par décret, coordonner ou réquisitionner temporairement les forces locales lorsque la sécurité publique de l’Etat est gravement menacée.', null, '{violence,organisation}', 32),
  ('gouvernemental_0033', '3405', null, 'Titre II Pouvoirs locaux', 'Chapitre 4 - Relations avec l''Etat et le Gouvernement', 'En cas de catastrophe naturelle, de menace grave pour la sécurité publique ou de défaillance manifeste d’un Maire, le Gouverneur peut, par décret, suspendre temporairement tout ou partie des compétences locales afin d’assurer la continuité des services publics.
Cette tutelle exceptionnelle doit être notifiée immédiatement au Sénat de l’Etat et à la Cour Suprême de l''Etat de San Andreas, et ne peut excéder une durée de sept jours sauf si prolongation approuvée par le Sénat de l’Etat.', null, '{violence,organisation,procedure}', 33),
  ('gouvernemental_0034', '3101', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La police d''Etat de l''Etat de San Andreas est la San Andreas Highway Patrol. La San Andreas Highway Patrol dépend du Gouvernement de l''Etat de San Andreas.', null, '{}', 34),
  ('gouvernemental_0035', '3102', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La San Andreas Highway Patrol a juridiction sur l''ensemble du territoire de l''Etat de San Andreas', null, '{}', 35),
  ('gouvernemental_0036', '3103', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La San Andreas Highway Patrol est dirigée par le Commander de la San Andreas Highway Patrol qui est nommé par décret du Gouverneur de l''Etat de San Andreas.', null, '{organisation}', 36),
  ('gouvernemental_0037', '3104', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La San Andreas Highway Patrol a pour missions :
- la gestion des highways et freeways de l''Etat de San Andreas et des interventions sur ces axes routiers,
- le contrôle des flux de personnes et de marchandises sur le territoire de San Andreas au niveau des différents points de péages entre les comtés,
- l''administration de la prison d''Etat de Bolingbroke,', null, '{}', 37),
  ('gouvernemental_0038', '3105', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La San Andreas Highway Patrol peut également intervenir, sur demande du Gouvernement, des Mairies de comté ou des forces de l''ordre locales en renfort de ces dernières sur leurs juridictions respectives.', null, '{corruption}', 38),
  ('gouvernemental_0039', '3106', null, 'Titre III Services publics', 'Chapitre 1 - Police d''Etat', 'La San Andreas Highway Patrol (SAHP) dispose de la compétence principale et prioritaire sur le territoire du comté de Cayo Perico.
Les autres forces de l’ordre ne peuvent intervenir qu’en cas de poursuite ou d’enquête et doivent informer la SAHP, qui assure la coordination des opérations.
L’accès au comté de Cayo Perico peut faire l’objet de contrôles par les autorités compétentes.
La SAHP est chargée de la mise en œuvre et de la coordination des contrôles aux points d’entrée et de sortie du territoire.
Ces contrôles peuvent porter sur l’identité des personnes, les biens transportés ainsi que le respect des lois en vigueur', null, '{procedure}', 39),
  ('gouvernemental_0040', '3201', null, 'Titre III Services publics', 'Chapitre 2 - Forces de l''ordre locales', 'Les forces de l''ordre locales de l''Etat de San Andreas sont le Los Santos Police Department et le Blaine County Sheriff''s Department. Ces forces de l''ordre agissent sous la responsabilité de la Mairie du comté dans lequel elles ont juridiction.', null, '{corruption}', 40),
  ('gouvernemental_0041', '3202', null, 'Titre III Services publics', 'Chapitre 2 - Forces de l''ordre locales', 'Le Los Santos Police Department a juridication sur la municipalité de Los Santos et', 'sur Los Santos County et est dirigé par le Chief de Police de Los Santos qui est nommé par décret du Maire de Los Santos County.', '{corruption}', 41),
  ('gouvernemental_0042', '3203', null, 'Titre III Services publics', 'Chapitre 2 - Forces de l''ordre locales', 'Le Blaine County Sheriff''s Department a juridication sur Blaine County et est dirigé par le Sheriff du comté de Blaine qui est nommé par décret du Maire de Blaine County.', null, '{corruption,organisation}', 42),
  ('gouvernemental_0043', '3204', null, 'Titre III Services publics', 'Chapitre 2 - Forces de l''ordre locales', 'Les forces de l''ordre locales ont pour missions, sur leurs juridictions respectives :
- de faire respecter la loi sur le territoire de leur comté,
- d''assurer la sécurité des usagers de la route dans leur comté,
- d''enquêter sur les délits et crimes commis dans leur comté,
- de répondre aux appels d''urgence des habitants de leur comté.', null, '{corruption,circulation,etat_urgence}', 43),
  ('gouvernemental_0044', '3301', null, 'Titre III Services publics', 'Chapitre 3 - Services d''urgence', 'Les services d''urgence de l''Etat de San Andreas sont le Los Santos Medical Department et le Blaine County Medical Department. Ces services d''urgence agissent sous la responsabilité de la Mairie du comté dans lequel elles ont juridiction.', null, '{etat_urgence}', 44),
  ('gouvernemental_0045', '3302', null, 'Titre III Services publics', 'Chapitre 3 - Services d''urgence', 'Le Los Santos Medical Department a juridiction sur la municipalité de Los Santos et', 'sur Los Santos County et est dirigé par le Directeur du Los Santos Medical Department qui est nommé par décret du Maire de Los Santos County.', '{etat_urgence}', 45),
  ('gouvernemental_0046', '3303', null, 'Titre III Services publics', 'Chapitre 3 - Services d''urgence', 'Le Blaine County Medical Department a juridition sur Blaine County et est dirigé par le Directeur du Blaine County Medical Department qui est nommé par décret du maire de Blaine County.', null, '{organisation,etat_urgence}', 46),
  ('gouvernemental_0047', '3304', null, 'Titre III Services publics', 'Chapitre 3 - Services d''urgence', 'Les services d''urgence de l''Etat de San Andreas ont pour missions, sur leurs juridictions respectives :
- répondre aux appels d''assistance médicale,
- fournir des traitements, tels que des premiers soins ou des soins de survie, aux patients malades ou blessés,
- mener des campagnes de préventions afin de protéger la santé des citoyens,
- intervenir sur les incendies déclarés sur leur juridiction respective.
DISPOSITIONS GÉNÉRALES — La rémunération des fonctions publiques de l’État de San Andreas est organisée par le présent chapitre. Les grilles ci-dessous font partie intégrante du Code gouvernemental et s’imposent aux administrations concernées.', null, '{etat_urgence,environnement}', 47),
  ('gouvernemental_0048', '3401', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Champ d’application. Les dispositions du présent chapitre s’appliquent aux agents et responsables du Gouvernement de San Andreas, des Mairies, du Los Santos Police Department (LSPD), du Blaine County Sheriff Department (BCSD), de la San Andreas Highway Patrol (SAHP) et du San Andreas Medical Department (SAMD).', null, '{}', 48),
  ('gouvernemental_0049', '3402', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Nature des rémunérations. Les rémunérations du LSPD, du BCSD, de la SAHP et du SAMD sont établies en dollars par heure de service. Les montants du Gouvernement et des Mairies sont des rémunérations fixes, versées selon la périodicité de paie applicable à ces institutions. Les montants prévus au présent chapitre constituent les références officielles.', null, '{}', 49),
  ('gouvernemental_0050', '3403', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Grade et fonction. La rémunération applicable est celle du grade ou de la fonction effectivement détenu et reconnu par l’administration compétente. Toute nomination, promotion ou modification de fonction doit être formalisée. Le nouveau montant prend effet à la date officielle de la décision, sans effet rétroactif sauf disposition expresse.', null, '{}', 50),
  ('gouvernemental_0051', '3404', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Intérim et remplacement. L’exercice temporaire des missions d’un supérieur hiérarchique ou le remplacement d’un responsable absent n’entraîne pas automatiquement l’attribution de sa rémunération. Toute rémunération particulière liée à un intérim doit être autorisée par écrit par l’autorité compétente.', null, '{}', 51),
  ('gouvernemental_0052', '3405', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Cumul de fonctions. Nul ne peut percevoir plusieurs rémunérations publiques pour une même période au seul motif qu’il occupe plusieurs fonctions. En cas de cumul autorisé, les modalités de rémunération sont fixées expressément par l’autorité compétente, dans le respect des règles applicables.', null, '{}', 52),
  ('gouvernemental_0053', '3406', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Versement et contrôle. Chaque institution assure le calcul et le versement des rémunérations de ses agents conformément aux grilles du présent chapitre. Les services administratifs compétents peuvent vérifier les versements, demander les justificatifs nécessaires et faire corriger toute erreur constatée.', null, '{}', 53),
  ('gouvernemental_0054', '3407', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Révision et entrée en vigueur. Les grilles de rémunération ne peuvent être modifiées que par un acte officiel du Gouvernement de l’État de San Andreas, dûment publié. Les dispositions du présent chapitre entrent en vigueur à compter de leur publication, sans préjudice des normes supérieures applicables.', null, '{}', 54),
  ('gouvernemental_0055', '3408', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', '— Rémunérations des services de police', null, '{}', 55),
  ('gouvernemental_0056', '3408', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Services de police. Les personnels du LSPD, du BCSD et de la SAHP sont rémunérés selon la grille commune ci-dessous. Chaque ligne indique les fonctions équivalentes au sein des trois services, le grade de rémunération correspondant et le montant horaire applicable. L’appellation propre à chaque service demeure inchangée.
LSPD
BCSD
SAHP
GRADES
RÉMUNÉRATION
$/h
Chief
Sheriff
Commander
G-XII
7 875
Captain
Undersheriff
Captain
G-XI
7 750
Second Lieutenant
Division Sheriff
Lieutenant
G-X
7 675
Lieutenant
Assistant Sheriff
First Sergeant
G-IX
7 500
Sergeant II
Captain
Sergeant
G-VIII
7 375
Sergeant I
Lieutenant
Corporal
G-VII
7 250
SLO
Sergeant-II
Master Trooper
G-VI
7 175
Officier III
Sergeant-I
Senior Trooper
G-V
7 125
Officier II
Deputy Senior
Trooper Frist Class
G-VI
7 000
Officier I
Deputy II
Trooper
G-III
6 750
Rookie
Deputy I
Cadet
G-II
6 500
Cadet
Deputy Trainee
G-I
6 000', null, '{}', 56),
  ('gouvernemental_0057', '3409', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', '— Rémunérations du SAMD', null, '{}', 57),
  ('gouvernemental_0058', '3409', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Service médical et de secours. Les personnels du SAMD sont rémunérés selon leur fonction et le grade de rémunération associé. Les montants horaires applicables sont fixés par la grille ci-dessous.
Fonction
Grades
Rémunération
$/h
Directeur
G-VIII
8 500
Directeur Adjoint
G-VII
8 000
Chef Ambulancier
G-VI
7 600
Médecin
G-V
7 300
Infirmier
G-IV
7 000
Ambulancier
G-III
6 500
Aide Soignant
G-II
6 000
Stagiaire
G-I
6 000', null, '{organisation}', 58),
  ('gouvernemental_0059', '3410', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', '— Rémunérations du Gouvernement', null, '{}', 59),
  ('gouvernemental_0060', '3410', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Gouvernement de l’État. Les titulaires des fonctions gouvernementales, administratives et judiciaires mentionnées dans la grille ci-dessous perçoivent la rémunération fixe correspondant à leur fonction. Le grade de rémunération sert au classement administratif et ne modifie pas les compétences attachées à la fonction.
Fonction
Grades
Rémunération
$/h
Gouverneur
G-XI
250 000
Vice-Gouverneur
G-X
230 000
Directeur de Cabinet
G-IX
220 000
Juge Associés
G-VIII
220 000
Directeur FICS SA
G-VII
205 000
Directeur DHHS SA
G-VI
205 000
Directeur CHSD SA
G-V
205 000
Procureur Général
G-IV
205 000
Procureur Général Adjoint
G-III
190 000
Procureur
G-II
170 000
Subsitut du Procureur
G-I
150 000', null, '{organisation,procedure}', 60),
  ('gouvernemental_0061', '3411', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', '— Rémunérations des Mairies', null, '{}', 61),
  ('gouvernemental_0062', '3411', null, 'Titre III Services publics', 'Chapitre 4 - Rémunérations des agents et responsables publics', 'Mairies. Les élus et agents municipaux perçoivent la rémunération fixe correspondant à leur fonction dans la grille ci-dessous. Cette grille s’applique aux Mairies relevant de l’État de San Andreas, sous réserve des dispositions supérieures en vigueur.
Fonction
Grades
Rémunération
$/h
Maire
G-VII
230 000
Adjoint au Maire
G-VI
220 000
Community Manager
G-V
190 000
Agent du FISC
G-IV
190 000
Agent du DHHS
G-III
190 000
Agent du CHSD
G-II
190 000
Assistant à a Mairie
G-I
170 000', null, '{organisation}', 62);

-- Code général des impôts
drop table if exists cabinet_codes_impots;
create table cabinet_codes_impots (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_impots enable row level security;

insert into cabinet_codes_impots (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('impots_0001', '1101', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Toute entité exerçant une activité commerciale, industrielle, artisanale ou libérale sur le territoire de l’Etat de San Andreas est soumise à l’imposition prévue par le présent Code, sauf exonération expresse.', null, '{fraude}', 1),
  ('impots_0002', '1102', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'L’impôt sur les sociétés est calculé sur le résultat net imposable, correspondant aux recettes perçues sur la période fiscale auquel on soustrait les charges liées à l''achat des fournitures essentielles à l''exercice.', null, '{fraude}', 2),
  ('impots_0003', '1103', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Le taux de l’impôt sur les entreprises, fixé par le Gouvernement de l''Etat de San Andreas, est le suivant :
- 0%  Casa Escobar
- 7% pour les bars, pour les restaurants,
- 10% pour le Weazel News, le FlyWheel''s, le Smog Check
- 20% le Classic Bike, DownTown Cab Co, les entreprises individuelles et professions libérales, Harrison,
- 30% pour le Premium Deluxe Motorsport, la compagnie ferroviaire, le Ron Petrol, le Seaton Sand''s, Secret Custom, l''Auto Exotic et le Benny’s,
- 40% pour l''AmmuNation.
- 95% pour les agences immobilières.', null, '{fraude}', 3),
  ('impots_0004', '1104', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Les entités suivantes peuvent bénéficier d’une exonération totale ou partielle :
- entreprises sous contrat direct avec l’Etat.', null, '{fraude}', 4),
  ('impots_0005', '1105', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Toute entreprise peut déduire certaines charges du montant de l''impôt qu''elle doit payer en fin d''exercice.', null, '{fraude}', 5),
  ('impots_0006', '1106', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Toute charge déductible doit être explicitement autorisée par le présent Code et doit obligatoirement être justifiée par la présentation d''un document officiel.', null, '{fraude}', 6),
  ('impots_0007', '1107', null, 'Titre I Dispositions générales', 'Chapitre 1 - Impôt sur les entreprises', 'Les charges autorisées à la déduction sont les suivantes : 
- honoraires juridiques (contrat avec un cabinet d''avocat) avec un plafond de 10,000$ hebdomadaire,
- dons aux associations déclarées avec un plafond de 15,000$ hebdomadaire.
- révisions des vehicules de la compagnie de Taxi à 5 révisions par semaine.', null, '{fraude,circulation,procedure}', 7),
  ('impots_0008', '1201', null, 'Titre I Dispositions générales', 'Chapitre 2 - Fiscalité locale', 'Les maires de comté peuvent instituer des taxes locales additionnelles, dans les limites prévues par la loi de l’Etat.', null, '{organisation}', 8),
  ('impots_0009', '1202', null, 'Titre I Dispositions générales', 'Chapitre 2 - Fiscalité locale', 'Les maires de comté peuvent instituer des taxes portant notamment sur :
- les activités commerciales locales,
- les services municipaux,
- la résidence des habitants,
- toute autre ressource expressément autorisée par la loi.', null, '{organisation}', 9),
  ('impots_0010', '1203', null, 'Titre I Dispositions générales', 'Chapitre 2 - Fiscalité locale', 'Toute taxe locale doit faire l’objet :
- d’un acte public,
- d’un taux clairement défini,
- d’un délai raisonnable d’entrée en vigueur.', null, '{}', 10),
  ('impots_0011', '1301', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'La période fiscale est hebdomadaire. Elle commence le lundi à 0h00 et se termine le dimanche à 23h59.', null, '{fraude}', 11),
  ('impots_0012', '1302', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'Toute personne, physique ou morale, imposable est tenue de déposer une déclaration fiscale complète entre le dimanche soir à 21h00 et le lundi soir à 23h59 auprès de sa mairie de comté.', null, '{fraude}', 12),
  ('impots_0013', '1303', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'Le paiement de l’impôt est effectué selon les modalités définies par les différentes mairies de comté.', null, '{fraude}', 13),
  ('impots_0014', '1304', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'Tout retard de déclaration ou de paiement donne lieu à :
- une notification officielle,
- une majoration progressive plafonnée à 100 % du montant dû,
- un délai de régularisation.', null, '{fraude}', 14),
  ('impots_0015', '1305', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'Toute entreprise, association ou structure exerçant une activité économique est tenue de vendre ses biens et/ou services exclusivement par le biais d’une contrepartie monétaire.', 'Applicable uniquement à Los Santos.', '{fraude}', 15),
  ('impots_0016', '1306', null, 'Titre I Dispositions générales', 'Chapitre 3 - Déclaration et paiement  des impôts', 'Sont strictement interdits les échanges de biens ou de services sans contrepartie monétaire; les arrangements visant à dissimuler une transaction économique réelle; toute pratique ayant pour effet d''échapper à la traçabilité fiscale des opérations.', 'Applicable uniquement à Los Santos.', '{fraude}', 16),
  ('impots_0017', '2101', null, 'Titre II Autres dispositions', 'Chapitre 1 - Contrôles fiscaux', 'Un agent fiscal peut ouvrir un contrôle fiscal, sur toute entreprise ou association, à n''importe quel moment de la période fiscale.', null, '{}', 17),
  ('impots_0018', '2102', null, 'Titre II Autres dispositions', 'Chapitre 1 - Contrôles fiscaux', 'Le contrôle fiscal est un contrôle administratif des comptes et de l''administration d’une entreprise ou d’une association. Le contrôle fiscal n’est en aucun cas une enquête judiciaire.', null, '{}', 18),
  ('impots_0019', '2103', null, 'Titre II Autres dispositions', 'Chapitre 1 - Contrôles fiscaux', 'En cas de constatation d''une infraction pénales constatée lors d''un contrôle fiscal, l''agent fiscal se doit de transmettre les information au Bureau du Procureur de son comté pour que des poursuites pénales soient engagées.', null, '{organisation,procedure}', 19);

-- Code général du travail et des entreprises
drop table if exists cabinet_codes_travail;
create table cabinet_codes_travail (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_travail enable row level security;

insert into cabinet_codes_travail (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('travail_0001', '1101', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Constitue une entreprise toute activité économique organisée visant la production, la transformation ou la fourniture de biens ou de services, exercée de manière habituelle.', null, '{}', 1),
  ('travail_0002', '1102', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Un statut juridique permet de situer l’entreprise dans son activité productive et de la reconnaître administrativement.', null, '{}', 2),
  ('travail_0003', '1103', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Toute entreprise exerçant une activité à San Andreas doit être déclarée auprès de la Mairie du comté dans lequel se trouve son siège social dans un délai raisonnable suivant sa création ou sa reprise. Le défaut de déclaration n’affecte pas l’existence de l’entreprise mais peut entraîner des sanctions administratives.', null, '{procedure}', 3),
  ('travail_0004', '1104', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Une entreprise ou association ne peut être créée ou enregistrée par une même personne sous un nom identique dans plusieurs comtés de l’État de San Andreas.', null, '{}', 4),
  ('travail_0005', '1105', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Toute demande d’enregistrement d’une entreprise ou association portant un nom déjà utilisé par la même personne dans un autre comté peut être refusée par l’autorité administrative compétente.', null, '{}', 5),
  ('travail_0006', '1106', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Une entreprise ou association créée par une même personne ne peut solliciter ou percevoir des subventions publiques provenant de plusieurs comtés pour une structure portant le même nom.', null, '{}', 6),
  ('travail_0007', '1107', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'En cas de violation des présentes dispositions :
- La structure créée irrégulièrement peut être radiée du registre des organisations,
- Les subventions indûment perçues peuvent être annulées ou récupérées,
- Toute aide publique future peut être refusée.', null, '{organisation}', 7),
  ('travail_0008', '1108', null, 'Titre I Les entreprises', 'Chapitre 1 - Définition et existence juridique', 'Les présentes dispositions ne s’appliquent pas aux entreprises officiellement enregistrées disposant d’une structure organisationnelle distincte, lesquelles peuvent disposer d’implantations dans plusieurs comtés conformément à la réglementation économique.', null, '{organisation}', 8),
  ('travail_0009', '1201', null, 'Titre I Les entreprises', 'Chapitre 2 - Entreprises publiques et privées', 'Est qualifiée d’entreprise privée toute entreprise dont le contrôle et le capital sont majoritairement détenus par des personnes non institutionnelles.', null, '{}', 9),
  ('travail_0010', '1202', null, 'Titre I Les entreprises', 'Chapitre 2 - Entreprises publiques et privées', 'Est qualifiée d’entreprise publique toute entreprise dont le contrôle ou le capital est majoritairement détenu par l’Etat ou un organisme public.', null, '{}', 10),
  ('travail_0011', '1203', null, 'Titre I Les entreprises', 'Chapitre 2 - Entreprises publiques et privées', 'L’existence d’un monopole, de droit ou de fait, n’est pas en soi prohibée. Toutefois, l’exploitation abusive d’une position dominante portant atteinte à l’accès à un service essentiel peut être sanctionnée par une autorité compétente.', null, '{procedure}', 11),
  ('travail_0012', '1204', null, 'Titre I Les entreprises', 'Chapitre 2 - Entreprises publiques et privées', 'Sont considérés comme acteurs institutionnels les organismes investis d’une mission de service public par l’Etat de San Andreas. Les acteurs institutionnels sont soumis aux dispositions du présent Code lorsqu’ils exercent une activité économique.Les acteurs institutionnels sont soumis aux dispositions du présent Code lorsqu’ils exercent une activité économique.', null, '{}', 12),
  ('travail_0013', '1301', null, 'Titre I Les entreprises', 'Chapitre 3 - Catégories d’entreprises', 'Est considérée comme entreprise individuelle, une entreprise exploitée par une personne physique sans salarié permanent', null, '{}', 13),
  ('travail_0014', '1302', null, 'Titre I Les entreprises', 'Chapitre 3 - Catégories d’entreprises', 'Est considérée comme petite entreprise, une entreprise exploitée avec un effectif salarié limité (inférieur à trois salariés).', null, '{}', 14),
  ('travail_0015', '1303', null, 'Titre I Les entreprises', 'Chapitre 3 - Catégories d’entreprises', 'Est considérée comme société, une entreprise dotée d’une organisation interne structurée et d’un effectif salarié multiple.', null, '{organisation}', 15),
  ('travail_0016', '1401', null, 'Titre I Les entreprises', 'Chapitre 4 - Biens, activités et licences', 'Les biens affectés à l’exploitation d’une entreprise peuvent être détenus en propriété, en location ou sous toute autre forme contractuelle licite.', null, '{}', 16),
  ('travail_0017', '1402', null, 'Titre I Les entreprises', 'Chapitre 4 - Biens, activités et licences', 'Certaines activités présentant un risque pour l’ordre public, la sécurité, la vente d''armes ou la santé peuvent être soumises à licence ou autorisation préalable.', null, '{armes}', 17),
  ('travail_0018', '1403', null, 'Titre I Les entreprises', 'Chapitre 4 - Biens, activités et licences', 'Les conditions d’octroi, de suspension ou de retrait des licences sont déterminées par les autorités compétentes.', null, '{}', 18),
  ('travail_0019', '2101', null, 'Titre II Des relations de travail', 'Chapitre 1 - Principes généraux', 'Toute relation de travail entre une entreprise, une association ou un organisme et une personne physique exerçant une activité sous l’autorité de cette entreprise, association ou organisme est régie par les dispositions du présent Code et par la Charte d’entreprise applicable.', null, '{}', 19),
  ('travail_0020', '2102', null, 'Titre II Des relations de travail', 'Chapitre 1 - Principes généraux', 'L’employeur est libre de recruter toute personne de son choix, sous réserve du respect des lois et règlements en vigueur, notamment en matière de non-discrimination et de capacité légale.', null, '{}', 20),
  ('travail_0021', '2103', null, 'Titre II Des relations de travail', 'Chapitre 1 - Principes généraux', 'Nul ne peut être employé s’il est âgé de moins de seize (16) ans.', null, '{}', 21),
  ('travail_0022', '2104', null, 'Titre II Des relations de travail', 'Chapitre 1 - Principes généraux', 'Un salarié âgé de seize (16) à dix-huit (18) ans ne peut être engagé qu’avec l’accord de son représentant légal.', null, '{}', 22),
  ('travail_0023', '2105', null, 'Titre II Des relations de travail', 'Chapitre 1 - Principes généraux', 'L’employeur est responsable de vérifier la capacité légale de la personne embauchée avant toute prise de fonction.', null, '{}', 23),
  ('travail_0024', '2201', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'La Charte d’entreprise est un document interne, établi unilatéralement par l’employeur, fixant les règles générales applicables aux relations de travail au sein de l’entreprise. Elle tient lieu de cadre contractuel entre l’employeur et les employés.', null, '{}', 24),
  ('travail_0025', '2202', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'La Charte d’entreprise est opposable à tout employé dès lors qu’elle a été portée à sa connaissance et acceptée par écrit lors de son embauche. L’acceptation de la Charte vaut engagement de l’employé à en respecter les dispositions.', null, '{}', 25),
  ('travail_0026', '2203', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'La Charte d''entreprise établit un lien de subordination juridique entre l’employeur et l’employé, impliquant l’exécution d’un travail contre rémunération, sous l’autorité de l’employeur.', null, '{}', 26),
  ('travail_0027', '2204', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'La Charte d’entreprise doit préciser, au minimum :
- l’identité de l’entreprise et de son dirigeant,
- les règles générales de fonctionnement et de discipline interne,
- les fonctions et obligations générales des employés,
- les règles relatives à la rémunération,
- les règles de confidentialité,
- les conditions de rupture de la relation de travail,
- les procédures disciplinaires internes.', null, '{organisation,procedure}', 27),
  ('travail_0028', '2205', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'La Charte d’entreprise peut être modifiée unilatéralement par l’employeur. Toute modification doit être portée à la connaissance des employés et est applicable à compter de sa notification, sans effet rétroactif.', null, '{}', 28),
  ('travail_0029', '2206', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'L’employeur est tenu de conserver une version à jour de la Charte d’entreprise et d’être en mesure de la fournir, à tout moment, à un employé ou aux autorités compétentes.', null, '{}', 29),
  ('travail_0030', '2207', null, 'Titre II Des relations de travail', 'Chapitre 2 - Charte d''entreprise', 'L’absence de Charte d''entreprise expose l’employeur à des sanctions administratives, sans pour autant invalider automatiquement la relation de travail.', null, '{procedure}', 30),
  ('travail_0031', '2301', null, 'Titre II Des relations de travail', 'Chapitre 3 - Rémunération', 'Toute prestation de travail effectuée dans le cadre d’une relation de travail donne lieu à une rémunération.', null, '{}', 31),
  ('travail_0032', '2302', null, 'Titre II Des relations de travail', 'Chapitre 3 - Rémunération', 'La rémunération minimale applicable par secteur d’activité est fixée par la Chambre des Commerces de l’Etat de San Andreas.', null, '{}', 32),
  ('travail_0033', '2303', null, 'Titre II Des relations de travail', 'Chapitre 3 - Rémunération', 'Aucune rémunération ne peut être inférieure au minimum légal applicable, sauf disposition expresse prévue par la loi.', null, '{}', 33),
  ('travail_0034', '2304', null, 'Titre II Des relations de travail', 'Chapitre 3 - Rémunération', 'La rémunération pratiquée par l''employeur doit apparaitre dans la Charte d''entreprise', null, '{}', 34),
  ('travail_0035', '2401', null, 'Titre II Des relations de travail', 'Chapitre 4 - Exécution et loyauté contractuelle', 'L’employé est tenu d’exécuter son travail avec loyauté et bonne foi.', null, '{}', 35),
  ('travail_0036', '2402', null, 'Titre II Des relations de travail', 'Chapitre 4 - Exécution et loyauté contractuelle', 'L’employé est tenu à une obligation de confidentialité concernant toute information interne à l’entreprise, pendant la durée de la relation de travail, conformément aux dispositions de la Charte d''entreprise à laquelle il est soumis.', null, '{}', 36),
  ('travail_0037', '2403', null, 'Titre II Des relations de travail', 'Chapitre 4 - Exécution et loyauté contractuelle', 'Il est interdit à tout salarié :
- de nuire volontairement à l’entreprise,
- de détourner des biens, fonds ou informations.', null, '{}', 37),
  ('travail_0038', '2404', null, 'Titre II Des relations de travail', 'Chapitre 4 - Exécution et loyauté contractuelle', 'L’employeur est tenu de fournir au salarié les moyens nécessaires à l’exécution normale de ses fonctions.', null, '{}', 38),
  ('travail_0039', '2501', null, 'Titre II Des relations de travail', 'Chapitre 5 - Rupture de la relation de travail', 'La relation de travail est fondée sur le principe de liberté contractuelle. L’employeur comme l’employé peuvent mettre fin à la relation de travail à tout moment, sans motif, sauf disposition contraire de la loi ou de la Charte d’entreprise.', null, '{}', 39),
  ('travail_0040', '2502', null, 'Titre II Des relations de travail', 'Chapitre 5 - Rupture de la relation de travail', 'Toute rupture doit être notifiée à l’autre partie dans un délai raisonnable fixé par la Charte d’entreprise ou, à défaut, de vingt-quatre (24) heures.', null, '{}', 40),
  ('travail_0041', '2503', null, 'Titre II Des relations de travail', 'Chapitre 5 - Rupture de la relation de travail', 'Toute rupture de la relation de travail engagée par l''employeur pour des raisons de faute grave ou d''abandon de poste n''est pas soumise à un délai de notification.', null, '{}', 41),
  ('travail_0042', '2504', null, 'Titre II Des relations de travail', 'Chapitre 5 - Rupture de la relation de travail', 'Toute rupture de la relation de travail fondée sur un motif discriminatoire, frauduleux ou constitutif d’un abus de droit est interdite et peut donner lieu à réparation.', null, '{}', 42),
  ('travail_0043', '2505', null, 'Titre II Des relations de travail', 'Chapitre 5 - Rupture de la relation de travail', 'Toute rupture de la relation de travail peut faire l''objet d''un recours devant les juridictions compétentes.', null, '{}', 43),
  ('travail_0044', '3101', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 1 - Droits des entreprises', 'Toute entreprise légalement constituée dispose de la liberté d’entreprendre, d’exploiter, d’investir et de contracter sur le territoire de l’Etat de San Andreas, sous réserve du respect des lois et règlements en vigueur.', null, '{organisation}', 44),
  ('travail_0045', '3102', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 1 - Droits des entreprises', 'Aucune entreprise ne peut faire l’objet de sanctions, restrictions ou mesures coercitives sans fondement légal explicite, ni en dehors des procédures prévues par la loi.', null, '{organisation,procedure}', 45),
  ('travail_0046', '3103', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 1 - Droits des entreprises', 'Sous réserve des obligations légales, le dirigeant est libre :
- d’organiser la structure interne de son entreprise,
- de fixer ses horaires et ses méthodes de travail,
- de recruter et de licencier conformément à la loi.
Les autorités ne peuvent se substituer aux décisions de gestion sauf dans les cas expressément prévus par la loi.', null, '{organisation}', 46),
  ('travail_0047', '3104', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 1 - Droits des entreprises', 'Toute entreprise a droit à un traitement impartial, neutre et respectueux de la part des autorités administratives, fiscales et judiciaires.', null, '{organisation}', 47),
  ('travail_0048', '3105', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 1 - Droits des entreprises', 'Les données internes de l’entreprise, incluant notamment les données comptables, contractuelles, stratégiques, commerciales ou administratives, constituent des informations protégées. Tout salarié, prestataire ou dirigeant ayant accès à ces données est tenu à une obligation de confidentialité selon la loi en vigueur et les clauses de la charte.', null, '{organisation,environnement}', 48),
  ('travail_0049', '3201', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 2 - Responsabilité du dirigeant', 'Le dirigeant d’une entreprise est personnellement responsable de la gestion générale, administrative, sociale et financière de l’entreprise.', null, '{organisation}', 49),
  ('travail_0050', '3202', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 2 - Responsabilité du dirigeant', 'Cette responsabilité s’exerce notamment en matière :
- de respect des lois et règlements de l’Etat de San Andreas,
- de conformité des chartes des entreprises,
- de paiement des salaires et des charges obligatoires,
- de tenue sincère des documents comptables,
- de sécurité et d’intégrité des salariés dans l’exercice de leurs fonctions.', null, '{fraude,organisation}', 50),
  ('travail_0051', '3203', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 2 - Responsabilité du dirigeant', 'La responsabilité du dirigeant peut être engagée en cas d’action volontaire contraire à la loi ou en cas de négligence, d’inaction ou de manquement manifeste, ayant permis ou facilité une infraction. L’ignorance, la délégation informelle ou l’absence temporaire du dirigeant ne constituent pas une cause exonératoire.', null, '{circulation,organisation}', 51),
  ('travail_0052', '3204', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 2 - Responsabilité du dirigeant', 'La délégation de certaines fonctions (manager, chef d’équipe, comptable, avocat, tiers prestataire) n’exonère pas le dirigeant de sa responsabilité. Sauf si ladite délégation est formalisée par écrit, la personne déléguée dispose des moyens nécessaires à l’exercice de ses fonctions et que le dirigeant n’a pas connaissance d’un manquement manifeste.', null, '{organisation,procedure}', 52),
  ('travail_0053', '3205', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 2 - Responsabilité du dirigeant', 'En cas de manquement grave ou répété du dirigeant à ses obligations, les autorités compétentes peuvent prononcer des sanctions, conformément au présent Code, selon la gravité des faits.', null, '{organisation,procedure}', 53),
  ('travail_0054', '3301', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 3 - Obligation de coopération', 'Tout dirigeant d’une entreprise exerçant sur le territoire de l’Etat de San Andreas est personnellement tenu de coopérer avec les autorités compétentes dans le cadre de toute procédure administrative, fiscale ou judiciaire.', null, '{organisation,procedure}', 54),
  ('travail_0055', '3302', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 3 - Obligation de coopération', 'Cette obligation inclut notamment la transmission, sur demande écrite ou officielle, de tout document nécessaire à l’exercice des missions des autorités, incluant sans que cette liste soit limitative :
- les fichiers comptables tenus à jour,
- la charte d''entreprise,
- tout autre document interne utile à la vérification de la légalité des activités de l’entreprise.', null, '{organisation}', 55),
  ('travail_0056', '3303', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 3 - Obligation de coopération', 'Les documents demandés doivent être transmis dans un délai maximum de soixante-douze (72) heures à compter de la notification officielle, sauf délai spécifique fixé par l’autorité requérante.', null, '{organisation}', 56),
  ('travail_0057', '3304', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 3 - Obligation de coopération', 'Le refus de transmettre, la transmission volontairement incomplète, falsifiée ou tardive des documents constitue un manquement grave aux obligations du dirigeant.', null, '{organisation}', 57),
  ('travail_0058', '3401', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'En cas de manquement aux dispositions du présent Code, les autorités compétentes peuvent appliquer une ou plusieurs des sanctions suivantes, en fonction de la gravité des faits.', null, '{organisation,procedure}', 58),
  ('travail_0059', '3402', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Les sanctions administratives peuvent comprendre :
- un avertissement officiel,
- une amende administrative,
- une injonction de mise en conformité sous délai,
- une suspension temporaire d’activité.', null, '{organisation,procedure}', 59),
  ('travail_0060', '3403', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Lorsque les manquements affectent gravement la gestion de l’entreprise, les autorités peuvent prononcer :
- la suspension des fonctions dirigeantes,
- la révocation du dirigeant sur décision judiciaire.', null, '{organisation,procedure}', 60),
  ('travail_0061', '3404', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Lorsque les faits constituent une infraction pénale, le dossier est transmis au Département de la Justice, sans préjudice des sanctions administratives déjà appliquées.', null, '{organisation,procedure}', 61),
  ('travail_0062', '3405', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Toute sanction doit être proportionnée à la gravité des faits reprochés, au caractère intentionnel ou non du manquement et aux antécédents du dirigeant ou de l’entreprise.', null, '{organisation,procedure}', 62),
  ('travail_0063', '3406', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Toute personne sanctionnée dispose d’un droit de recours devant l’autorité compétente ou la juridiction désignée, dans un délai fixé par la notification de sanction.', null, '{organisation,procedure}', 63),
  ('travail_0064', '3407', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'En vertu de l’article 2101 du Code Général des Impôts, le service fiscal est habilité à procéder à tout contrôle, vérification ou enquête fiscale afin d’assurer le respect des obligations fiscales sur le Comté de Los Santos.', 'Applicable uniquement à Los Santos.', '{fraude,organisation,procedure}', 64),
  ('travail_0065', '3407.1', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'A cette fin, et en complément du Chapitre 3, Titre III du C.G.T.E. de l’État de San Andreas, les services fiscaux peuvent solliciter la communication de tout document comptable, financier ou administratif, accéder aux locaux d’une entreprise dans des fins utiles à l’enquête fiscale, entendre des personnes susceptibles de fournir des informations utiles à l’enquête fiscale, et recouper les données déclarées avec toute information légalement accessible.', 'Applicable uniquement à Los Santos.', '{organisation,procedure}', 65),
  ('travail_0066', '3407.2', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'A l’issue d’un contrôle fiscal, et en complément du Chapitre 4, Titre III du C.G.T.E. de l’État de San Andreas, lorsque des manquements ou infractions sont constatés, le service fiscal apprécie la gravité des faits, leur caractère intentionnel et/ou répété, ainsi que le montant des sommes fraudées. Selon cette appréciation, le service fiscal peut saisir le Département de la Justice afin d’engager des poursuites pénales ou choisir d’appliquer une sanction administrative.', 'Applicable uniquement à Los Santos.', '{fraude,organisation,procedure}', 66),
  ('travail_0067', '3407.3', null, 'Titre III Droits et devoirs du dirigeant', 'Chapitre 4 - Sanctions', 'Les sanctions administratives peuvent être des pénalités financières, des amendes administratives, des injonctions de mise en conformité, la suspension temporaire ou définitive d’autorisations municipales, la suspension temporaire de l’autorisation d’exercer sur le Comté de Los Santos, la fermeture administrative de l’entreprise.', 'Applicable uniquement à Los Santos.', '{organisation,procedure}', 67),
  ('travail_0068', '4101', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'La médecine du travail a pour objet de prévenir toute altération de la santé physique ou mentale des travailleurs du fait de leur activité professionnelle, d’évaluer l’aptitude au travail et de contribuer à la sécurité des personnes et des tiers.', null, '{}', 68),
  ('travail_0069', '4102', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'Les missions de santé professionnelle sont assurées par les services médicaux agréés de l’Etat de San Andreas.', null, '{}', 69),
  ('travail_0070', '4103', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'Les services médicaux professionnels sont notamment habilités à :
- procéder à des examens médicaux en lien avec l’activité professionnelle,
- constater les blessures et pathologies liées au travail,
- délivrer des certificats d''arrêt temporaire de travail,
- participer aux enquêtes en cas d’accident du travail,
- formuler des recommandations en matière de santé et de sécurité.', null, '{}', 70),
  ('travail_0071', '4104', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'Les services médicaux professionnels peuvent, avec l’accord de l’employeur ou sur réquisition d’une autorité compétente, accéder aux lieux de travail pour l’exercice de leurs missions. L’employeur est tenu de faciliter leurs interventions.', null, '{}', 71),
  ('travail_0072', '4105', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'Les informations médicales sont couvertes par le secret médical. Seules les conclusions relatives à l’aptitude, aux restrictions ou à l’inaptitude peuvent être communiquées à l’employeur.', null, '{}', 72),
  ('travail_0073', '4106', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 1 - Services médicaux professionnels', 'Tout travailleur ou employeur peut solliciter une évaluation médicale en lien avec une activité professionnelle.', null, '{}', 73),
  ('travail_0074', '4201', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 2 - Responsabilité du dirigeant', 'Le dirigeant d’une entreprise, association ou organisme employant du personnel est tenu de prendre les mesures raisonnables nécessaires pour assurer la protection de la santé physique et mentale et la sécurité des travailleurs.', null, '{organisation}', 74),
  ('travail_0075', '4202', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 2 - Responsabilité du dirigeant', 'Le dirigeant est tenu d''organiser une visite de contrôle de santé et de sécurité, avec les services médicaux professionnels, au moins une fois par mois.', null, '{organisation}', 75),
  ('travail_0076', '4203', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 2 - Responsabilité du dirigeant', 'Le dirigeant est tenu de respecter les certificats, restrictions et recommandations émis par les services médicaux professionnels. Tout manquement engage sa responsabilité.', null, '{organisation}', 76),
  ('travail_0077', '4204', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 2 - Responsabilité du dirigeant', 'En cas de risque grave pour la santé ou la sécurité, les autorités compétentes peuvent, sur avis médical :
- imposer des mesures correctives,
- restreindre ou suspendre une activité,
- ordonner la fermeture temporaire d’un site.', null, '{organisation}', 77),
  ('travail_0078', '4205', null, 'Titre IV Santé et sécurité au travail', 'Chapitre 2 - Responsabilité du dirigeant', 'Le non-respect des obligations prévues au présent Titre expose le dirigeant et l’entreprise à des sanctions administratives, civiles ou pénales.', null, '{organisation,procedure}', 78),
  ('travail_0079', '5101', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'Est considérée comme association ou organisation à but non lucratif toute personne morale constituée dans un objectif d’intérêt général, social, culturel, humanitaire, éducatif, médical, sportif ou caritatif, ne poursuivant aucun objectif de distribution de bénéfices à ses dirigeants, membres ou fondateurs.', null, '{organisation}', 79),
  ('travail_0080', '5102', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'Les associations légalement déclarées peuvent :
- détenir des fonds,
- conclure des contrats,
- organiser des événements,
- recevoir des dons ou subventions,
- employer du personnel salarié ou bénévole.
Elles ne peuvent exercer une activité commerciale qu’à titre accessoire, strictement nécessaire à la réalisation de leur objet.', null, '{}', 80),
  ('travail_0081', '5103', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'Aucun dirigeant, fondateur ou membre d’une association ne peut :
- percevoir de dividendes de l''association,
- s’approprier directement ou indirectement les fonds de l’association,
- utiliser les ressources de l’association à des fins personnelles.
Toute violation de cet article est assimilée à un détournement de fonds.', null, '{fraude,organisation}', 81),
  ('travail_0082', '5104', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'Toute association est tenue de :
- tenir une comptabilité claire, sincère et accessible,
- être en mesure de fournir tout document comptable ou administratif à la demande des autorités compétentes,
- déclarer toute subvention publique reçue.
Les associations sont soumises au contrôle des autorités, conformément au Code Général des Impôts, dans les mêmes conditions que les entreprises privées.', null, '{fraude}', 82),
  ('travail_0083', '5105', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'En cas de dissolution volontaire ou judiciaire, les fonds restants ne peuvent en aucun cas être redistribués aux membres. Ils sont reversés à une autre association reconnue ou au budget de comté dans lequel l''association dissoute a été déclarée au moment de sa création.', null, '{}', 83),
  ('travail_0084', '5106', null, 'Titre V Autres dispositions', 'Chapitre 1 - Associations', 'Toute association contrevenant aux dispositions du présent Chapitre s’expose à des sanctions conformément au présent Code.', null, '{procedure}', 84),
  ('travail_0085', '5201', null, 'Titre V Autres dispositions', 'Chapitre 2 - Loteries et jeux d''argent', 'Est considéré comme loterie tout tirage au sort ayant un coût à la participation et une récompense pour le/les gagnant(s).', null, '{fraude}', 85),
  ('travail_0086', '5202', null, 'Titre V Autres dispositions', 'Chapitre 2 - Loteries et jeux d''argent', 'Est considéré comme jeux d’argent tous divertissements ou jeu de hasard impliquant des gains ou des pertes financières ou matérielles.', null, '{fraude}', 86),
  ('travail_0087', '5203', null, 'Titre V Autres dispositions', 'Chapitre 2 - Loteries et jeux d''argent', 'Est considéré comme compétition toute organisation divertissante ayant un coût à la participation et une récompense pour le/les gagnant(s).', null, '{fraude,organisation}', 87),
  ('travail_0088', '5204', null, 'Titre V Autres dispositions', 'Chapitre 2 - Loteries et jeux d''argent', 'Toute loterie et tout jeu d’argent doit être déclaré auprès d''une Mairie de comté.', null, '{fraude}', 88),
  ('travail_0089', '5301', null, 'Titre V Autres dispositions', 'Chapitre 3 - Autre', 'Toute entreprise dont l''activité principale ou secondaire est la vente ou la location de véhicules motorisés (voitures, motos, utilitaires) est autorisée à vérifier la validité du permis de conduire du futur propriétaire du véhicule avant tout prêt ou achat.', null, '{circulation}', 89);

-- Code maritime civil
drop table if exists cabinet_codes_maritime;
create table cabinet_codes_maritime (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_maritime enable row level security;

insert into cabinet_codes_maritime (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('maritime_0001', '1101', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Définitions', 'Est considérée comme embarcation tout engin flottant, motorisé ou non, conçu ou utilisé pour transporter une ou plusieurs personnes sur les eaux intérieures ou maritimes.', null, '{circulation}', 1),
  ('maritime_0002', '1102', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Définitions', 'La navigation des embarcations civiles est libre dans les eaux de l’Etat de San Andreas, sous réserve du respect des règles prévues par le présent Code et des mesures de sécurité publique.', null, '{circulation}', 2),
  ('maritime_0003', '1201', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'Il existe deux catégories d''embarcations :
- Catégorie 1 : les embarcations motorisées légères et les voiliers (ex : jetski et marquis)
- Catégorie 2 : les embarcations motorisées semi-rigides et rigides', null, '{circulation}', 3),
  ('maritime_0004', '1202', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'La conduite d’une embarcation relevant de la catégorie 2 est soumise à la détention d’un permis de navigation valide.', null, '{circulation}', 4),
  ('maritime_0005', '1203', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'Le permis de navigation est délivré par des organismes de formation agréés par l’Etat.', null, '{circulation}', 5),
  ('maritime_0006', '1204', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'Le permis de navigation comprend :
- une épreuve théorique destinée à vérifier les connaissances réglementaires et de sécurité,
- une épreuve pratique, d''une durée d''environ quinze (15) minutes, destinée à évaluer l’aptitude à la conduite d’une embarcation.', null, '{circulation}', 6),
  ('maritime_0007', '1205', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'Les organismes agréés sont habilités à dispenser des formations théoriques et pratiques préparatoires à l’obtention du permis.', null, '{circulation}', 7),
  ('maritime_0008', '1206', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Catégories d''embarcation  et permis', 'Le prix du passage du permis bateau s''élève à 10,000$', null, '{circulation}', 8),
  ('maritime_0009', '1301', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du chef de bord  et sécurité maritime', 'Le chef de bord est responsable de la sécurité de l’embarcation, de ses occupants et du respect des règles de navigation.', null, '{circulation,organisation}', 9),
  ('maritime_0010', '1302', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du chef de bord  et sécurité maritime', 'Avant chaque départ, le chef de bord doit s’assurer :
- de la conformité et du bon état de l’embarcation,
- de la présence des équipements de sécurité obligatoires,
- de la compatibilité des conditions météorologiques avec la navigation envisagée.', null, '{circulation,organisation}', 10),
  ('maritime_0011', '1303', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du chef de bord  et sécurité maritime', 'Toute embarcation doit être équipée au minimum :
- d’un gilet de sauvetage par personne embarquée,
- d’un moyen de communication d’urgence fonctionnel.', null, '{circulation,organisation}', 11),
  ('maritime_0012', '1304', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Responsabilités du chef de bord  et sécurité maritime', 'Tout accident ou incident maritime impliquant une embarcation doit être signalé sans délai aux autorités compétentes.', null, '{circulation,organisation}', 12),
  ('maritime_0013', '2101', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 1 - Typologie des zones', 'L’espace maritime de l’Etat de San Andreas est divisé en :
- zones libres (ZL),
- zones réglementées (ZR),
- zones interdites (ZI).', null, '{}', 13),
  ('maritime_0014', '2102', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 1 - Typologie des zones', 'Les zones libres correspondent aux espaces non soumis à une réglementation spécifique.', null, '{}', 14),
  ('maritime_0015', '2103', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 1 - Typologie des zones', 'Dans les zones réglementées (en jaune sur la carte ci-contre), la vitesse maximale est limitée à vingt (20) nœuds (soit environ trente-sept (37) km/h).', null, '{}', 15),
  ('maritime_0016', '2104', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 1 - Typologie des zones', 'La navigation civile et commerciale est interdite dans les zones interdites (en rouge sur la carte ci-contre), sauf dérogation accordée aux services publics.', null, '{circulation}', 16),
  ('maritime_0017', '2105', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 1 - Typologie des zones', 'La navigation est interdite dans un rayon de 100 mètres autour des sites suivants :
- Aéroport international de Los Santos,
- installations de recherche sensibles.
Les zones réglementées et interdites sont déterminées par décret du Gouvernement de l’Etat de San Andreas.', null, '{circulation}', 17),
  ('maritime_0018', '2201', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 2 - Ports et infrastructures', 'Le port de Los Santos est habilité à accueillir les navires commerciaux.', null, '{}', 18),
  ('maritime_0019', '2202', 'PARTIE I', 'Titre II Zones navigables et infrastructures', 'Chapitre 2 - Ports et infrastructures', 'Les marinas de Puerto del Sol, Grapeseed, Alamo Sea (Sandy Shores) et Paleto Sud sont habilitées à accueillir les embarcations de plaisance.', null, '{circulation}', 19),
  ('maritime_0020', '3101', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre 1 - Contrôles', 'Les embarcations peuvent faire l’objet de contrôles de sécurité par les autorités compétentes dans les eaux relevant de la juridiction de l’Etat, dans le respect des garanties constitutionnelles applicables.', null, '{circulation}', 20),
  ('maritime_0021', '3201', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre 2 - Suspension du trafic maritime', 'En cas de danger grave ou de circonstances exceptionnelles, le Gouvernement de l’Etat de San Andreas ou une Mairie de comté peut ordonner la suspension temporaire de la navigation civile sur sa juridiction.', null, '{circulation,organisation}', 21),
  ('maritime_0022', '3202', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre 2 - Suspension du trafic maritime', 'Pendant une suspension, toute sortie de port est interdite et les embarcations en navigation doivent rejoindre le port ou abri le plus proche.', null, '{circulation,organisation}', 22),
  ('maritime_0023', '3203', 'PARTIE I', 'Titre III Mesures exceptionnelles', 'Chapitre 2 - Suspension du trafic maritime', 'Les dispositions du présent Titre ne s’appliquent pas aux embarcations des services publics, sauf mention expresse contraire.
Texte
Titre', null, '{circulation,organisation}', 23),
  ('maritime_0024', '4101', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Toute embarcation motorisée est réputée immatriculée dès lors qu’un certificat d’immatriculation valide a été produit et peut être présenté. À défaut de production de ce document dans un délai de quarante-huit (48) heures suivant l’acquisition auprès d’une mairie de comté, l’embarcation est considérée comme non immatriculée et constitue une infraction.', null, '{circulation}', 24),
  ('maritime_0025', '4102', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Tout abandon d''embarcation, en mer ou sans autorisation sur un zone de stationnement est reconnu comme abandon d''embarcation et constitue une infraction.', null, '{circulation}', 25),
  ('maritime_0026', '4103', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Tout bloquage des zones de départ ou d''arrivée par une embarcation est reconnu comme entrave au trafic maritime et constitue une infraction.', null, '{corruption,circulation,organisation}', 26),
  ('maritime_0027', '4104', 'PARTIE II - INFRACTIONS', 'Titre IV Infractions', 'Chapitre unique', 'Tout non respect des vitesses réglementaires définies par le présent Code constitue une infraction.', null, '{}', 27);

-- Code pénal (texte)
drop table if exists cabinet_codes_penal_texte;
create table cabinet_codes_penal_texte (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_penal_texte enable row level security;

insert into cabinet_codes_penal_texte (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('penal_0001', 'Préambule', 'Partie I', 'Préambule et définitions générales', null, 'Le présent Code pénal est adopté par l’Etat fédéré de San Andreas conformément à la Constitution des Etats-Unis, aux Amendements constitutionnels applicables, ainsi qu’à la Constitution de l’État de San Andreas.

Les dispositions du présent Code sont interprétées conformément au Statut d’interprétation et d’application des lois de l’Etat de San Andreas.

Définitions générales : 
Est considérée comme une arme tout objet conçu ou utilisé pour porter atteinte à l’intégrité physique d’autrui.
Constitue une autorité publique toute personne investie d’une mission de service public ou exerçant une fonction judiciaire, administrative ou de sécurité.
Est considéré comme lieu public tout lieu accessible au public, de manière libre ou conditionnelle.
Un ordre est légal lorsqu’il est donné par une autorité compétente dans le cadre de ses fonctions et conformément à la loi.', null, '{armes}', 1),
  ('penal_0002', '1101', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 1 - Hiérarchie des normes', 'Toute disposition du présent Code s’interprète et s’applique conformément à la Constitution des Etats-Unis, à ses amendements, ainsi qu’à la Constitution de l’Etat de San Andreas. Toute disposition contraire est réputée inapplicable.', null, '{}', 2),
  ('penal_0003', '1102', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 1 - Hiérarchie des normes', 'Nul ne peut être poursuivi, condamné ou sanctionné pénalement sans le respect strict des garanties procédurales, du droit à un procès équitable et du principe du contradictoire.', null, '{procedure}', 3),
  ('penal_0004', '1201', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 2 - Légalité et responsabilité pénale', 'Nul ne peut être déclaré coupable d’une infraction pénale si les faits reprochés ne sont pas expressément définis par la loi en vigueur au moment de leur commission.', null, '{}', 4),
  ('penal_0005', '1202', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 2 - Légalité et responsabilité pénale', 'La loi pénale ne peut s’appliquer rétroactivement, sauf lorsqu’elle est plus favorable à la personne poursuivie.', null, '{}', 5),
  ('penal_0006', '1203', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 2 - Légalité et responsabilité pénale', 'Nul n’est pénalement responsable que de son propre fait.', null, '{}', 6),
  ('penal_0007', '1301', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 3 - Élément intentionnel', 'Sauf disposition expresse contraire, les infractions définies par le présent Code requièrent la preuve d’un comportement intentionnel, en connaissance de cause, imprudent ou négligent, conformément aux catégories définies ci-dessous.', null, '{procedure}', 7),
  ('penal_0008', '1302', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 3 - Élément intentionnel', 'Une infraction est intentionnelle lorsque l’auteur a agi avec la volonté délibérée de commettre l’acte prohibé ou d’en provoquer le résultat.', null, '{}', 8),
  ('penal_0009', '1303', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 3 - Élément intentionnel', 'Une infraction est commise en connaissance de cause lorsque l’auteur savait que son comportement était susceptible de produire un résultat prohibé.', null, '{}', 9),
  ('penal_0010', '1304', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 3 - Élément intentionnel', 'Une infraction est commise par imprudence lorsque l’auteur a consciemment pris un risque substantiel et injustifié.', null, '{}', 10),
  ('penal_0011', '1305', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 3 - Élément intentionnel', 'Une infraction est commise par négligence lorsque l’auteur n’a pas perçu un risque que toute personne raisonnable aurait identifié dans les mêmes circonstances.', null, '{}', 11),
  ('penal_0012', '1401', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 4 - Tentative, complicité et concours', 'Il y a tentative lorsqu’une personne, avec l’intention requise, accomplit un acte substantiel en vue de la commission d’une infraction, sans que celle-ci n’aboutisse.', null, '{}', 12),
  ('penal_0013', '1402', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 4 - Tentative, complicité et concours', 'Est pénalement responsable comme auteur ou complice toute personne qui aide, encourage, ordonne ou facilite sciemment la commission d’une infraction.', null, '{}', 13),
  ('penal_0014', '1403', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 4 - Tentative, complicité et concours', 'La conspiration est constituée lorsqu’au moins deux personnes s’entendent en vue de commettre une infraction et accomplissent un acte manifeste en ce sens.', null, '{organisation}', 14),
  ('penal_0015', '1501', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 5 - Causes d''éxonération', 'N’est pas pénalement responsable la personne qui fait un usage raisonnable et proportionné de la force lorsqu’elle croit raisonnablement faire face à une menace immédiate et illégale (Titre II du présent Code).', null, '{violence}', 15),
  ('penal_0016', '1502', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 5 - Causes d''éxonération', 'L’usage de la force létale peut être justifié dans un lieu où la personne est légalement présente, lorsque celle-ci a une croyance raisonnable et objective qu’une telle force est nécessaire pour prévenir un décès, une blessure grave ou un crime violent.', null, '{}', 16),
  ('penal_0017', '1601', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 6 - Prescription de l''action pénale', 'L’action pénale s’éteint par l’écoulement d’un délai de prescription à compter de la commission de l’infraction, sous réserve des exceptions prévues par la loi.', null, '{procedure}', 17),
  ('penal_0018', '1602', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 6 - Prescription de l''action pénale', 'Sauf disposition contraire, le délai de prescription est de :
- quatorze (14) jours pour les infractions mineures,
- vingt-et-un (21) jours pour les délits,
- soixante (60) jours pour les crimes.
Les crimes majeurs sont imprescriptibles.', null, '{procedure}', 18),
  ('penal_0019', '1603', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 6 - Prescription de l''action pénale', 'Le délai de prescription court à compter du jour où l’infraction a été commise. Pour les infractions dissimulées ou continues, le délai court à compter du jour où elles ont été révélées ou ont cessé.', null, '{procedure}', 19),
  ('penal_0020', '1604', 'PARTIE I', 'Titre I Principes généraux du droit pénal', 'Chapitre 6 - Prescription de l''action pénale', 'Tout acte d’enquête, de poursuite ou de jugement régulièrement accompli interrompt le délai de prescription.', null, '{procedure}', 20),
  ('penal_0021', '2101', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 1 - Principes généraux', 'L’usage de la force, y compris de la force létale, engage la responsabilité pénale de son auteur, sauf lorsqu’il est justifié par une cause d’irresponsabilité prévue par le présent Titre.', null, '{}', 21),
  ('penal_0022', '2102', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 1 - Principes généraux', 'La légalité de l’usage de la force est appréciée souverainement par l’autorité judiciaire, au regard des circonstances connues ou raisonnablement perçues par l’auteur au moment des faits.', null, '{}', 22),
  ('penal_0023', '2201', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 2 - Légitime défense', 'N’est pas pénalement responsable la personne qui fait usage de la force de manière nécessaire et proportionnée afin de se défendre ou de défendre autrui contre une agression illégale, imminente et réelle.', null, '{violence}', 23),
  ('penal_0024', '2202', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 2 - Légitime défense', 'La légitime défense est reconnue lorsque les conditions suivantes sont réunies :
- l’existence d’une agression illégale,
- le caractère imminent de cette agression,
- la nécessité de la riposte,
- la proportionnalité entre la gravité de l’agression et les moyens de défense employés.', null, '{violence}', 24),
  ('penal_0025', '2203', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 2 - Légitime défense', 'Lorsque la légitime défense est invoquée de manière crédible, il appartient à l’accusation d’établir l’absence d’une ou plusieurs conditions prévues à l’Article 2202.', null, '{}', 25),
  ('penal_0026', '2301', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 3 - Usage de la force létale', 'L’usage de la force létale n’est justifié qu’en cas de menace immédiate et raisonnablement perçue de mort, de blessure grave ou de crime violent majeur.', null, '{violence}', 26),
  ('penal_0027', '2302', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 3 - Usage de la force létale', 'L’usage de la force létale ne peut être justifié par la seule protection de biens matériels, en l’absence de menace directe contre les personnes.', null, '{violence}', 27),
  ('penal_0028', '2401', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 4 - Devoir de retrait', 'Hors des exceptions prévues par le présent Titre, une personne doit, lorsque cela est raisonnablement possible et sans danger accru, se retirer ou éviter la confrontation avant de faire usage de la force létale.', null, '{}', 28),
  ('penal_0029', '2402', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 4 - Devoir de retrait', 'Une personne légalement présente en un lieu où elle est autorisée à se trouver n’a pas l’obligation de se retirer avant de faire usage de la force, y compris létale, lorsque les conditions de la légitime défense prévues aux Articles 2201 et 2202 sont réunies.', null, '{}', 29),
  ('penal_0030', '2501', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 5 - Doctrine Castle', 'Lorsqu’une personne fait usage de la force contre un intrus ayant pénétré illégalement et de manière violente dans un domicile, un véhicule occupé ou un lieu privé assimilé, l’existence d’une menace grave est présumée, sauf preuve contraire.', null, '{violence,circulation,procedure}', 30),
  ('penal_0031', '2502', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 5 - Doctrine Castle', 'La présomption prévue à l’Article 2501 ne s’applique pas lorsque :
- l’intrus est un agent public agissant légalement,
- l’auteur a provoqué intentionnellement l’intrusion,
- l’intrus ne représente manifestement pas une menace.', null, '{violence,corruption}', 31),
  ('penal_0032', '2601', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 6 - Exclusions et abus', 'La légitime défense ne peut être invoquée par une personne ayant volontairement provoqué l’agression, sauf si elle a manifestement tenté de se désengager.', null, '{}', 32),
  ('penal_0033', '2602', 'PARTIE I', 'Titre II Usage de la force et légitime défense', 'Chapitre 6 - Exclusions et abus', 'L’usage de la force excédant manifestement ce qui était nécessaire ou proportionné exclut le bénéfice des dispositions du présent Titre.', null, '{}', 33),
  ('penal_0034', '3101', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 1 - Catégories d''infractions', 'Les infractions pénales sont classées comme suit :
- infractions mineures,
- délits,
- crimes.', null, '{procedure}', 34),
  ('penal_0035', '3201', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 2 - Principes de sanction', 'Toute peine doit être proportionnée à la gravité de l’infraction, au degré de culpabilité et aux circonstances de sa commission.', null, '{procedure}', 35),
  ('penal_0036', '3202', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 2 - Principes de sanction', 'Aucune amende ou peine ne peut être excessive au sens du Huitième Amendement de la Constitution des Etats-Unis d''Amérique et de la Section 13 de l''Article Ier de la Constitution de l''Etat de San Andreas.', null, '{procedure}', 36),
  ('penal_0037', '3203', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 2 - Principes de sanction', 'La peine capitale constitue une sanction pénale exceptionnelle applicable sur l’ensemble du territoire de l’État de San Andreas.
Elle ne peut être prononcée que par la Cour Suprême de l’État de San Andreas.
Les conditions de jugement et d’exécution sont fixées par le Code de procédures pénales.', null, '{procedure}', 37),
  ('penal_0038', '3301', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 3 - Détermination des peines', 'Selon le niveau de l''infraction commise, une peine nominale est appliquée (cf. Livret des peines). Cette peine nominale peut être ajustée selon certains facteurs atténuants ou aggravants.', null, '{procedure}', 38),
  ('penal_0039', '3302', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 3 - Détermination des peines', 'Peuvent notamment constituer des circonstances aggravantes :
- l’usage ou la menace d’une arme,
- la préméditation,
- la pluralité de victimes, 
- l’abus d’autorité ou de fonction,
- la vulnérabilité particulière de la victime,
- la participation à une organisation criminelle,
- Menace et intimidation sur agents des service public.
- Les crimes et délits portant atteinte à l’intégrité physique d’un agent des services publics en service.', null, '{armes,violence,organisation,procedure}', 39),
  ('penal_0040', '3303', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 3 - Détermination des peines', 'Peuvent notamment constituer des circonstances atténuantes :
- l’absence d’antécédents,
- la coopération avec les autorités,
- la réparation volontaire du dommage, 
- la contrainte ou l’influence significative,
- l’âge ou l’état de santé.', null, '{procedure}', 40),
  ('penal_0041', '3304', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 3 - Détermination des peines', 'L’aggravation d’une peine peut être décidée par le juge en fonction des circonstances particulières de l’affaire et de la personnalité de l’auteur, dans les limites prévues par la loi.', null, '{procedure}', 41),
  ('penal_0042', '3305', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 3 - Détermination des peines', 'En cas de concours d’infractions, les amendes peuvent être cumulatives mais seule la plus longue durée d’emprisonnement est appliquée.', null, '{procedure}', 42),
  ('penal_0043', '3401', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 4 - Peines alternatives', 'La probation peut être ordonnée lorsque la réhabilitation du condamné apparaît possible sans incarcération.', null, '{procedure}', 43),
  ('penal_0044', '3402', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 4 - Peines alternatives', 'Des travaux d’intérêt général peuvent être prononcés en substitution ou en complément d’une peine.', null, '{procedure}', 44),
  ('penal_0045', '3403', 'PARTIE I', 'Titre III Classification des infractions et sanctions', 'Chapitre 4 - Peines alternatives', 'Le juge peut ordonner des programmes de traitement, de formation ou de suivi psychologique.
Texte
Article
Enoncée', null, '{procedure}', 45),
  ('penal_0046', '4101', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait, pour une personne tenue par une obligation légale spécifique d’agir, de s’abstenir volontairement de porter assistance à une personne en danger immédiat est reconnu comme non-assistance à personne en danger et constitue une infraction pénale, lorsqu’une intervention était possible sans risque disproportionné.', null, '{violence}', 46),
  ('penal_0047', '4102', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait d’exposer délibérément une personne à un risque immédiat de mort ou de blessure grave par un comportement imprudent ou dangereusement irresponsable est reconnu comme mise en danger de la vie d''autrui et constitue une infraction pénale.', null, '{violence,homicide}', 47),
  ('penal_0048', '4103', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de porter atteinte volontairement à l’intégrité physique d’autrui est reconnu comme violence et constitue une infraction pénale.', null, '{violence}', 48),
  ('penal_0049', '4104', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de porter volontairement atteinte à l’intégrité physique d’autrui à l’aide d’une arme blanche, ou de tout objet assimilé par destination, est reconnu comme violence avec arme blanche et constitue une infraction pénale.', null, '{armes,violence}', 49),
  ('penal_0050', '4105', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de porter volontairement atteinte à l’intégrité physique d’autrui par l’usage, la menace immédiate ou le tir d’une arme à feu, est reconnu comme violence avec arme à feu et constitue une infraction pénale.', null, '{armes,violence}', 50),
  ('penal_0051', '4106', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de commettre volontairement des violences caractérisées par une cruauté extrême ou des traitements inhumains portant atteinte grave à la dignité humaine est reconnu comme acte de barbarie et constitue une infraction pénale', null, '{violence}', 51),
  ('penal_0052', '4107', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait d’infliger intentionnellement à une personne des souffrances physiques ou psychologiques graves afin d’obtenir une information, une punition, une intimidation ou un avantage est reconnu comme torture et constitue une infraction pénale.', null, '{violence}', 52),
  ('penal_0053', '4108', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de proférer des menaces ou d’exercer des intimidations, par tout moyen, dans le but de contraindre ou d’influencer le comportement d’autrui est reconnu comme menace et intimidation et constitue une infraction pénale.', null, '{violence}', 53),
  ('penal_0054', '4109', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 1 - Violences et atteintes physiques', 'Le fait de prélever, vendre, acheter, céder, transporter ou obtenir un organe humain en dehors de tout cadre légal, notamment en échange d’une contrepartie financière ou matérielle, est reconnu comme trafic d’organes et constitue une infraction pénale.', null, '{violence,organisation}', 54),
  ('penal_0055', '4201', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 2 - Infractions sexuelles', 'Le fait d’exposer volontairement ses parties intimes dans un lieu public ou accessible au public, sans justification légitime, est reconnu comme exhibition sexuelle et constitue une infraction pénale.', null, '{sexuel}', 55),
  ('penal_0056', '4202', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 2 - Infractions sexuelles', 'Toute atteinte sexuelle commise sans consentement libre et éclairé est reconnue comme agression sexuelle et constitue une infraction pénale.', null, '{violence,sexuel}', 56),
  ('penal_0057', '4203', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 2 - Infractions sexuelles', 'Tout acte de pénétration sexuelle, de quelque nature qu''il soit, est reconnu comme viol et constitue une infraction pénale.', null, '{sexuel}', 57),
  ('penal_0058', '4204', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 2 - Infractions sexuelles', 'Le fait de favoriser, d’organiser, de protéger et/ou de tirer profit de la prostitution d’autrui caractérise le proxénétisme et constitue une infraction pénale, considéré comme un crime majeur.', 'Applicable uniquement à Los Santos.', '{sexuel,environnement}', 58),
  ('penal_0059', '4204.1', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 2 - Infractions sexuelles', 'Le proxénétisme est condamné de 150,000$ d’amende et 120 minutes d’emprisonnement, avec obligation d’être jugé devant un tribunal.', 'Applicable uniquement à Los Santos.', '{sexuel,procedure}', 59),
  ('penal_0060', '4301', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 3 - Atteintes à la liberté individuelle', 'Le fait de priver une personne de sa liberté de mouvement par violence, menace ou contrainte, en dehors de toute autorité légale, est reconnu comme enlèvement et séquestration et constitue une infraction pénale.', null, '{violence}', 60),
  ('penal_0061', '4302', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 3 - Atteintes à la liberté individuelle', 'Le fait de détenir, retenir ou séquestrer une personne contre sa volonté, sans exiger de bien matériel ou financier en contrepartie de sa libération, constitue une prise d’otage sans rançon. La qualification est subordonnée à l’existence d’un échange de principe intervenant dans le cadre de négociations, pouvant porter sur des engagements opérationnels d’un service public. L’infraction est constituée dès lors que la privation de liberté est volontaire et exercée par menace, violence ou contrainte et constitue une infraction pénale.', null, '{violence}', 61),
  ('penal_0062', '4303', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 3 - Atteintes à la liberté individuelle', 'Le fait de détenir, retenir ou séquestrer une personne contre sa volonté en exigeant un bien matériel ou financier en contrepartie de sa libération constitue une prise d’otage avec rançon. L’infraction est constituée dès la formulation d’une demande, expresse ou implicite, de rançon, quelle qu’en soit la nature et constitue une infraction pénale.', null, '{}', 62),
  ('penal_0063', '4401', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait de refuser un droit, un service ou un avantage à une personne en raison d’un critère protégé par la loi est reconnu comme discrimination et constitue une infraction pénale, lorsqu’un tel refus n’est pas légalement justifié.', null, '{environnement}', 63),
  ('penal_0064', '4402', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait d’imposer à une personne, de manière répétée, des comportements, communications ou pressions portant atteinte à sa tranquillité, sa dignité ou sa sécurité est reconnu comme harcèlement (ou cyberharcèlement en cas de harcèlement via un moyen de communication électronique) et constitue une infraction pénale.', null, '{sexuel,ordre_public}', 64),
  ('penal_0065', '4403', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait de tirer profit de la vulnérabilité d’une personne pour obtenir un avantage indu est reconnu comme abus de faiblesse et constitue une infraction pénale.', null, '{fraude}', 65),
  ('penal_0066', '4404', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait de proférer une insulte grave, offensant un individu, dans le but de l''affecter moralement est reconnu comme injure et constitue une infraction pénale.', null, '{}', 66),
  ('penal_0067', '4405', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Tout propos, comportement ou acte à caractère raciste ou haineux est reconnu comme un délit.
Sont considérés comme propos à caractère raciste toute expression, parole ou comportement visant à discriminer, humilier ou inciter à la haine envers une personne ou un groupe en raison de son origine, de son ethnie ou de sa couleur de peau.
Toute infraction au présent article est punie d’une amende de quinze mille (15 000) dollars et d’une peine de détention de quinze (15) minutes.', 'Applicable uniquement sur Los Santos.', '{procedure}', 67),
  ('penal_0068', '4406', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait de tenir, publiquement ou en privé, toute allégation ou imputation d’un fait inexact ou non vérifié portant atteinte à l’honneur ou à la réputation d’une personne est reconnu comme diffamation et constitue une infraction pénale.
La diffusion, par tout moyen, de propos diffamatoires est également constitutive de l’infraction.
La diffamation est punie d’une amende de dix mille (10 000) dollars et d’une peine de détention de dix (10) minutes.', null, '{procedure}', 68),
  ('penal_0069', '4407', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 4 - Atteintes à la dignité et à l’égalité', 'Le fait d''imposer à quelqu’un sans son consentement, de façon répétée, des propos ou comportements à connotation sexuelle.
Est constitutif de harcèlement sexuel tout propos ou comportement à caractère sexuel non désiré et répété ayant pour effet de porter atteinte à la dignité d’une personne ou de créer une situation humiliante.', 'Applicable uniquement sur Los Santos.', '{sexuel}', 69),
  ('penal_0070', '4501', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 5 - Atteintes à la vie', 'Le fait de causer intentionnellement la mort d’autrui constitue un homicide.', null, '{homicide}', 70),
  ('penal_0071', '4502', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 5 - Atteintes à la vie', 'Le fait de causer la mort d’autrui par imprudence ou négligence grave constitue un homicide involontaire.', null, '{homicide}', 71),
  ('penal_0072', '4503', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 5 - Atteintes à la vie', 'Le fait de donner volontairement la mort à autrui avec préméditation ou dans des circonstances révélant une intention délibérée de tuer est reconnu comme assassinat et constitue une infraction pénale.', null, '{homicide}', 72),
  ('penal_0073', '4504', 'PARTIE 2', 'Titre IV Infractions contre les personnes', 'Chapitre 5 - Atteintes à la vie', 'Le fait de tenter de tuer ou de causer un préjudice menaçant la vie d''une autre personne, de manière délibérée et intentionnelle, est reconnu comme tentative d''homicide et constitue une infraction pénale.', null, '{homicide}', 73),
  ('penal_0074', '5101', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'La soustraction frauduleuse d’un bien appartenant à autrui est reconnu comme vol et constitue une infraction pénale.', null, '{vol}', 74),
  ('penal_0075', '5102', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait de soustraire un bien à autrui par la violence, la menace ou l’usage d’une arme est reconnu comme braquage et constitue une infraction pénale.', null, '{armes,violence,vol}', 75),
  ('penal_0076', '5103', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait de pénétrer illégalement dans un lieu avec l’intention d’y commettre un vol est reconnu comme cambriolage et constitue une infraction pénale.', null, '{vol}', 76),
  ('penal_0077', '5104', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait de détenir, dissimuler ou utiliser sciemment un bien provenant d’une infraction pénale est reconnu comme recel et constitue une infraction pénale.', null, '{vol}', 77),
  ('penal_0078', '5105', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait d’obtenir un bien, un service ou un avantage par menace, contrainte ou pression illégitime est reconnu comme extorsion et constitue une infraction pénale.', null, '{violence,vol}', 78),
  ('penal_0079', '5106', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait de reproduire, distribuer ou utiliser frauduleusement un bien protégé par un droit de propriété intellectuelle est reconnu comme contrefaçon et constitue une infraction pénale.', null, '{fraude,environnement}', 79),
  ('penal_0080', '5107', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Est constitutive d’une violation de propriété privée le fait, pour toute personne, de pénétrer ou de se maintenir sans autorisation préalable du propriétaire ou de son représentant légal dans une propriété privée dûment identifiée comme telle. Toute violation de propriété privée est punie d’une amende de 5 000 $ ainsi que d’une peine de 10 minutes d’incarcération.', null, '{procedure}', 80),
  ('penal_0081', '5107.1', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Ne constitue pas une violation de propriété privée :
1.L’intervention d’un agent des forces de l’ordre en service, agissant sur présentation d’un mandat
délivré par le Bureau du Procureur ou toute autorité judiciaire compétente ou en cas de flagrance d’un délit ou crime nécessitant une intervention immédiate.
2.Toute intervention d’urgence justifiée par un péril imminent mettant en danger la vie ou l’intégrité physique d’une personne.', null, '{organisation,procedure}', 81),
  ('penal_0082', '5108', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'Le fait de détruire, dégrader ou détériorer un bien appartenant à autrui, qu’il s’agisse d’un bien public ou privé, est reconnu comme dégradation de bien et constitue une infraction pénale. Toute tentative est punie dans les mêmes conditions.', null, '{}', 82),
  ('penal_0083', '5108.1', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'La dégradation de bien est punie d’une amende dont le montant est fixé en fonction de la gravité des dommages constatés et de leur coût estimé.
Cette amende ne peut être inférieure à cinq mille dollars (5 000 $) ni supérieure à cinquante mille dollars (50 000 $).
L’autorité compétente apprécie le montant de l’amende au regard notamment :
• de l’étendue des dégradations ;
• de la valeur du bien concerné ;
• du coût des réparations ou du remplacement ;
• ainsi que des circonstances dans lesquelles les faits ont été commis.', null, '{}', 83),
  ('penal_0084', '5108.2', 'PARTIE 2', 'Titre V Infractions contre les biens', 'Chapitre unique', 'L’infraction de dégradation de bien constitue une infraction autonome.
Elle ne peut être retenue cumulativement avec une infraction de refus d’obtempérer lorsque les dégradations sont commises directement dans le cadre d’une course-poursuite avec les forces de l’ordre.
En dehors de cette situation, les infractions peuvent être retenues cumulativement lorsque les faits sont distincts ou détachables.', null, '{circulation,procedure}', 84),
  ('penal_0085', '6101', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le fait de porter une arme ou de munitions soumise à autorisation sans être titulaire du permis requis est reconnu comme défaut de permis de port d''arme civil (PPA) et constitue une infraction pénale.', null, '{armes,circulation}', 85),
  ('penal_0086', '6102', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le fait de porter une arme de manière visible dans l''espace public lorsque c''est interdit par la loi est reconnu comme exhibition d''arme et constitue une infraction pénale.', null, '{armes,sexuel,ordre_public}', 86),
  ('penal_0087', '6103', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le fait de détenir une arme prohibée ou non enregistrée conformément à la loi est reconnu comme possession d''arme illégale et constitue une infraction pénale.', null, '{armes}', 87),
  ('penal_0088', '6103.1', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'La détention, le port ou le transport d’une arme blanche prohibée ou soumis à autorisation, sans motif légitime ou sans respect des dispositions légales en vigueur, est considéré comme une possession illégale d’arme blanche, et constitue une infraction pénale.', null, '{armes}', 88),
  ('penal_0089', '6103.2', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'La détention, le port ou le transport d’une arme létale prohibée ou non enregistrée conformément à la réglementation en vigueur constitue une possession illégale d’arme, et constitue une infraction pénale.', null, '{armes}', 89),
  ('penal_0090', '6104', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'La détention d’un gilet pare-balle dans un contexte criminel ou lorsqu’elle est interdite par la loi est reconnu comme possession illégale de gilet pare-balle et constitue une infraction pénale.', null, '{armes,organisation}', 90),
  ('penal_0091', '6105', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le fait de fabriquer, acquérir, transférer ou distribuer des armes en violation des lois et règlements applicables, notamment dans un cadre organisé, est reconnu comme trafic d''armes et constitue une infraction pénale.', null, '{armes,organisation}', 91),
  ('penal_0092', '6106', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Les armureries agréées par l’État de San Andreas sont reconnues comme des établissements sensibles au regard de la sécurité publique.
Afin de prévenir l’introduction, la dissimulation ou la circulation d’armes illégales, de munitions prohibées ou de tout objet dangereux, des contrôles de sécurité sont obligatoires à l’entrée et à la sortie de ces établissements.
Ces contrôles peuvent comprendre :
- une inspection visuelle des effets personnels ;
- une palpation de sécurité ;
- la vérification de la conformité des armes transportées.
Les contrôles sont effectués exclusivement par des employés préalablement habilités par l’État de San Andreas. L’habilitation est subordonnée à la réussite d’une formation obligatoire dispensée ou validée par un service de police de l’État. Les employés habilités ne disposent d’aucun pouvoir de contrainte physique, de saisie ou de retenue. Toute mesure coercitive ou fouille approfondie relève exclusivement de la compétence des forces de l’ordre. Le refus de se soumettre au contrôle entraîne l’interdiction immédiate d’accès ou l’exclusion de l’établissement.', null, '{armes,circulation,procedure}', 92),
  ('penal_0093', '6107', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le fait pour un civil titulaire d’un Permis de Port d’Arme Civile (PPA) ou d’un permis de chasse valide de détenir simultanément plus d’une arme à feu légale acquise conformément à la loi constitue une infraction pénale.Toute arme excédentaire pourra être saisie.
Cette infraction est punie d’une amende de 15 000 $, d’une peine de 20 minutes d’emprisonnement et peut entraîner la suspension ou le retrait du PPA ou du permis de chasse.', null, '{armes,circulation,procedure,environnement}', 93),
  ('penal_0094', '6108', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Constitue un usage d’une arme létale tout emploi effectif de ses capacités létales, par activation, tir, projection ou mise en œuvre quelle qu’elle soit. L’usage est caractérisé indépendamment de l’existence d’une atteinte à une personne, de la survenance d’un dommage, de l’intention de porter atteinte à autrui.', 'Applicable uniquement sur Los Santos.', '{armes}', 94),
  ('penal_0095', '6108.1', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'L’article 6108 ne s’applique pas aux stands de tirs des entreprises agréées par la Mairie de Los Santos County, et dans les conditions légales d’usage de la force prévues par les lois de Los Santos.', 'Applicable uniquement sur Los Santos.', '{armes}', 95),
  ('penal_0096', '6108.2', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Le non-respect de l’article 6108 entraînera une amende pécuniaire de 7,500$ et 10 minutes d’emprisonnement.', 'Applicable uniquement sur Los Santos.', '{armes}', 96),
  ('penal_0097', '6109', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'L’usage d’une arme à feu est autorisé, sous réserve qu’il ne constitue pas un danger injustifié pour autrui et qu’il respecte les règles élémentaires de sécurité et de discernement.', 'Applicable uniquement à Blaine County.', '{armes}', 97),
  ('penal_0098', '6109.1', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Constitue un usage abusif d’une arme à feu tout tir effectué :
- sans motif légitime ;
- en méconnaissance des règles élémentaires de sécurité et de maniement des armes à feu, telles que enseignées lors du test d’aptitude prévu à l’article 4.3, Titre IV de la réglementation des armes de l’État de San Andreas;
- de manière dangereuse, inconsidérée ou disproportionnée ;
- à l’encontre d’un individu, d’un animal ou de tout élément sans justification valable.', 'Applicable uniquement à Blaine County.', '{armes}', 98),
  ('penal_0099', '6109.2', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Les faits mentionnés à l’article 6109.1 sont punis d’une amende de 7 500 $ et d’une peine de 10 minutes de détention.
Lorsque les faits sont commis à l’encontre d’un agent des services publics, les sanctions sont portées à 10 000 $ d’amende et 15 minutes de détention.', 'Applicable uniquement à Blaine County.', '{armes,procedure}', 99),
  ('penal_0100', '6109.3', 'PARTIE 2', 'Titre VI Armes et sécurité publique', 'Chapitre unique', 'Ne constitue pas un usage abusif d’une arme à feu :
- l’usage d’une arme à feu au sein d’un stand de tir autorisé, notamment Ammu-Nation ;
- l’usage dans le cadre d’une activité de chasse réglementée, avec une arme adaptée ;
- toute utilisation encadrée dans un cadre professionnel ou institutionnel.', 'Applicable uniquement à Blaine County.', '{armes,environnement}', 100),
  ('penal_0101', '7101', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Le fait de ne pas se conformer volontairement à un ordre légal donné par une personne dépositaire de l''autorité publique et identifiable comme telle est reconnu comme refus d''obtempérer et constitue une infraction pénale.', null, '{corruption}', 101),
  ('penal_0102', '7101.1', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Constitue une circonstance aggravante du refus d’obtempérer le fait, pour toute personne, de franchir volontairement ou de tenter de se soustraire à un dispositif de douanes légalement établi par les forces de police.
Ce fait est puni d’une amende de 3 750 $ et d’une peine de détention de 15 minutes, sans préjudice des poursuites complémentaires prévues par le présent Code.', null, '{procedure}', 102),
  ('penal_0103', '7102', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Le fait de refuser de décliner son identité lors d’un contrôle légalement justifié est reconnu comme refus d''identification et constitue une infraction pénale.', null, '{corruption}', 103),
  ('penal_0104', '7102.1', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'La dissimulation volontaire du visage dans l’espace public n’est pas interdite sur le territoire de l’État de San Andreas.
Toutefois, lors d’un contrôle d’identité légalement effectué par les forces de l’ordre, toute personne devra permettre son identification et retirer temporairement tout dispositif dissimulant son visage lorsque cela est nécessaire à la vérification de son identité.
La dissimulation du visage pourra également être interdite à l’intérieur ainsi qu’aux abords immédiats de certains lieux sensibles, notamment les institutions judiciaires, bâtiments gouvernementaux, postes des forces de l’ordre, infrastructures hospitalières, infrastructures sécurisées ou toute zone faisant l’objet d’un dispositif particulier de sécurité publique.
En cas d’état d’urgence, de menace grave ou d’opération exceptionnelle de sécurité, les autorités compétentes pourront temporairement restreindre ou interdire la dissimulation du visage dans certaines zones déterminées.
Toute application du présent article devra respecter les principes de nécessité, de proportionnalité ainsi que les droits et libertés garantis par les Constitutions des États-Unis et de l’État de San Andreas.', null, '{violence,ordre_public}', 104),
  ('penal_0105', '7103', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Le fait de quitter les lieux après avoir causé un dommage ou un danger sans se soumettre aux obligations légales est reconnu comme délit de fuite et constitue une infraction pénale.', null, '{}', 105),
  ('penal_0106', '7104', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Toute non présentation à une convocation officielle publiée par un service public (SAHP, LSPD ou BCSD) ou par une institution publique (Gouvernement, Mairie, Bureau du Procureur, Sénat, Cour ou Cour Suprême) constitue une infraction pénale.', null, '{organisation,procedure}', 106),
  ('penal_0107', '7105', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Le fait de violer délibérément les obligations imposées par une décision judiciaire est reconnu comme non-respect de contrôle judiciaire et constitue une infraction pénale.', null, '{}', 107),
  ('penal_0108', '7106', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 1 - Infractions aux décisions et ordres publics', 'Le fait, pour une personne légalement détenue, placée sous garde, sous arrestation ou sous contrôle judiciaire, de se soustraire volontairement à la mesure de privation ou de restriction de liberté qui lui est légalement imposée est reconnu comme évasion et constitue une infraction pénale.', null, '{procedure}', 108),
  ('penal_0109', '7201', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 2 - Atteintes à la justice et à la vérité', 'Toute entrave volontaire à une enquête, une poursuite ou une décision judiciaire est reconnu comme obstruction à la justice et constitue une infraction pénale.', null, '{corruption,procedure}', 109),
  ('penal_0110', '7202', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 2 - Atteintes à la justice et à la vérité', 'Le fait de falsifier un document ou d’utiliser sciemment un document falsifié afin d’en tirer un avantage ou de produire un effet juridique est reconnu comme faux ou usage de faux et constitue une infraction pénale', null, '{fraude}', 110),
  ('penal_0111', '7203', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 2 - Atteintes à la justice et à la vérité', 'Le fait de faire sciemment une déclaration mensongère sous serment devant une autorité compétente est reconnu comme parjure et constitue une infraction pénale.', null, '{corruption}', 111),
  ('penal_0112', '7204', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 2 - Atteintes à la justice et à la vérité', 'Le fait, pour deux (2) personnes ou plus, de s’entendre en vue de commettre une attaque violente ou armée contre :
- une Mairie située dans l''État de San Andreas, ou l’un de ses bâtiments officiels.
- le Gouvernement de l’État de San Andreas, ou l’un de ses bâtiments officiels.
La conspiration n’est caractérisée que si cette entente est établie de manière claire et qu’elle s’accompagne d’éléments objectifs démontrant une volonté concrète de passage à l’action. En ce sens est reconnu comme conspiration et constitue une infraction pénale.
La seule expression d’une opinion, d’une colère ou de propos non suivis d’organisation concrète ne peut suffire à constituer l’infraction', null, '{armes,organisation}', 112),
  ('penal_0113', '7301', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'Le fait de se faire passer pour une autre personne ou pour un agent public afin d’en tirer un avantage est reconnu comme usurpation d''identité ou de fonction et constitue une infraction pénale.', null, '{fraude,corruption}', 113),
  ('penal_0114', '7302', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'Le fait d’empêcher ou de perturber volontairement l’action légale des services publics est reconnu comme entrave à intervention des services publics et constitue une infraction pénale.', null, '{corruption}', 114),
  ('penal_0115', '7303', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'Le fait de proposer ou d’accepter un avantage indu dans l’exercice d’une fonction publique est reconnu comme corruption et constitue une infraction pénale.', null, '{fraude,corruption}', 115),
  ('penal_0116', '7304', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'Toute manœuvre frauduleuse, ou non-respect des dispositions prises par le Code électoral, visant à altérer la sincérité d’un scrutin est reconnue comme fraude électorale et constitue une infraction pénale.', null, '{fraude}', 116),
  ('penal_0117', '7305', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'Tout acte criminel grave commis dans le but d’intimider la population, de perturber gravement l’ordre public ou de contraindre une autorité publique par la violence ou la menace est reconnu comme acte de terrorisme et constitue une infraction pénale.', null, '{violence,organisation}', 117),
  ('penal_0118', '7306', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 3 - Atteintes à l’autorité et aux institutions', 'I. – Constituent un outrage à magistrat les gestes, écrits, menaces ou insultes adressés à un magistrat dans l’exercice de ses fonctions.
II. – Sont considérés comme magistrats au sens du présent article :
 – Le Juge Président de la Cour Suprême de l’État de San Andreas ;
 – Les Juges Associés de la Cour Suprême de l’État de San Andreas ;
 – Le Procureur de Comté ;
 – Les Procureurs Adjoints.
III. – L’outrage à magistrat est puni d’une amende de 10.000 dollars et de quinze (15) minutes d’emprisonnement.', null, '{violence,corruption,organisation,procedure}', 118),
  ('penal_0119', '7401', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 4 - Ordre public et sécurité collective', 'Le fait de solliciter de manière insistante, agressive ou coercitive des dons sur la voie publique, en violation des règles d’ordre public est reconnu comme mendicité et constitue une infraction pénale', null, '{ordre_public}', 119),
  ('penal_0120', '7402', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 4 - Ordre public et sécurité collective', 'Le fait de se trouver en état d’ivresse manifeste sur la voie publique lorsqu’un tel état crée un danger pour soi-même ou pour autrui est reconnu comme ivresse sur la voie publique et constitue une infraction pénale.', null, '{ordre_public}', 120),
  ('penal_0121', '7403', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 4 - Ordre public et sécurité collective', 'Le fait de solliciter volontairement et sans motif légitime les services d’urgence, en causant une mobilisation injustifiée de moyens publics, est reconnu comme appel abusif aux services d''urgence et constitue une infraction pénale.', null, '{ordre_public,etat_urgence}', 121),
  ('penal_0122', '7404', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 4 - Ordre public et sécurité collective', 'Le fait de porter atteinte de manière volontaire à la quiétude ou à la tranquilité d''un lieu public est reconnu comme trouble à l''ordre public et constitue une infraction pénale.', null, '{ordre_public}', 122),
  ('penal_0123', '7405', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 4 - Ordre public et sécurité collective', 'Le fait d’organiser ou de participer à un rassemblement public en violation d’une interdiction légalement motivée tenant à la sécurité ou à l’ordre public est reconnu comme organisation ou participation à une manifestation illégale et constitue une infraction pénale.', null, '{organisation,ordre_public}', 123),
  ('penal_0124', '7501', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Le devoir de réserve impose à tout employé d’un service public ou privé d’adopter une attitude de neutralité et de discrétion dans l’exercice de ses fonctions. Il vise à garantir l’impartialité, la confidentialité et la protection des informations dont l’agent a connaissance dans le cadre de son activité professionnelle.', null, '{corruption}', 124),
  ('penal_0125', '7501.1', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Tout employé tenu par le devoir de réserve est dans l’obligation de ne divulguer aucune information obtenue dans l’exercice de ses fonctions, que ce soit à des tiers, au public ou même à ses collègues, sauf si cette divulgation est strictement encadrée par la loi ou expressément autorisée par une autorité compétente.
Cette interdiction couvre notamment :
- toute déclaration publique pouvant compromettre l’image, l’intégrité ou la neutralité de l’institution ou de l’entreprise ;
- toute divulgation d’informations sensibles sur un dossier en cours, y compris à des proches ou sur des réseaux sociaux ;
- toute diffusion de documents internes, de notes confidentielles ou d’échanges professionnels protégés.', null, '{fraude,corruption,procedure,etat_urgence,environnement}', 125),
  ('penal_0126', '7501.2', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Le non-respect du devoir de réserve peut notamment être caractérisé par :
- la diffusion volontaire ou involontaire d’informations confidentielles ;
- l’enregistrement et la publication de conversations internes sans autorisation ;
- la communication d’informations stratégiques ou institutionnelles à des personnes non autorisées ;
- le partage de documents internes à des tiers sans justification légale.
Toute divulgation non autorisée de ces informations est reconnue comme violation du devoir de réserve et constitue une infraction pénale.', null, '{corruption}', 126),
  ('penal_0127', '7501.3', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'La violation du devoir de réserve est punie d’une amende de quinze mille (15 000) dollars et d’une peine de détention de trente (30) minutes.', null, '{corruption,procedure}', 127),
  ('penal_0128', '7502', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Toute personne tenue au secret professionnel, de par sa profession ou ses fonctions, qui divulgue des informations confidentielles obtenues dans l’exercice de ses responsabilités, sans autorisation légale ou consentement éclairé de la personne concernée, commet une violation du secret professionnel et constitue une infraction pénale.', null, '{corruption}', 128),
  ('penal_0129', '7502.1', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Cette infraction est constituée dès lors que l’auteur communique, transmet ou exploite des informations protégées, que ce soit verbalement, par écrit, sous forme numérique ou par tout autre moyen, y compris indirectement.
La simple tentative de divulgation ou la négligence entraînant une fuite d’informations confidentielles peut également être réprimée au titre de cette infraction.', null, '{environnement}', 129),
  ('penal_0130', '7502.2', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'Sont notamment concernés, sans que cette liste soit exhaustive :
- les professionnels de santé ;
- les avocats et auxiliaires de justice ;
- les forces de l’ordre et magistrats ;
les fonctionnaires et agents publics soumis à une obligation de discrétion.', null, '{corruption,procedure}', 130),
  ('penal_0131', '7502.3', 'PARTIE 2', 'Titre VII Infractions contre l''autorité publique', 'Chapitre 5 - Manquements aux obligations professionnelles', 'La violation du secret professionnel est punie d’une amende de trente mille (30 000) dollars et d’une peine de détention de trente (30) minutes.', null, '{corruption,procedure}', 131),
  ('penal_0132', '8101', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'Sont considérées comme produits stupéfiants les substances classées comme telles par la loi ou par règlement pris conformément à celle-ci.', null, '{drogue}', 132),
  ('penal_0133', '8102', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'Sont considérés comme produits stupéfiants illégaux toute substance ou préparation ayant des effets psychotropes ou altérant les facultés physiques ou mentales, et dont la production, la fabrication, la possession, le transport, la distribution, la vente ou la consommation ne sont pas autorisés par les autorités compétentes.', null, '{drogue}', 133),
  ('penal_0134', '8103', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'La possession de produit stupéfiant en quantité supérieure à six (6) unité est non autorisées et constitue une infraction pénale. La possession de produit stupéfiant en quantité inférieure à six (6) unités, n’est pas autorisée et entraine une saisie des substances sans poursuite pénale.', null, '{drogue,procedure}', 134),
  ('penal_0135', '8104', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'La vente d''un produit stupéfiant en échange d''un bien matériel ou immatériel constitue une infraction pénale.', null, '{drogue}', 135),
  ('penal_0136', '8105', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'La production, transformation, transport ou importation de stupéfiants dans un cadre organisé constitue un trafic à partir de 50 pochons et est sanctionnée pénalement.', null, '{drogue,organisation,procedure}', 136),
  ('penal_0137', '8106', 'PARTIE 2', 'Titre VIII Produits stupéfiants', 'Chapitre unique', 'La consommation de produit stupéfiant dans l''espace public ou le fait de se trouver dans l''espace public en étant sous influende de produit sutpéfiant est reconnu comme consommation de produits stupéfiant et constitue une infraction pénale.', null, '{drogue,ordre_public}', 137),
  ('penal_0138', '9101', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'La détention d''argent liquide à domicile pour un montant supérieur à un million de dollars est reconnue comme possession d''argent non-déclaré et constitue une infraction pénale.', null, '{fraude}', 138),
  ('penal_0139', '9102', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'La détention d''argent liquide en quantité supérieure à 6000$ est reconnue comme possession d''argent en quantité non autorisée et constitue une infraction pénale.', null, '{fraude}', 139),
  ('penal_0140', '9103', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'Le fait d’obtenir un bien, un service ou un avantage par tromperie, dissimulation ou manœuvres frauduleuses est reconnu comme fraude constitue une infraction pénale.', null, '{fraude}', 140),
  ('penal_0141', '9104', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'Le fait de se soustraire frauduleusement à l’impôt ou aux contributions obligatoires est reconnu comme évasion fiscale et constitue une infraction pénale.', null, '{fraude}', 141),
  ('penal_0142', '9105', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'Le fait de dissimuler, convertir ou réintroduire des fonds issus d’une activité criminelle est reconnu comme blanchiment de capitaux et constitue une infraction pénale.', null, '{fraude,organisation}', 142),
  ('penal_0143', '9106', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'Constitue une fraude fiscale toute action ou omission ayant pour objet ou pour effet de soustraire, en tout ou partie, un contribuable au paiement de l’imposition.', 'Applicable uniquement sur Los Santos.', '{fraude}', 143),
  ('penal_0144', '9107', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 1 - Infractions de dissimulation et fraude', 'Sont notamment considérés comme des actes de fraude fiscale, la liste non exhaustive suivante : dissimulation totale ou partielle des revenus, bénéfices et/ou chiffres d’affaires d’une entreprise; la falsification de documents comptables et/ou fiscaux; l’usage de montages destinés à masquer la réalité d’une activité économique; toute déclaration mensongère ou manœuvre visant à échapper à l’imposition.', 'Applicable uniquement sur Los Santos.', '{fraude}', 144),
  ('penal_0145', '9201', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 2 - Infraction de gestion et de confiance', 'Le fait de détourner un bien, un pouvoir ou une mission confiés à titre temporaire ou spécifique est reconnu comme abus de confiance et constitue une infraction pénale.', null, '{fraude}', 145),
  ('penal_0146', '9202', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 2 - Infraction de gestion et de confiance', 'L’usage abusif des biens, du crédit ou de l’autorité d’une entité à des fins personnelles est reconnu comme abus de biens sociaux et constitue une infraction pénale.', null, '{fraude}', 146),
  ('penal_0147', '9203', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 2 - Infraction de gestion et de confiance', 'Le fait, pour une personne dépositaire de fonds publics ou privés, de les utiliser ou détourner à des fins étrangères à leur destination légitime est reconnu comme détournement de fonds et constitue une infraction pénale', null, '{fraude}', 147),
  ('penal_0148', '9301', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'Le fait de ne pas payer ses amendes après le délai de 72h00 est constitutif du délit de non respect d''un délai de paiement. Le non respect de ce délai pourra entraîner la majoration des amendes initiales de 100% ou une saisie sur les biens meubles ou immeubles de l''individu.', null, '{fraude,procedure}', 148),
  ('penal_0149', '9302', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'La peine d''amende est une peine financière, elle peut être prononcée, en toute matière, par un juge. En matière délictuelle, elle peut être prononcée par le Bureau du Procureur qui peut déléguer ses fonctions aux services de police. Le Bureau du Procureur contrôle l''exercice de cette prérogative. En matière criminelle, elle peut être prononcée par le juge qui peut déléguer ses fonctions au bureau du Procureur. Celui-ci ne peut déléguer ces fonctions aux services de police.', null, '{organisation,procedure}', 149),
  ('penal_0150', '9303', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'En cas d''amende impayée, le juge peut décider de majorer la peine ou peut déléguer cette tâche au Bureau du Procureur. Si les peines sont trop importantes, le juge ou le Bureau du procureur peuvent notamment procéder à une saisie des biens mobiliers et immobiliers du prévenu ou de l''accusé à défaut de paiement.', null, '{fraude,organisation,procedure}', 150),
  ('penal_0151', '9303.1', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'En cas de facture impayée les peines sont similaires à celles des amendes impayées avec un délai de paiement de celle-ci de 72h avec une majoration de 20% si le susmentionné délai est dépassé.', null, '{fraude,procedure}', 151),
  ('penal_0152', '9304', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'La peine de travail d''intérêt général peut être prononcée par le Juge ou le Bureau du Procureur.', null, '{organisation,procedure}', 152),
  ('penal_0153', '9304.1', 'PARTIE 2', 'Titre IX Infractions financières', 'Chapitre 3 - Des peines prononcées', 'En cas de manquement ou de conduite inappropriée durant la détention, la SAHP est habilitée à réévaluer la peine en cours et à en prolonger la durée, proportionnellement à la gravité des faits constatés.', null, '{circulation,procedure}', 153),
  ('penal_0154', '10101', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de conduire un véhicule motorisé sans être titulaire d’un permis de conduire valide correspondant à la catégorie du véhicule est reconnu comme conduite sans permis et constitue une infraction pénale.', null, '{circulation}', 154),
  ('penal_0155', '10101.1', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de conduire un véhicule terrestre à moteur sans être titulaire du permis requis constitue un délit.
Toutefois, par dérogation, la conduite d’un véhicule de type Faggio ou Caddie est autorisée à partir de seize (16) ans sans permis, conformément aux dispositions du Code de la Route.', null, '{circulation}', 155),
  ('penal_0156', '10102', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de conduire un véhicule d’une manière manifestement dangereuse, caractérisée par une violation délibérée ou une imprudence grave des règles de sécurité, exposant autrui à un risque immédiat de mort ou de blessure grave, est reconnu comme conduite dangereuse et constitue une infraction pénale.', null, '{circulation}', 156),
  ('penal_0157', '10103', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de conduire un véhicule sous l’emprise d’alcool ou de produit stupéfiant affectant les capacités physiques ou mentales, dans des conditions dépassant les seuils administratifs définis par le Code de la route, est reconnu comme conduite sous emprise et constitue une infraction pénale.', null, '{drogue,circulation}', 157),
  ('penal_0158', '10104', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de participer, en qualité de conducteur ou d’organisateur, à une course de véhicules non autorisée sur la voie publique est reconnu comme course illégale et constitue une infraction pénale.', null, '{circulation,procedure,ordre_public}', 158),
  ('penal_0159', '10105', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 1 - Infractions routières', 'Le fait de circuler avec un véhicule muni de plaques d’immatriculation falsifiées, usurpées ou dissimulées est reconnu comme circulation avec un véhicule faussement immatriculé et constitue une infraction pénale.', null, '{circulation}', 159),
  ('penal_0160', '10201', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 2 - Infractions maritimes', 'Le fait de naviguer sans permis avec une embarcation de catégorie 2 est reconnu comme navigation sans permis et constitue une infraction pénale.', null, '{circulation}', 160),
  ('penal_0161', '10202', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 2 - Infractions maritimes', 'Le fait de naviguer d’une manière manifestement dangereuse, caractérisée par une violation délibérée ou une imprudence grave des règles de sécurité, exposant autrui à un risque immédiat de mort ou de blessure grave, est reconnu comme navigation dangereuse et constitue une infraction pénale.', null, '{circulation}', 161),
  ('penal_0162', '10203', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 2 - Infractions maritimes', 'Le fait de naviguer dans des zones interdites à la navigation, définies par la loi, est reconnu comme navigation en zone interdite et constitue une infraction pénale.', null, '{circulation}', 162),
  ('penal_0163', '10301', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 3 - Infractions aériennes', 'Le fait de piloter un aéronef sans licence est reconnu comme pilotage d''un aéronef sans licence et constitue une infraction pénale.', null, '{circulation}', 163),
  ('penal_0164', '10302', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 3 - Infractions aériennes', 'Le fait de piloter un aéronef d’une manière manifestement dangereuse, caractérisée par une violation délibérée ou une imprudence grave des règles de sécurité, exposant autrui à un risque immédiat de mort ou de blessure grave, est reconnu comme pilotage dangereux d''un aéronef et constitue une infraction pénale.', null, '{circulation}', 164),
  ('penal_0165', '10303', 'PARTIE 2', 'Titre X Infractions pénales routières, maritimes et aériennes', 'Chapitre 3 - Infractions aériennes', 'Le fait de survoler des zones définies par le loi comme interdites en aéronef est reconnu comme survol en aéronef de zone interdite et constitue une infraction pénale.', null, '{circulation}', 165),
  ('penal_0166', '11101', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le fait d''organiser un évènement dans un espace protégé, sans que celui-ci soit décalré et approuvé par la Mairie du comté dans lequel se situe l''espace protégé, est reconnu comme organisation de manifestation illlégale dans un espace protégé et constitue une infraction pénale.', null, '{organisation,ordre_public,environnement}', 166),
  ('penal_0167', '11102', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le fait de construire dans un espace protégé, sans autorisation de la Mairie du comté dans lequel se toruve l''espace protégé, est reconnu comme construction illégale dans un espace protégé et constitue une infraction pénale.', null, '{environnement}', 167),
  ('penal_0168', '11103', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le fait de ne pas respecter les quotas de pêche ou de chasse fixés par les autorités est reconnu comme destruction de la faune et constitue une infraction pénale.', null, '{environnement}', 168),
  ('penal_0169', '11103.1.1', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Constitue une destruction de la faune le fait de capturer, tuer, prélever, détenir, transporter ou commercialiser des animaux sauvages, terrestres ou aquatiques en dépassant les quotas autorisés par la réglementation environnementale en vigueur. L’infraction est constituée dès le premier individu excédentaire.', 'Applicable uniquement à Blaine County.', '{homicide,environnement}', 169),
  ('penal_0170', '11103.1.2', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le dépassement est qualifié de grave lorsque le volume total d’unités saisies est compris entre 101 et 199 unités, exprimées en nombre, poids ou équivalent. Ces dispositions s’appliquent aux personnes physiques ainsi qu’aux personnes morales dont l’activité principale n’est ni la pêche ni la chasse professionnelle.', 'Applicable uniquement à Blaine County.', '{environnement}', 170),
  ('penal_0171', '11103.1.3', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'En cas de dépassement, la part excédant le quota peut être saisie ; l’intégralité des prises peut être saisie en cas de dépassement significatif, répété ou supérieur à 100 unités. À défaut de circonstance aggravante, la saisie peut être limitée à la part excédentaire.', 'Applicable uniquement à Blaine County.', '{environnement}', 171),
  ('penal_0172', '11103.1.4', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'L’amende est fixée sur une base initiale de 300 $ par unité excédentaire et peut être étendue à la totalité des prises lorsque le dépassement excède 100 unités ou présente un caractère aggravant. Les peines peuvent être aggravées en cas de récidive, de dissimulation ou falsification des quantités ou d’organisation concertée à but lucratif.', 'Applicable uniquement à Blaine County.', '{procedure,environnement}', 172),
  ('penal_0173', '11104', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le fait de chasser ou pêcher une espèce protégée est reconnu comme pêche ou chasse illégale d’une espèce protégée et constitue une infraction pénale.', null, '{environnement}', 173),
  ('penal_0174', '11105', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'La vente d''une espèce protégée en échange d''un bien matériel ou immatériel est reconnue comme vente illégale d''espèce protégée et constitue une infraction pénale.', null, '{environnement}', 174),
  ('penal_0175', '11106', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Le fait de transformer, transporter, importer ou vendre des espèces protégées dans un cadre organisé est reconnu comme trafic d''espèce protégée et constitue une infraction pénale.', null, '{organisation,environnement}', 175),
  ('penal_0176', '11107', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Toute action causant un dommage écologique grave, en participant au dépassement manifeste et non négligeable des limites planétaires, commise en connaissance des conséquances qui allaient en résulter et qui ne pouvaient être ignorées, et reconnu comme écocide et constitue une infraction pénale.', null, '{environnement}', 176),
  ('penal_0177', '11107.1.1', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Constitue un écocide toute action intentionnelle ou résultant d’une négligence grave ayant causé une atteinte grave, durable et significative à l’environnement sur le territoire de Blaine County.', 'Applicable uniquement à Blaine County.', '{environnement}', 177),
  ('penal_0178', '11107.1.2', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'L’écocide est notamment caractérisé lorsque les faits entraînent la destruction, l’exploitation, la pollution ou la saisie d’un volume égal ou supérieur à 200 unités de ressources naturelles ; ce seuil qualifie une atteinte écologique majeure constituant un crime grave.', 'Applicable uniquement à Blaine County.', '{environnement}', 178),
  ('penal_0179', '11107.1.3', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Ces dispositions s’appliquent aux personnes physiques ainsi qu’aux personnes morales dont l’activité principale n’est ni la pêche ni la chasse professionnelle ; pour les personnes morales exerçant une activité professionnelle de pêche ou de chasse, le seuil est fixé à 400 unités.', 'Applicable uniquement à Blaine County.', '{environnement}', 179),
  ('penal_0180', '11107.1.4', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'L’écocide est passible d’une amende pouvant atteindre 175 000 $ et d’une peine de 90 minutes d’emprisonnement. Le tribunal peut ordonner la confiscation des permis, licences ou autorisations liés aux activités en cause, l’interdiction d’exercer l’activité ayant conduit aux faits, la saisie des équipements utilisés ainsi que toute mesure de réparation ou de compensation écologique.', 'Applicable uniquement à Blaine County.', '{circulation,procedure,environnement}', 180),
  ('penal_0181', '11108', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Il est institué un chef d’accusation autonome intitulé Destruction de la flore. Constitue ce délit le fait de porter atteinte, volontairement ou par négligence grave, à des végétaux ou formations végétales, cultures naturelles ou protégées, à des forêts ou zones boisées ou à des espèces végétales rares ou protégées.', 'Applicable uniquement à Blaine County.', '{organisation,environnement}', 181),
  ('penal_0182', '11108.1', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'La destruction de la flore est notamment caractérisée par l’arrachage, l’abattage ou la coupe non autorisée de végétaux, l’incendie volontaire ou résultant d’un défaut de maîtrise, ainsi que l’utilisation de substances chimiques, biologiques ou de moyens mécaniques entraînant une dégradation durable ou irréversible de la végétation.', 'Applicable uniquement à Blaine County.', '{environnement}', 182),
  ('penal_0183', '11108.2', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'Les peines sont déterminées en fonction de l’étendue et de la gravité des dommages, du caractère protégé des espèces ou milieux concernés et du degré d’intention ou de négligence de l’auteur. Le délit est autonome et peut être poursuivi indépendamment ou cumulativement avec toute autre infraction environnementale.', 'Applicable uniquement à Blaine County.', '{procedure,environnement}', 183),
  ('penal_0184', '11108.3', 'PARTIE 2', 'Titre XI Infractions pénales au Code de l''environnement', 'Chapitre unique', 'La destruction de la flore est passible d’une amende nominale de 5 000 $ et d’une détention nominale de 15 minutes.', 'Applicable uniquement à Blaine County.', '{environnement}', 184);

-- Code de procédure pénale
drop table if exists cabinet_codes_procedure_penale;
create table cabinet_codes_procedure_penale (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_procedure_penale enable row level security;

insert into cabinet_codes_procedure_penale (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('procedure_penale_0001', '1101', null, 'Titre I Principes fondamentaux', 'Chapitre 1 - Application régulière de la loi', 'Toute personne poursuivie bénéficie du droit à une procédure régulière, équitable et contradictoire.', null, '{procedure}', 1),
  ('procedure_penale_0002', '1102', null, 'Titre I Principes fondamentaux', 'Chapitre 1 - Application régulière de la loi', 'Toute personne est présumée innocente tant que sa culpabilité n’a pas été légalement établie.', null, '{}', 2),
  ('procedure_penale_0003', '1103', null, 'Titre I Principes fondamentaux', 'Chapitre 1 - Application régulière de la loi', 'La charge de la preuve incombe à l’accusation, qui doit établir la culpabilité au-delà de tout doute raisonnable.', null, '{procedure}', 3),
  ('procedure_penale_0004', '1104', null, 'Titre I Principes fondamentaux', 'Chapitre 1 - Application régulière de la loi', 'Nul ne peut être poursuivi ou jugé pénalement deux fois pour les mêmes faits.', null, '{procedure}', 4),
  ('procedure_penale_0005', '2101', null, 'Titre II Actions de police et enquête', 'Chapitre 1 - Contrôles et interpellations', 'Les forces de l’ordre peuvent contrôler l’identité d’une personne lorsqu’elles disposent d’un soupçon raisonnable fondé sur des faits objectifs.', null, '{}', 5),
  ('procedure_penale_0006', '2102', null, 'Titre II Actions de police et enquête', 'Chapitre 1 - Contrôles et interpellations', 'Une palpation de sécurité est autorisée lorsqu’un agent a une croyance raisonnable que la personne est armée et dangereuse.', null, '{armes,procedure}', 6),
  ('procedure_penale_0007', '2201', null, 'Titre II Actions de police et enquête', 'Chapitre 2 - Arrestation', 'Toute arrestation fondée sur un mandat judiciaire est licite.', null, '{procedure}', 7),
  ('procedure_penale_0008', '2202', null, 'Titre II Actions de police et enquête', 'Chapitre 2 - Arrestation', 'Une arrestation sans mandat est autorisée en cas de crime ou de délit flagrant, ou lorsque l’agent dispose d’une probable cause.', null, '{procedure}', 8),
  ('procedure_penale_0009', '2203', null, 'Titre II Actions de police et enquête', 'Chapitre 2 - Arrestation', 'L’usage de la force par les forces de l’ordre doit être nécessaire, proportionné et raisonnable au regard des circonstances.', null, '{procedure}', 9),
  ('procedure_penale_0010', '2204', null, 'Titre II Actions de police et enquête', 'Chapitre 2 - Arrestation', 'Nul ne peut être soumis au port des menottes ou des entraves sauf s’il est considéré comme dangereux pour autrui ou pour lui-même, susceptible de prendre la fuite ou placé en état d’arrestation dans le cadre d’une procédure judiciaire.', null, '{corruption,procedure}', 10),
  ('procedure_penale_0011', '2301', null, 'Titre II Actions de police et enquête', 'Chapitre 3 - Palpations, fouilles et saisies', 'La palpation peut être effectuée :
- lors d''une interpellation par les forces de l''ordre,
- à l''entrée d''une zone sécurisée
- dans les cas spécifiques aux situation d''états d''urgence définies par la loi.', null, '{corruption,procedure,etat_urgence}', 11),
  ('procedure_penale_0012', '2302', null, 'Titre II Actions de police et enquête', 'Chapitre 3 - Palpations, fouilles et saisies', 'Toute fouille ou saisie requiert un mandat délivré par une autorité judiciaire, sauf exceptions légalement reconnues.
La fouille est une recherche sur le corps d’une personne susceptible de dissimuler des objets pouvant servir à commettre une infraction.
Les services de police peuvent procéder à des mises sous scellés d’objets susceptibles de contribuer à l’avancement d’une enquête judiciaire.
Cette mise sous scellés ne peut excéder un délai maximal de vingt-quatre (24) heures sans autorisation judiciaire ou validation du ministère public compétent.
Toute exploitation, conservation prolongée ou fouille réalisée en dehors des cas prévus par la loi devra être autorisée par mandat ou décision de l’autorité compétente.', null, '{procedure}', 12),
  ('procedure_penale_0013', '2303', null, 'Titre II Actions de police et enquête', 'Chapitre 3 - Palpations, fouilles et saisies', 'Sont notamment autorisées les fouilles sans mandat en cas :
- de placement en état d''arrestation légal ;
- de placement en garde à vue ;
- de marquage de chien par une unité K9 lors d''un contrôle des forces de l''ordre ;
- de contrôle réalisé dans le cadre d''une opération douanière avec présence de la SAHP ;
- de situation d''état d''urgence définie par la loi ;
- de consentement libre et éclairé de la personne concernée ;
- afin de prévenir une atteinte grave à la sécurité des personnes et des biens, pour le temps strictement nécessaire à la prévention du risque immédiat (par exemple en cas d’alerte à la bombe, de recherche de personne enlevée ou d’un risque d’attentat).
Lors d’un contrôle, sous États d’urgence de niveau 2 et 1, même sans raison apparente, lorsqu’une palpation est effectuée sur la personne, cette dernière peut être soumise à une fouille plus approfondie si des éléments la justifient.
À l’entrée de Bolingbroke, même pour une simple visite. Certains biens peuvent être confisqués lors de la durée de la visite.', null, '{corruption,procedure,etat_urgence}', 13),
  ('procedure_penale_0014', '2304', null, 'Titre II Actions de police et enquête', 'Chapitre 3 - Palpations, fouilles et saisies', 'Toute fouille ou palpation d’une personne de sexe opposé doit être réalisée, lorsque possible, par un agent du même sexe.
À défaut, la fouille sur une personne de sexe opposé doit recevoir confirmation par le concerné avant de pouvoir se faire.
Si personne n’est apte à faire une fouille dans les règles, le suspect pourra être obligé à vider l’intégralité de ses poches avec contrôle des officiers de police pour confirmer qu’il n’est en présence d’aucun objet dangereux.', null, '{procedure}', 14),
  ('procedure_penale_0015', '2305', null, 'Titre II Actions de police et enquête', 'Chapitre 3 - Palpations, fouilles et saisies', 'Les hauts gradés ainsi que les superviseurs dûment désignés de chaque service des forces de l’ordre de l’État de San Andreas sont habilités à effectuer certaines comparutions procédurales spécifiques, préalablement définies par une note conjointe établie entre lesdits services et la Cour Suprême de l’État de San Andreas.
Cette note conjointe, validée par le Juge Président de la Cour Suprême, fixe de manière permanente :
- la nature des comparutions autorisées ;
- les services, grades et fonctions de supervision habilités ;
- les conditions et limites d’application de la procédure.
Dans le cadre de cette autorisation permanente, aucune demande individuelle auprès de la Cour Suprême n’est requise pour chaque procédure.
Toutefois, un délai d’attente minimal obligatoire de quinze (15) minutes devra être respecté avant toute mise en œuvre de la comparution, afin de garantir la régularité procédurale ainsi que la possibilité d’intervention du Département de la Justice ou de la défense.
À l’issue de ce délai, en l’absence de réponse du Département de la Justice à la comparution et en l’absence de toute personne compétente désignée par la note conjointe, les agents des forces de l’ordre habilités peuvent statuer sur la procédure par la voie du plaider coupable, à la seule condition que le mis en cause reconnaisse librement, expressément et sans réserve l’intégralité des chefs d’accusation retenus à son encontre. Ils peuvent également retirer un ou plusieurs chefs d’accusation s’ils estiment que ceux-ci ne sont pas suffisamment caractérisés ou ne sont pas soutenus par les éléments de la procédure. Dans ce cadre, les agents des forces de l’ordre ne peuvent prononcer que des peines nominales.
L’utilisation de la fiche officielle de comparution validée par la Cour Suprême demeure obligatoire pour toute procédure effectuée sur le fondement du présent article, à l’exception des procédures mises en œuvre en l’absence de réponse du Département de la Justice à la comparution et en l’absence de toute personne compétente désignée par la note conjointe, pour lesquelles son utilisation n’est pas requise.
Les faits, infractions ou procédures réservés au tribunal sont exclus du champ d’application du présent article et ne peuvent faire l’objet d’une comparution procédurale par les forces de l’ordre.
Toute comparution réalisée en violation des dispositions du présent article ou des modalités fixées par la note conjointe sera réputée irrégulière et pourra entraîner la nullité de la procédure.', null, '{organisation,procedure}', 15),
  ('procedure_penale_0016', '3101', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'Tout individu placé en état d’arrestation doit être informé de ses droits Miranda.
Le délai de quinze (15) minutes pour la notification de ces droits commence à courir à partir du moment où l’arrestation devient effective, matérialisée soit par la pose des menottes, soit par une déclaration explicite de mise en garde à vue par un agent des forces de l’ordre.
La notification des droits Miranda doit être effectuée verbalement et doit inclure les éléments suivants :
• le droit de garder le silence ;
• le fait que tout ce qu’il dira pourra être retenu contre lui devant un tribunal ;
• le droit de boire et de manger en quantités suffisantes ;
• le droit d’être assisté d’un avocat ;
• le droit à la désignation d’un avocat commis d’office si la personne n’en a pas les moyens.
En cas de placement en garde à vue, l’individu peut également demander à être ausculté par un médecin. Cette demande devra entraîner, dans un délai raisonnable, soit une conduite à l’hôpital, soit une auscultation médicale directement au poste de police.', null, '{circulation,procedure}', 16),
  ('procedure_penale_0017', '3101.1', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'En cas de nécessité médicale urgente ou lorsque la personne doit être prise en charge par un médecin, le délai de quinze (15) minutes prévu pour la notification des droits peut être suspendu.
Cette suspension est décidée sur avis médical.
La notification intervient dès que l’état de la personne, tel qu’apprécié par le médecin, le permet, et au plus tard dans un délai raisonnable.
Le délai peut également être suspendu lors d’une situation grave, d’un danger imminent, d’une menace immédiate pour la sécurité publique ou d’une opération exceptionnelle en cours.
Dans ces circonstances, les droits pourront être notifiés directement au poste de police ou dès que les conditions opérationnelles le permettront.
La Cour Suprême de l’État de San Andreas ou le Department of Justice peuvent exceptionnellement autoriser ou ordonner la suspension temporaire de ces délais dans le cadre d’événements majeurs ou de situations exceptionnelles.', null, '{violence,procedure}', 17),
  ('procedure_penale_0018', '3101.2', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'Chaque individu conduit dans une cellule est sous la responsabilité de l’officier de police l’ayant placé ou des surveillants présents.
Il est essentiel de veiller à la bonne santé, à la sécurité et à l’intégrité physique de toute personne placée sous la responsabilité des forces de l’ordre.', null, '{circulation,procedure}', 18),
  ('procedure_penale_0019', '3102', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'Toute déclaration obtenue en violation des droits garantis par le présent Code est irrecevable devant les juridictions pénales.', null, '{procedure}', 19),
  ('procedure_penale_0020', '3103', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'La garde à vue ne peut excéder une durée de vingt-quatre (24) heures dans le cas où les besoins de l’enquête le nécessitent.', null, '{procedure}', 20),
  ('procedure_penale_0021', '3104', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'Les services de police de l’État de San Andreas, une fois informés de la volonté du gardé à vue de disposer d’un avocat pour assurer sa défense, disposent d’un délai raisonnable afin de contacter celui-ci.
Une fois prévenu, l’avocat dispose de dix (10) minutes pour répondre et de dix (10) minutes supplémentaires pour rejoindre le poste de police, le lieu de garde à vue ou le lieu de procédure s’il confirme sa présence.
À défaut de réponse ou de déplacement dans les délais impartis, l’avocat sera considéré comme indisponible et la procédure pourra suivre son cours conformément aux dispositions légales en vigueur.', null, '{procedure}', 21),
  ('procedure_penale_0022', '3105', null, 'Titre III Garde à vue et interrogatoire', 'Chapitre unique', 'Lors de la prise de contact avec l’avocat, les forces de l’ordre devront communiquer :
• l’identité du gardé à vue ;
• les noms et matricules des agents concernés ;
• les chefs d’accusation retenus ;
• le poste de police ou le lieu de maintien de la personne concernée.', null, '{organisation,procedure}', 22),
  ('procedure_penale_0023', '4101', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'En cas d''infractions mineures, les forces de l''ordre disposent de l''opportunité des poursuites.', null, '{corruption,procedure}', 23),
  ('procedure_penale_0024', '4102', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'En cas de délit, les forces de l''ordre se chargent des poursuites, si et seulement si, l''individu placé en état d''arrestation ne fait pas appel à un avocat ou si la peine encourue est une peine de garde à vue. Dans le cas contraire, le Procureur doit être informé de la procédure et décide de l’opportunité des poursuites, du classement sans suite ou des alternatives.', null, '{corruption,organisation,procedure}', 24),
  ('procedure_penale_0025', '4103', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'En cas de crime (sauf pour le braquage de supérette pour lequel on applique la même procédure qu''en cas de délit), le Procureur doit être informé de la procédure et décide de l’opportunité des poursuites, du classement sans suite ou des alternatives.', null, '{vol,organisation,procedure}', 25),
  ('procedure_penale_0026', '4104', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'Les poursuites sont engagées par le dépôt d’un acte d’accusation ou par la saisine d’un grand jury lorsque requis.', null, '{procedure}', 26),
  ('procedure_penale_0027', '4105', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'Dès lors qu''un Procureur intervient lors d''une procédure, un avocat (choisi par le prévenu ou, à défaut, commis d''office) doit être obligatoirement appelé par les forces de l''ordre.', null, '{corruption,organisation,procedure}', 27),
  ('procedure_penale_0028', '4106', null, 'Titre IV Poursuites et instruction', 'Chapitre 1 - Autorité de poursuite', 'Par exception aux dispositions de l''article 4103, les infractions de braquage de train, de bijouterie, de yacht, de Human Labs ou de Fleeca Bank peuvent faire l''objet d''une procédure simplifiée, sans saisine obligatoire d''un Procureur.
Lorsque le détenu reconnaît les faits et accepte la peine prévue, les forces de l''ordre peuvent procéder directement à l''application de la peine nominale.
Le détenu conserve néanmoins la faculté de contester les faits, demander une négociation, solliciter une réduction de peine ou demander l''intervention d''un avocat. Dans ce cas, la procédure simplifiée est suspendue afin de permettre l''intervention d''un Procureur, conformément aux règles applicables.
Les forces de l''ordre conservent également la faculté de solliciter l''intervention d''un Procureur lorsqu''elles l''estiment nécessaire au regard des faits, des charges ou des circonstances de l''affaire.', null, '{vol,corruption,organisation,procedure}', 28),
  ('procedure_penale_0029', '4201', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Le Procureur opte pour pour les procédures de poursuite suivantes : 
- le plaider coupable,
- le prononcé unilatéral (comparution immédiate),
- la comparution devant le juge.', null, '{organisation,procedure}', 29),
  ('procedure_penale_0030', '4202', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Lorsqu’il opte pour une procédure de plaider-coupable, le Procureur négocie avec le prévenu et son avocat une peine adaptée à la gravité de l’infraction et à la personnalité de son auteur. 
A défaut d’accord, le Procureur opte pour l’une des autres procédures.', null, '{organisation,procedure}', 30),
  ('procedure_penale_0031', '4203', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Lorsqu''il opte pour une procédure de prononcé unilatéral, le Procureur fixe la peine applicable au suspect. En cas de refus d''application de la part de la défense, celle-ci peut faire appel de la décision devant l''autorité compétente.', null, '{organisation,procedure}', 31),
  ('procedure_penale_0032', '4204', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Lorsqu’il opte pour la procédure de comparution, le Procureur transmet le dossier d''accusation au Juge. Le Juge organise une audience contradicatoire en s''assurant que le Procureur, le prévenu, son avocat et les différents témoins nécessaires soient informés dans les plus brefs délais pour se rendre à l''audience.', null, '{organisation,procedure}', 32),
  ('procedure_penale_0033', '4204.1', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Lorsqu’une procédure nécessite l’intervention du Bureau du Procureur, celui-ci dispose d’un délai raisonnable afin de prendre connaissance du dossier et d’indiquer sa décision procédurale.
À compter de sa notification officielle par les forces de l’ordre, le Bureau du Procureur dispose d’un délai maximal de quinze (15) minutes pour répondre ou se présenter lorsque sa présence est requise immédiatement.
À défaut de réponse dans ce délai, et sauf circonstances exceptionnelles ou impossibilité manifeste, les forces de l’ordre pourront poursuivre la procédure conformément aux dispositions prévues par le présent code.', null, '{organisation,procedure}', 33),
  ('procedure_penale_0034', '4205', null, 'Titre IV Poursuites et instruction', 'Chapitre 2 - Possibilités de poursuite', 'Dans l''attente de son audience, si la personne ne présente pas de danger, l’individu pourra être libéré sous bracelet électronique. Si la personne représente un danger pour la nation, l''individu pourra, sous l’initiative des agents de police, par dérogation du Procureur, être placé sous bracelet électronique avec obligation d’un contrôle judiciaire. Ce contrôle oblige l''individu à venir se signaler auprès du service ayant apposé le bracelet selon l''intervalle déterminé.', null, '{organisation,procedure}', 34),
  ('procedure_penale_0035', '4301', null, 'Titre IV Poursuites et instruction', 'Chapitre 3 - Droits de la défense', 'Toute personne poursuivie a le droit d’être assistée par un avocat à tous les stades de la procédure.', null, '{procedure}', 35),
  ('procedure_penale_0036', '4302', null, 'Titre IV Poursuites et instruction', 'Chapitre 3 - Droits de la défense', 'La défense a accès aux éléments de preuve dans des conditions garantissant l’égalité des armes.', null, '{armes,procedure}', 36),
  ('procedure_penale_0037', '5101', null, 'Titre V Jugement', 'Chapitre 1 - Dispositions générales', 'Toute affaire passant devant la Cour est jugée publiquement, sauf exception justifiée par l’ordre public ou la protection des parties. Dans ce cas, le Juge peut décider du recours au huis clot.', null, '{procedure}', 37),
  ('procedure_penale_0038', '5102', null, 'Titre V Jugement', 'Chapitre 1 - Dispositions générales', 'Sont requis durant une audience : 
- le ou les juges,
- le Procureur,
- l’accusé et son avocat (si celui-ci en a un),
- la victime et son avocat (affaire civile et si celui-ci en a un),
- les témoins et experts judiciaires (s''il y en a).', null, '{organisation,procedure}', 38),
  ('procedure_penale_0039', '5103', null, 'Titre V Jugement', 'Chapitre 1 - Dispositions générales', 'Le juge dirige l’audience et exerce la police des débats. Il peut également, tout au long du procès et ce jusqu’au réquisitoire du Procureur, poser des questions à l’accusé qui lui répond. Dans ce cadre, le Procureur et les avocats peuvent également formuler des questions.
Le juge n’est pas lié par la qualification retenue lors de l’interpellation ou par les chefs initialement visés dans l’acte de poursuite.
Il peut requalifier les faits, ajouter ou écarter des chefs d’accusation, dès lors que les éléments constitutifs ressortent des débats et que le principe du contradictoire ainsi que les droits de la défense ont été respectés.', null, '{organisation,procedure}', 39),
  ('procedure_penale_0040', '5104', null, 'Titre V Jugement', 'Chapitre 1 - Dispositions générales', 'Les parties disposent d’un droit égal à présenter leurs arguments et leurs preuves.', null, '{procedure}', 40),
  ('procedure_penale_0041', '5105', null, 'Titre V Jugement', 'Chapitre 1 - Dispositions générales', 'L''audience doit se dérouler de la façon suivante : 
- Ouverture de l''audience par le juge, avec un rappel des faits 
- Parole à l''accusé qui peut expliquer ou non les faits qui lui sont reprochés 
- Interogatoire des témoins et experts du Procureur ou de l''avocat de la défense 
- Contre-intérogatoire par la partie adverse 
- Déposition de la victime (Si victime) 
- Réquisitoire du Bureau du procureur 
- Plaidoirie de l''avocat de la défense 
- Suspension de l''audience par le juge 
- Prononcé de la décision apres délibération', null, '{organisation,procedure}', 41),
  ('procedure_penale_0042', '5201', null, 'Titre V Jugement', 'Chapitre 2 - Procédure applicable à la peine capitale', 'La Cour Suprême de l’État de San Andreas est seule compétente pour juger et prononcer la peine capitale.', null, '{procedure}', 42),
  ('procedure_penale_0043', '5202', null, 'Titre V Jugement', 'Chapitre 2 - Procédure applicable à la peine capitale', 'La Cour est saisie par le Procureur au moyen d’un acte d’accusation visant une infraction susceptible d’entraîner la peine capitale.', null, '{organisation,procedure}', 43),
  ('procedure_penale_0044', '5203', null, 'Titre V Jugement', 'Chapitre 2 - Procédure applicable à la peine capitale', 'La défense par avocat est obligatoire.
Les douanes', null, '{procedure}', 44),
  ('procedure_penale_0045', '6101', null, 'Titre VI  Des contrôles, fouilles et dispositifs douaniers', 'Chapitre 2 - Procédure applicable à la peine capitale', 'La San Andreas Highway Patrol est une force de police d’État chargée du contrôle de toute personne, véhicule ou marchandise circulant sur les routes principales de l’État de San Andreas ainsi que dans leurs abords immédiats.', null, '{circulation,procedure}', 45),
  ('procedure_penale_0046', '6102', null, 'Titre VI  Des contrôles, fouilles et dispositifs douaniers', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Dans l’exercice de leurs missions douanières, les agents de la San Andreas Highway Patrol sont habilités à :
1.Procéder à des contrôles de papiers d’identité ;
2.Effectuer la fouille d’un véhicule ;
3.Réaliser la fouille des personnes présentes à bord d’un véhicule ;
4.Recourir à une unité cynophile ;
5.Vérifier l’existence d’amendes impayées associées aux personnes contrôlées.
6.Contrôler la consommation d’alcool ou de stupéfiants.
Ces contrôles peuvent être réalisés dans le cadre de dispositifs fixes ou mobiles, dans le respect des garanties constitutionnelles et procédurales en vigueur.
Les contrôles routiers', null, '{drogue,fraude,circulation,procedure}', 46),
  ('procedure_penale_0047', '6201', null, 'Titre VI  Des contrôles, fouilles et dispositifs douaniers', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Tous les services de force de l’ordre de l’État de San Andreas sont autorisés à mettre en place des barrages routiers en dehors des dispositifs douaniers sur leur juridiction. Ces barrages peuvent être utilisés à des fins de contrôle de sécurité, de lutte contre la criminalité, de recherche de suspects, de prévention routière ou de vérification administrative. Ces barrages ne peuvent être mis en place que 3 fois par semaine par service et avoir une durée de 30 min à 1h00  à partir du premier contrôle effectué.
Dans le cadre de ces barrages, les agents sont habilités à :
- procéder à un contrôle des papiers d’identité,
- contrôler la carte d’identité de chaques personnes présentes à bord,
- utiliser une unité canine,
- vérifier les amendes impayées associées aux personnes présentes.
Seuls les agents de la San Andreas Highway Patrol conservent la compétence exclusive pour effectuer des contrôles douaniers, conformément aux dispositions de l’Article 6102 du code de procédure pénale.
Les fourrières SAPD', null, '{fraude,circulation,procedure}', 47),
  ('procedure_penale_0048', '7101', null, 'Titre VII  La détention de véhicules', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Tout véhicule impliqué de près ou de loin à un crime ou un délit avéré pourra être mis en fourrière SAPD par les forces de l’ordre.
La durée de mise en fourrière est fixée à 72 heures pour un crime, 24 heures pour un délit et 7 jours dans le cadre d’une enquête. La Cour suprême peut modifier ces délais si elle l’estime nécessaire.', null, '{circulation,procedure}', 48),
  ('procedure_penale_0049', '7102', null, 'Titre VII  La détention de véhicules', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Tout véhicule mis en fourrière SAPD non réclamé dans un délai de 30 jours après sa mise en fourrière sera considéré comme abandonné.', null, '{circulation,procedure}', 49),
  ('procedure_penale_0050', '7102.1', null, 'Titre VII  La détention de véhicules', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Tout véhicule considéré comme abandonné appartient dès lors au service SAPD à l''origine de la saisie.', null, '{circulation,procedure}', 50),
  ('procedure_penale_0051', '7102.2', null, 'Titre VII  La détention de véhicules', 'Chapitre 2 - Procédure applicable à la peine capitale', 'Tout véhicule abandonné ou saisi par les forces de l''ordre pourra être revendu ou détruit par le biais d''un professionnel.', null, '{corruption,circulation,procedure}', 51);

-- Code de la route
drop table if exists cabinet_codes_route;
create table cabinet_codes_route (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_route enable row level security;

insert into cabinet_codes_route (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('route_0001', '1101', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Les infractions prévues par le présent Code engagent la responsabilité administrative personnelle du conducteur. Aucune responsabilité pénale automatique du titulaire du certificat d’immatriculation ne peut être retenue sur le fondement du présent Code.', null, '{circulation}', 1),
  ('route_0002', '1102', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Nul ne peut conduire un véhicule motorisé sans être titulaire d’un permis de conduire valide correspondant à la catégorie du véhicule.', null, '{circulation}', 2),
  ('route_0003', '1103', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Le permis de conduire peut être passé auprès d''une organisation agréée par l''Etat de San Andreas dès l''âge de seize (16) ans.', null, '{circulation,organisation}', 3),
  ('route_0004', '1104', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Le permis de conduire peut faire l’objet d’une suspension administrative temporaire en cas d’infraction grave au présent Code, sans préjudice des poursuites pénales éventuelles.', null, '{circulation,procedure}', 4),
  ('route_0005', '1105', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'La conduite sans permis constitue une infraction administrative aggravée. Lorsque les circonstances révèlent une mise en danger grave d’autrui, les faits peuvent être poursuivis conformément au Code pénal.', null, '{homicide,circulation}', 5),
  ('route_0006', '1106', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Tout achat de véhicule motorisé doit être déclaré auprès d''une mairie de comté dans un délai de quarante-huit (48) heures après son acquisition.', null, '{circulation}', 6),
  ('route_0007', '1107', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 1 - Responsabilité et permis de conduire', 'Par dérogation à l’article 1102, la conduite d’un véhicule de type Faggio ou Caddie est autorisée pour toute personne âgée d’au moins seize (16) ans, sans obligation de détention d’un permis de conduire.
Le port du casque est obligatoire pour tout conducteur non titulaire d’un permis de conduire.
En cas d’infraction grave ou répétée au Code de la Route, le véhicule peut être saisi et le conducteur peut se voir interdire définitivement l’accès à l’examen du permis de conduire.', null, '{circulation}', 7),
  ('route_0008', '1201', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Règles de circulation', 'Tout conducteur est tenu de respecter les règles de circulation et les limitations de vitesse en vigueur.', null, '{circulation}', 8),
  ('route_0009', '1202', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Règles de circulation', 'Les limitations de vitesse sont fixées à : 
- 50km/h en zone résidentielle, 
- 90km/h en ville, 
- 120 km/h sur les routes hors agglomérations,
- 160km/h sur les freeways et highways.
Ces limitations peuvent être modifiées par décret.', null, '{circulation}', 9),
  ('route_0010', '1203', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Règles de circulation', 'Tout conducteur doit se conformer aux règles de priorité et à la signalisation routière.', null, '{circulation}', 10),
  ('route_0011', '1204', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Règles de circulation', 'Tout conducteur doit rouler sur la voie de droite de la chaussée et respecter les tracés au sol afin de conserver une fluidité de trafic et de mouvement.', null, '{circulation,organisation}', 11),
  ('route_0012', '1204.1', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 2 - Règles de circulation', 'Il est interdit de conduire avec un taux d''alcool dans le sang supérieur ou égal à 0,5 g/l de sang ou sous l''emprise de produits stupéfiants.
Toute infraction pénale liée à la conduite sous emprise est poursuivie conformément au Code pénal.', null, '{drogue,circulation}', 12),
  ('route_0013', '1301', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Contrôles routiers', 'Les contrôles routiers sont effectués dans le respect des lois et procédures en vigueur sur le territoire de l''Etat de San Andreas.', null, '{procedure}', 13),
  ('route_0014', '1302', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Contrôles routiers', 'Un contrôle peut être effectué en présence d’un motif objectif et raisonnable tenant à la sécurité routière ou au respect du présent Code.', null, '{}', 14),
  ('route_0015', '1303', 'PARTIE I', 'Titre I Dispositions générales', 'Chapitre 3 - Contrôles routiers', 'Des contrôles routiers sans motif individuel peuvent être mis en place dans le cadre de dispositifs visibles et limités, conformément à la loi.', null, '{}', 15),
  ('route_0016', '2101', 'PARTIE I', 'Titre II Sanctions', 'Chapitre unique', 'Toute infraction au présent Code peut entrainer une sanction administrative ou pénal, selon la gravité de l''infraction.', null, '{procedure}', 16),
  ('route_0017', '2102', 'PARTIE I', 'Titre II Sanctions', 'Chapitre unique', 'Les sanctions administratives applicables comprennent :
- amende administrative,
- retrait, avec ou sans suspension, de permis de conduire,
- immobilisation ou mise en fourrière du véhicule.
Aucune peine privative de liberté ne peut être prononcée sur le fondement du présent Code.', null, '{circulation,procedure}', 17),
  ('route_0018', '2103', 'PARTIE I', 'Titre II Sanctions', 'Chapitre unique', 'Toute sanction administrative peut faire l’objet d’une contestation devant une autorité compétente, dans les conditions prévues par la loi.', null, '{procedure}', 18),
  ('route_0019', '2104', 'PARTIE I', 'Titre II Sanctions', 'Chapitre unique', 'Tout comportement routier constituant une infraction pénale est poursuivi et sanctionné conformément au Code pénal de l’Etat de San Andreas.
Texte
Titre', null, '{procedure}', 19),
  ('route_0020', '3101', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Tout véhicule motorisé est réputé immatriculé dès lors qu’un certificat d’immatriculation (carte grise) valide a été produit et peut être présenté. À défaut de production de ce document dans un délai de quarante-huit (48) heures suivant l’acquisition auprès d’une mairie de comté, le véhicule est considéré comme non immatriculé et constitue une infraction.', null, '{circulation}', 20),
  ('route_0021', '3102', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Le fait d’installer sur un véhicule une plaque d’immatriculation non conforme aux normes légales ou non attribuée audit véhicule est reconnu comme installation de plaque illégale et constitue une infraction.', null, '{circulation}', 21),
  ('route_0022', '3103', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Le fait d’équiper un véhicule d’un dispositif sonore réservé aux véhicules d’urgence ou non autorisé par la réglementation.est reconnu comme installation de sirène ou klaxon illégal et constitue une infraction.', null, '{circulation}', 22),
  ('route_0023', '3104', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Le fait de circuler sans dispositifs d’éclairage obligatoires lorsque leur usage est requis par les conditions de visibilité ou par la réglementation est reconnu comme conduite sans feu et constitue une infraction.', null, '{circulation}', 23),
  ('route_0024', '3105', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Le fait de circuler avec un véhicule présentant un défaut manifeste compromettant la sécurité ou la conformité réglementaire est reconnu comme circulation dans un véhicule endommagé et constitue une infraction.', null, '{circulation}', 24),
  ('route_0025', '3106', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 1 - Etat du véhicule', 'Le fait de laisser un véhicule sans surveillance prolongée sur la voie publique, dans des conditions laissant présumer un abandon, est reconnu comme abandon de véhicule et constitue une infraction.', null, '{circulation,ordre_public}', 25),
  ('route_0026', '3201', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 2 - Non-respect des limitations de vitesse', 'Le fait de dépasser la vitesse maximale autorisée de moins de 20 km/h constitue une infraction.', null, '{}', 26),
  ('route_0027', '3202', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 2 - Non-respect des limitations de vitesse', 'Le fait de dépasser la vitesse maximale autorisée d’un dépassement compris entre 20 km/h et 40 km/h constitue une infraction.', null, '{}', 27),
  ('route_0028', '3203', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 2 - Non-respect des limitations de vitesse', 'Le fait de dépasser la vitesse maximale autorisée d’un dépassement compris entre 40 km/h et 60 km/h constitue une infraction.', null, '{}', 28),
  ('route_0029', '3204', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 2 - Non-respect des limitations de vitesse', 'Le fait de dépasser la vitesse maximale autorisée de plus de 60 km/h constitue une infraction.', null, '{}', 29),
  ('route_0030', '3301', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait de gêner volontairement ou par négligence grave la circulation normale des véhicules ou des piétons est reconnu comme entrave à la circulation et constitue une infraction.', null, '{corruption,circulation}', 30),
  ('route_0031', '3302', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait de stationner un véhicule de manière à entraver la circulation, l’accès ou la visibilité des autres usagers est reconnu comme stationnement gênant et constitue une infraction.', null, '{corruption,circulation}', 31),
  ('route_0032', '3303', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait de franchir ou chevaucher une ligne continue matérialisant une interdiction de dépassement ou de changement de voie constitue une infraction.', null, '{}', 32),
  ('route_0033', '3304', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait de ne pas se conformer à une signalisation routière légalement implantée est reconnu comme non-respect d''un panneau de signalisation et constitue une infraction.', null, '{}', 33),
  ('route_0034', '3305', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait d’effectuer un dépassement sans visibilité suffisante ou sans respecter les règles de sécurité applicables ets reconnu comme dépassement dangereux et constitue une infraction.', null, '{}', 34),
  ('route_0035', '3306', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait d’emprunter une voie de circulation dans un sens contraire à celui autorisé est reconnu comme circulation en sens interdit et constitue une infraction.', null, '{circulation}', 35),
  ('route_0036', '3307', 'PARTIE II - INFRACTIONS', 'Titre III Infractions', 'Chapitre 3 - Non-respect des signalisations', 'Le fait de ne pas céder le passage à un usager bénéficiant d’une priorité légalement établie est reconnu comme refus de priorité et constitue une infraction.', null, '{}', 36);

-- Réglementation des armes
drop table if exists cabinet_codes_armes;
create table cabinet_codes_armes (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_armes enable row level security;

insert into cabinet_codes_armes (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('armes_reglementation_0001', 'Couteau', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 1),
  ('armes_reglementation_0002', 'Marteau', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 2),
  ('armes_reglementation_0003', 'Pied-de-biche', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 3),
  ('armes_reglementation_0004', 'Matraque (police)', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 4),
  ('armes_reglementation_0005', 'Batte de Baseball', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 5),
  ('armes_reglementation_0006', 'Club de Golf', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 6),
  ('armes_reglementation_0007', 'Bouteille cassée', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 7),
  ('armes_reglementation_0008', 'Dague antique', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 8),
  ('armes_reglementation_0009', 'Hachette', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 9),
  ('armes_reglementation_0010', 'Poing américain', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 10),
  ('armes_reglementation_0011', 'Machette', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 11),
  ('armes_reglementation_0012', 'Lampe de poche', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 12),
  ('armes_reglementation_0013', 'Couteau à cran d''arrêt', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 13),
  ('armes_reglementation_0014', 'Queue de billard', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 14),
  ('armes_reglementation_0015', 'Clé anglaise', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 15),
  ('armes_reglementation_0016', 'Katana', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 16),
  ('armes_reglementation_0017', 'Hache de guerre', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 17),
  ('armes_reglementation_0018', 'KM-2000', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 18),
  ('armes_reglementation_0019', 'Batte de Slayer', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 19),
  ('armes_reglementation_0020', 'Karambit', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 20),
  ('armes_reglementation_0021', 'Couteau tactique', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 21),
  ('armes_reglementation_0022', 'Couteau de combat', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 22),
  ('armes_reglementation_0023', 'Lance de combat', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 23),
  ('armes_reglementation_0024', 'Lame tactique', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 24),
  ('armes_reglementation_0025', 'U Knife', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 25),
  ('armes_reglementation_0026', 'Karambit d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 26),
  ('armes_reglementation_0027', 'Trident d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 27),
  ('armes_reglementation_0028', 'Epée d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 28),
  ('armes_reglementation_0029', 'Fléche d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 29),
  ('armes_reglementation_0030', 'Batte diamant', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 30),
  ('armes_reglementation_0031', 'Sucette (d''amour)', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 31),
  ('armes_reglementation_0032', 'Fouet d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 32),
  ('armes_reglementation_0033', 'Batte rouge (d''amour)', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 33),
  ('armes_reglementation_0034', 'Rose d''amour', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 34),
  ('armes_reglementation_0035', 'Éviscérateur', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 35),
  ('armes_reglementation_0036', 'Pioche', null, 'Armes', 'Cat. 1 - Armes Blanches', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 36),
  ('armes_reglementation_0037', 'Pistolet', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 37),
  ('armes_reglementation_0038', 'Pistolet de détresse', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 38),
  ('armes_reglementation_0039', 'Pétoire', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 39),
  ('armes_reglementation_0040', 'Glock18C', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 40),
  ('armes_reglementation_0041', 'Colt 1911', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 41),
  ('armes_reglementation_0042', 'Glock20', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 42),
  ('armes_reglementation_0043', 'Pistolet lourd', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 43),
  ('armes_reglementation_0044', 'Pistolet de tireur d''élite', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 44),
  ('armes_reglementation_0045', 'Glock22', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 45),
  ('armes_reglementation_0046', 'Pistolet de Combat', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 46),
  ('armes_reglementation_0047', 'Pistolet Cal.50', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 47),
  ('armes_reglementation_0048', 'Pistolet paralysant (Taser)', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 48),
  ('armes_reglementation_0049', 'Beanbag', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 49),
  ('armes_reglementation_0050', 'Pistolet vintage', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 50),
  ('armes_reglementation_0051', 'Evi Revolver', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 51),
  ('armes_reglementation_0052', 'Revolver double action', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 52),
  ('armes_reglementation_0053', 'Pistolet MkII', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 53),
  ('armes_reglementation_0054', 'Pistolet Céramique', null, 'Armes', 'Cat. 2 - Armes de poing', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 54),
  ('armes_reglementation_0055', 'Machine Pistol ( Tec9 )', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 55),
  ('armes_reglementation_0056', 'Micro SMG (Uzi)', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 56),
  ('armes_reglementation_0057', 'Mac 10', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 57),
  ('armes_reglementation_0058', 'Mini Smg', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 58),
  ('armes_reglementation_0059', 'SMG', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 59),
  ('armes_reglementation_0060', 'Pistolet Perf', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 60),
  ('armes_reglementation_0061', 'Mitraillette d''assaut', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 61),
  ('armes_reglementation_0062', 'ADP de combat', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 62),
  ('armes_reglementation_0063', 'Compact Rifle (Micro AK )', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 63),
  ('armes_reglementation_0064', 'Carabine', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 64),
  ('armes_reglementation_0065', 'Fusil amélioré', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 65),
  ('armes_reglementation_0066', 'Fusil d''assaut', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 66),
  ('armes_reglementation_0067', 'PDW de combat', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 67),
  ('armes_reglementation_0068', 'SMG d''assaut', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 68),
  ('armes_reglementation_0069', 'Carabine spéciale', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 69),
  ('armes_reglementation_0070', 'Fusil avancé', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 70),
  ('armes_reglementation_0071', 'MG', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 71),
  ('armes_reglementation_0072', 'MG de combat', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 72),
  ('armes_reglementation_0073', 'Assault Rifle (AK-47)', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 73),
  ('armes_reglementation_0074', 'Gusenberg Sweeper', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 74),
  ('armes_reglementation_0075', 'Scars 16s', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 75),
  ('armes_reglementation_0076', 'M6IC', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 76),
  ('armes_reglementation_0077', 'HK416A5 (SAPD)', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 77),
  ('armes_reglementation_0078', 'M4', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 78),
  ('armes_reglementation_0079', 'Fusil à pompe', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 79),
  ('armes_reglementation_0080', 'Carabine spéciale', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 80),
  ('armes_reglementation_0081', 'Fusil à pompe bullpup', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 81),
  ('armes_reglementation_0082', 'Double action', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 82),
  ('armes_reglementation_0083', 'Fusil à double canon', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 83),
  ('armes_reglementation_0084', 'Heavy shotgun', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 84),
  ('armes_reglementation_0085', 'Fusil à canon scié', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 85),
  ('armes_reglementation_0086', 'Mousquet (Permis de chasse)', null, 'Armes', 'Cat. 3 - Armes lourdes', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes,circulation,environnement}', 86),
  ('armes_reglementation_0087', 'Feux d''artifices', null, 'Armes', 'Cat. 4 - Explosifs et autres', 'Autorisée : Oui · Collection : Non · Interdite : Non', null, '{armes}', 87),
  ('armes_reglementation_0088', 'Cocktail Molotov', null, 'Armes', 'Cat. 4 - Explosifs et autres', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 88),
  ('armes_reglementation_0089', 'C4', null, 'Armes', 'Cat. 4 - Explosifs et autres', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 89),
  ('armes_reglementation_0090', 'Grenade lacrymogène', null, 'Armes', 'Cat. 4 - Explosifs et autres', 'Autorisée : Non · Collection : Non · Interdite : Oui', null, '{armes}', 90);

-- Classification de l'état d'urgence
drop table if exists cabinet_codes_etat_urgence;
create table cabinet_codes_etat_urgence (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_etat_urgence enable row level security;

insert into cabinet_codes_etat_urgence (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('etat_urgence_0001', 'Durée', null, 'État d''urgence', null, 'N/A | 1 à 72h | 1 à 72h | 1 à 48h | 1 à 24h', null, '{etat_urgence}', 1),
  ('etat_urgence_0002', 'Renouvellement', null, 'État d''urgence', null, 'N/A | 1 à 48h | 1 à 48h | 1 à 48h | 1 à 24h', null, '{etat_urgence}', 2),
  ('etat_urgence_0003', 'Périmètre min.', null, 'État d''urgence', null, 'N/A | Secteur de police | Comté / Ensemble de l''Etat | Comté / Ensemble de l''Etat | Comté / Ensemble de l''Etat', null, '{etat_urgence}', 3),
  ('etat_urgence_0004', 'Décisionnaire', null, 'État d''urgence', null, 'N/A | DoJ | DoJ avec approbation du Maire territorialement compétent | Le Gouverneur ou le Bureau du Maire territorialement compétent | Le Gouverneur ou le Maire territorialement compétent
 en informant les Présidents des Chambres du Congrès', null, '{organisation,etat_urgence}', 4),
  ('etat_urgence_0005', 'Signification', null, 'État d''urgence', null, 'Situation normale | Menace potentielle pour la sécurité publique | Menace potentielle pour la sécurité publique | Sécurité publique perturbée | La sécurité publique ne peut etre assurée, rétablissement en cours', null, '{violence,procedure,etat_urgence}', 5),
  ('etat_urgence_0006', 'Rassemblements, manifestations, évènements publics', null, 'État d''urgence', null, 'N/A | N/A | Le Gouverneur ou le Maire territorialement compétent peut annuler une manifestation, rassemblement  ou évènement public (ou refuser l''organisation), si les conditions ne sont pas réunis pour un déroulement en toute sécurité. | Suspension de tout évènement public, rassemblement ou manifestation.', null, '{organisation,ordre_public,etat_urgence}', 6),
  ('etat_urgence_0007', 'Immigration', null, 'État d''urgence', null, 'N/A | N/A | N/A | Fermeture des flux de personnes non citoyennes entrant sur le territoire de l''Etat de San Andreas / Non resident dans le Comté', null, '{etat_urgence}', 7),
  ('etat_urgence_0008', 'Permis de port d''arme civil (PPA)', null, 'État d''urgence', null, 'N/A | N/A | N/A | Le PPA civil peut être suspendu sur décision', null, '{armes,circulation,etat_urgence}', 8),
  ('etat_urgence_0009', 'Réquisition', null, 'État d''urgence', null, 'N/A | N/A | N/A | Le Gouverneur ou le Maire territorialement compétent peut réquisitionner des personnes ou moyens privés.', null, '{organisation,etat_urgence}', 9),
  ('etat_urgence_0010', 'Equipement
Forces de l''ordre', null, 'État d''urgence', null, 'Equipement normal | Gilet pare-balles visibles + taser en main | Gilet pare-balles visible + taser en main | Gilet pare-balles visible + armes de service (cat. 2) en mains.
Utilisation en usage dissuasif lors d''un contrôle de périmètre. | Gilet pare-balles visible + armes lourdes équipées de manière visible.', null, '{armes,corruption,etat_urgence}', 10),
  ('etat_urgence_0011', 'Contrôles de police', null, 'État d''urgence', null, 'N/A | N/A | Palpation lors d''un contrôle suite à une infraction | Contrôle identité et palpation + fouille des véhicules lors d''un controle suite à une infraction. | Contrôle identité, fouille individu et véhicule sur suspiçion.', null, '{circulation,procedure,etat_urgence}', 11),
  ('etat_urgence_0012', 'Unités d''intervention
(SWAT, BCSS)', null, 'État d''urgence', null, 'N/A | N/A | N/A | Mobilisables en 10 minutes | Déploiement et présence permanente des unités d''intervention.', null, '{etat_urgence}', 12);

-- Autres lois et décrets
drop table if exists cabinet_codes_autres_lois;
create table cabinet_codes_autres_lois (id text primary key, numero text not null, partie text, titre_rubrique text, chapitre text, texte text not null default '', applicable text, tags text[] not null default '{}', ordre integer not null default 0, created_at timestamptz not null default now());
alter table cabinet_codes_autres_lois enable row level security;

insert into cabinet_codes_autres_lois (id, numero, partie, titre_rubrique, chapitre, texte, applicable, tags, ordre) values
  ('autres_lois_0001', '21/07/2026', 'Décret', 'Etat de San Andreas', 'Source : DÉCRET RAPPEL COMTE DE CAYO PERICO.docx', 'Relatif à l''intégration du compté de Cayo Perico', null, '{}', 1),
  ('autres_lois_0002', '01/08/2026', 'Décret', 'Etat de San Andreas', 'Source : DÉCRET RELATIF A LA MODIFICATION DU CPP .docx', 'Relatif à la modification du Code de Procédure Pénale de l’État de San Andreas', null, '{procedure}', 2),
  ('autres_lois_0003', '04/08/2026', 'Décret', 'Blaine County', 'Source : Décret municipal n°6', 'Relatif à la consommation d''alcool et de produits stupéfiants par les forces de l''ordre en service', null, '{drogue,corruption}', 3),
  ('autres_lois_0004', '09/08/2026', 'Décret', 'Blaine County', 'Source : DÉCRET BLAINE COUNTY PERMIS NAVAL', 'Réglementation relative à l’utilisation des embarcations et aux conditions d’obtention du permis naval', null, '{circulation}', 4),
  ('autres_lois_0005', '09/08/2026', 'Décret', 'Blaine County', 'Source : DÉCRET BLAINE COUNTY permis aeronef', 'Relatif au permis aéronef et à l’utilisation des aéronefs', null, '{circulation}', 5),
  ('autres_lois_0006', '14/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - CRÉATION D’UN SERVICE DE SÉCURITÉ PERMANENT AU SEIN DE LA MAIRIE', 'Relatif à la créatino d''un service de sécurité permanent au sein de la mairie', null, '{}', 6),
  ('autres_lois_0007', '14/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - AUTORISATION DU PORT VISIBLE DES ARMES À FEU DANS LE COMTÉ DE LOS SANTOS', 'Relatif à l''autorisation du port visible des armes à feu dans le comté de Los Santos', null, '{armes}', 7),
  ('autres_lois_0008', '16/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - OBLIGATION DU PERMIS DE NAVIGATION DANS LE COMTÉ DE LOS SANTOS', 'Relatif à l''obligation du permis de navigation', null, '{circulation}', 8),
  ('autres_lois_0009', '16/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - OBLIGATION DU PERMIS DE PILOTAGE D''AÉRONEF DANS LE COMTÉ DE LOS SANTOS', 'Relatif à l''obligation du permis de pilotage d''aéronef', null, '{circulation}', 9),
  ('autres_lois_0010', '18/08/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - PRISE EN CHARGE INTÉGRALE DES FRAIS LIÉS À LA GROSSESSE ET À LA MATERNITÉ', 'Relatif à la prise en charge intégrale des frais liés à la grossesse et à la maternité', null, '{}', 10),
  ('autres_lois_0011', '18/08/2026', 'Décret', 'Blaine County', 'Source : Décret municipal BC-0817 — Rassemblements et événements publics', 'Relatif à l''encadrement des rassemblements, manifestation et événements sur la voie publique', null, '{ordre_public}', 11),
  ('autres_lois_0012', '19/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA GESTION DES SITUATIONS DE CRISE ET À LA CONTINUITÉ DES SERVICES PUBLICS', 'Relatif à la gestion des situations de crise et à la continuité des services publics', null, '{}', 12),
  ('autres_lois_0013', '19/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA RÉMUNÉRATION DES MEMBRES ET AGENTS DE LA MAIRIE DU COMTÉ DE LOS SANTOS', 'Relatif à la rémunération des membres et agens de la mairie du comté', null, '{}', 13),
  ('autres_lois_0014', '19/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF AUX AIDES SOCIALES ET À L''ACCÈS AUX LOGEMENTS SOCIAUX DANS LE COMTÉ DE LOS SANTOS', 'Relatif aux aides sociales et à l''accès au logement social', null, '{fraude}', 14),
  ('autres_lois_0015', '19/08/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - DÉCRET RELATIF À LA CONSTITUTION ET AU MAINTIEN DES STOCKS DE SECOURS DU LSPD ET DU LSMD', 'Relatif à la constitution et au maintien des stocks de secours du LSPD et du LSMD', null, '{}', 15),
  ('autres_lois_0016', '28/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - MARCHÉS PUBLICS ET CONTRATS MUNICIPAUX DU COMTÉ DE LOS SANTOS', 'Relatif aux marchés publics et contrats municipaux du comté de Los Santos', null, '{}', 16),
  ('autres_lois_0017', '28/08/2026', 'Décret', 'Los Santos County', 'Source : Décret - GRATUITÉ DES EXTRAITS DE CASIER JUDICIAIRE', 'Relatif à la gratuité des extraits de casier judiciaire', null, '{}', 17),
  ('autres_lois_0018', '05/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET PORTANT SUR LA CRÉATION ET L''ORGANISATION DU CONSEIL MUNICIPAL DU COMTÉ DE LOS SANTOS', 'Relatif à la création et à l''organisation du conseil municipal du comté de Los Santos', null, '{organisation}', 18),
  ('autres_lois_0019', '05/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET PORTANT ORGANISATION ET FONCTIONNEMENT DE LA MAIRIE DU COMTÉ DE LOS SANTOS', 'Relatif à l''organisation et au fonctionnement de la mairie du comté de Los Santos', null, '{organisation}', 19),
  ('autres_lois_0020', '05/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - DÉCRET RELATIF AUX MANIFESTATIONS, ÉVÉNEMENTS PUBLICS ET À L''OCCUPATION TEMPORAIRE DU DOMAINE MUNICIPAL', 'Relatif aux manifestations, aux événements publics et à l''occupation temporaire du domaine municipal', null, '{ordre_public}', 20),
  ('autres_lois_0021', '05/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA TRANSPARENCE ADMINISTRATIVE ET À LA PUBLICATION DES ACTES MUNICIPAUX', 'Relatif à la transprence administrative et à la publication des actes municipaux', null, '{}', 21),
  ('autres_lois_0022', '05/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA CRÉATION D''UNE MUTUELLE AU SEIN DU COMTÉ DE LOS SANTOS', 'Relatif à la création d''une mutuelle au sein de comté de Los Santos', null, '{}', 22),
  ('autres_lois_0023', '05/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA LIMITATION DE LA DÉTENTION DE BIENS IMMOBILIERS DANS LE COMTÉ DE LOS SANTOS', 'Relatif à la limitation de la détention de biens immobiliers dans le comté de Los Santos', null, '{}', 23),
  ('autres_lois_0024', '18/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - DÉCRET RELATIF AUX ASSOCIATIONS ET AUX AIDES MUNICIPALES', 'Relatif aux associations et aux aides municipales', null, '{}', 24),
  ('autres_lois_0025', '18/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET PORTANT PLAN STRATÉGIQUE DE DÉVELOPPEMENT DU COMTÉ DE LOS SANTOS', 'Plan stratégique de développement du comté de Los Santos', null, '{}', 25),
  ('autres_lois_0026', '18/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA COOPÉRATION ENTRE LA MAIRIE ET LES ENTREPRISES DU COMTÉ DE LOS SANTOS', 'Relatif à la coopération entre la mairie et les entreprises du comté de Los Santos', null, '{}', 26),
  ('autres_lois_0027', '18/09/2026', 'Décret', 'Los Santos County', 'Source : Décret - DÉCRET RELATIF À LA GESTION ET À L''UTILISATION DU DOMAINE MUNICIPAL', 'Relatif à la gestion et à l''utilisation du domaine municipal', null, '{}', 27),
  ('autres_lois_0028', '18/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - DÉCRET RELATIF À LA CONTINUITÉ ET AU REMPLACEMENT DES RESPONSABLES MUNICIPAUX', 'Relatif à la continuité et au remplacement des responsables municipaux', null, '{}', 28),
  ('autres_lois_0029', '19/09/2026', 'Décret', 'Blaine County', 'Source : décret BCPS', 'Relatif à la création du Blaine County Protective Service', null, '{}', 29),
  ('autres_lois_0030', '20/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - DÉCRET RELATIF À LA CRÉATION D''UN FONDS DE CRÉDIT MUNICIPAL', 'Relatif à la création d''un fonds de crédit municipal', null, '{}', 30),
  ('autres_lois_0031', '23/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Proposition de Décret - DÉCRET RELATIF AU PROGRAMME D''INSERTION PROFESSIONNELLE ET DE SECONDE CHANCE', 'Relatif au programme d''insertion professionnelle et de seconde chance', null, '{}', 31),
  ('autres_lois_0032', '23/09/2026', 'Décret', 'Etat de San Andreas', 'Source : Décret - ENCADREMENT DES VENTES AUX ENCHÈRES PUBLIQUES DE VÉHICULES SAISIS', 'Relatif à l''encadrement des ventes aux enchères publiques des véhicules saisis', null, '{circulation}', 32),
  ('autres_lois_0033', '21/10/2026', 'Décret', 'Etat de San Andreas', 'Source : DÉCRET N° 2026-27', 'Relatif à la fermeture administrative d’une entreprise pour absence de déclarations ou déclarations nulles depuis plus de quatre semaines', null, '{}', 33);

-- Livret des peines (feuille « Livret des peines » du guide)
drop table if exists cabinet_codes_livret;
create table cabinet_codes_livret (id text primary key, article text not null, categorie_id text not null, titre text not null, contenu text, amende text, detention text, procureur boolean not null default false, bracelet boolean not null default false, autres_sanctions text, ordre integer not null default 0, tags text[] not null default '{}', created_at timestamptz not null default now());
alter table cabinet_codes_livret enable row level security;

insert into cabinet_codes_livret (id, article, categorie_id, titre, contenu, amende, detention, procureur, bracelet, autres_sanctions, ordre, tags) values
  ('L001', 'CR. 3101.', '0 - Infraction non pénale', 'Absence d''immatriculation', null, '$2,500', null, false, false, null, 1, '{circulation}'),
  ('L002', 'CR. 3102.', '0 - Infraction non pénale', 'Installation de plaque illégale', null, '$1,000', null, false, false, null, 2, '{}'),
  ('L003', 'CR. 3103.', '0 - Infraction non pénale', 'Installation de sirène ou klaxon illégal', null, '$500', null, false, false, null, 3, '{}'),
  ('L004', 'CR. 3104.', '0 - Infraction non pénale', 'Conduite sans feu', null, '$500', null, false, false, null, 4, '{circulation}'),
  ('L005', 'CR. 3105.', '0 - Infraction non pénale', 'Circulation dans un véhicule endommagé', null, '$500', null, false, false, null, 5, '{circulation}'),
  ('L006', 'CR. 3106.', '0 - Infraction non pénale', 'Abandon de véhicule', null, '$500', null, false, false, null, 6, '{circulation}'),
  ('L007', 'CR. 3201.', '0 - Infraction non pénale', 'Excès de vitesse inférieur à 20 km/h', null, '$1,000', null, false, false, null, 7, '{circulation}'),
  ('L008', 'CR. 3202.', '0 - Infraction non pénale', 'Excès de vitesse de 20 à 40 km/h', null, '$1,500', null, false, false, null, 8, '{circulation}'),
  ('L009', 'CR. 3203.', '0 - Infraction non pénale', 'Excès de vitesse de 40 à 60 km/h', null, '$2,500', null, false, false, null, 9, '{circulation}'),
  ('L010', 'CR. 3204.', '0 - Infraction non pénale', 'Excès de vitesse supérieur à 60 km/h', null, '$5,000', null, false, false, 'Au bout de 3 arrestations : retrait (avec suspension) du permis et immobilisation du véhicule.', 10, '{circulation,procedure}'),
  ('L011', 'CR. 3301.', '0 - Infraction non pénale', 'Entrave à la circulation', null, '$2,500', null, false, false, null, 11, '{corruption,circulation}'),
  ('L012', 'CR. 3302.', '0 - Infraction non pénale', 'Stationnement gênant', null, '$500', null, false, false, null, 12, '{circulation}'),
  ('L013', 'CR. 3303.', '0 - Infraction non pénale', 'Franchissement ou chevauchement de ligne continue', null, '$500', null, false, false, null, 13, '{}'),
  ('L014', 'CR. 3304.', '0 - Infraction non pénale', 'Non-respect de panneau de signalisation', null, '$500', null, false, false, null, 14, '{}'),
  ('L015', 'CR. 3305.', '0 - Infraction non pénale', 'Dépassement dangereux', null, '$500', null, false, false, null, 15, '{}'),
  ('L016', 'CR. 3306.', '0 - Infraction non pénale', 'Circulation en sens interdit', null, '$500', null, false, false, null, 16, '{circulation}'),
  ('L017', 'CR. 3307.', '0 - Infraction non pénale', 'Refus de priorité', null, '$500', null, false, false, null, 17, '{}'),
  ('L018', 'CMC. 4101.', '0 - Infraction non pénale', 'Absence d''immatriculation d''embarcation', null, '$2,500', null, false, false, null, 18, '{circulation}'),
  ('L019', 'CMC. 4102.', '0 - Infraction non pénale', 'Abandon d''embarcation', null, '$1,500', null, false, false, null, 19, '{circulation}'),
  ('L020', 'CMC. 4103', '0 - Infraction non pénale', 'Entrave au trafic maritime', null, '$1,500', null, false, false, null, 20, '{corruption,organisation}'),
  ('L021', 'CMC. 4104', '0 - Infraction non pénale', 'Non-respect des vitesses réglementaires', null, '$2,500', null, false, false, null, 21, '{}'),
  ('L022', 'CAC. 4101.', '0 - Infraction non pénale', 'Absence d''immatriculation d''aéronef', null, '$2,500', null, false, false, null, 22, '{circulation}'),
  ('L023', 'CAC. 4102.', '0 - Infraction non pénale', 'Stationnement interdit', null, '$2,500', null, false, false, null, 23, '{circulation}'),
  ('L024', 'CAC. 4103.', '0 - Infraction non pénale', 'Entrave au trafic aérien', null, '$5,000', null, false, false, null, 24, '{corruption,organisation}'),
  ('L025', 'CAC. 4104.', '0 - Infraction non pénale', 'Abandon d''aéronef', null, '$5,000', null, false, false, null, 25, '{circulation}'),
  ('L026', 'CEnv. 4101.', '0 - Infraction non pénale', 'Trouble au calme et à la tranquilité dans un espace protégé', null, '$1,000', null, false, false, null, 26, '{ordre_public,environnement}'),
  ('L027', 'CEnv. 4102.', '0 - Infraction non pénale', 'Abandon de détritus ou d''objet dans un espace protégé', null, '$1,500', null, false, false, null, 27, '{environnement}'),
  ('L028', 'CEnv. 4103.', '0 - Infraction non pénale', 'Non-respect d''un règlement intérieur d''un espace protégé', null, '$2,000', null, false, false, null, 28, '{environnement}'),
  ('L029', 'CEnv. 4104.', '0 - Infraction non pénale', 'Détérioration d''un espace protégé', null, '$5,000', null, false, false, null, 29, '{environnement}'),
  ('L030', 'CEnv. 4201.', '0 - Infraction non pénale', 'Chasse sans permis', null, '$5,000', null, false, false, 'Au bout de 3 arrestations : saisie de l''arme', 30, '{armes,circulation,procedure,environnement}'),
  ('L031', 'CEnv. 4202.', '0 - Infraction non pénale', 'Non-respect des règles de sécurité pour la pratique de la chasse', null, '$5,000', null, false, false, null, 31, '{environnement}'),
  ('L032', 'CEnv. 4203.', '0 - Infraction non pénale', 'Pêche sans permis', null, '$5,000', null, false, false, null, 32, '{circulation,environnement}'),
  ('L033', 'CP. 4201.', '1 - Infraction mineure', 'Exhibition sexuelle', null, '$2,500', null, false, false, null, 33, '{sexuel}'),
  ('L034', 'CP. 7401.', '1 - Infraction mineure', 'Mendicité', null, '$1,000', null, false, false, null, 34, '{}'),
  ('L035', 'CP. 7402.', '1 - Infraction mineure', 'Ivresse sur la voie publique', null, '$1,500', '-', false, false, 'Placement en cellule de dégrisement', 35, '{ordre_public}'),
  ('L036', 'CP. 7404.', '1 - Infraction mineure', 'Trouble à l''ordre public', null, '$5,000', null, false, false, null, 36, '{ordre_public}'),
  ('L037', 'CC. 1501.', '1 - Infraction mineure', 'Non recensement et statut civique Applicable uniquement sur Los Santos.', null, '$2,500', null, false, false, null, 37, '{}'),
  ('L038', 'CP. 4101.', '2 - Délit mineur', 'Non-assistance à personne en danger', null, '$5,000', '10', false, false, null, 38, '{}'),
  ('L039', 'CP. 4103.', '2 - Délit mineur', 'Violence', null, '$2,500', '15', true, false, null, 39, '{violence}'),
  ('L040', 'CP. 4401.', '2 - Délit mineur', 'Discrimination', null, '$10,000', '15', true, false, null, 40, '{}'),
  ('L041', 'CP. 4402.', '2 - Délit mineur', 'Harcèlement', null, '$10,000', '20', true, false, null, 41, '{sexuel}'),
  ('L042', 'CP. 4407.', '2 - Délit mineur', 'Harcèlement sexuel Applicable uniquement sur Los Santos.', null, '$25,000', '15', true, false, null, 42, '{sexuel}'),
  ('L043', 'CP. 4404.', '2 - Délit mineur', 'Injure', null, '$5,000', '10', false, false, null, 43, '{}'),
  ('L044', 'CP. 4108', '2 - Délit mineur', 'Menace et intimidation', null, '$3,000', '10', false, false, null, 44, '{violence}'),
  ('L045', 'CP. 5101.', '2 - Délit mineur', 'Vol', null, '$3,500', '15', false, false, null, 45, '{vol}'),
  ('L046', 'CP. 5108.', '2 - Délit mineur', 'Dégradation de bien', null, '$5,000', '0', false, false, null, 46, '{}'),
  ('L047', 'CP. 6102.', '2 - Délit mineur', 'Exhibition d''arme', null, '$5,000', '10', false, false, null, 47, '{armes,sexuel}'),
  ('L048', 'CP. 6104.', '2 - Délit mineur', 'Possession illégale de gilet pare-balle', null, '$5,000', '10', false, false, null, 48, '{armes}'),
  ('L049', 'CP. 6107.', '2 - Délit mineur', 'Détention illégale multiple d’armes légales', null, '$15,000', '20', false, false, 'Suspension ou retrait du PPA ou du permis de chasse.', 49, '{armes,circulation,environnement}'),
  ('L050', 'CP. 6108.', '2 - Délit mineur', 'Usage d''une arme létale Applicable uniquement sur Los Santos.', null, '$7,500', '10', false, false, null, 50, '{armes}'),
  ('L051', 'CP. 6109.', '2 - Délit mineur', 'Usage abusif d’une arme à feu Applicable uniquement à Blaine County.', null, '$7,500', '10', true, false, null, 51, '{armes}'),
  ('L052', 'CP. 7101.', '2 - Délit mineur', 'Refus d''obtempérer', null, '$2,500', '10', false, false, null, 52, '{corruption}'),
  ('L053', 'CP. 7102.', '2 - Délit mineur', 'Refus d''identification', null, '$2,500', '10', false, false, null, 53, '{corruption}'),
  ('L054', 'CP. 7104.', '2 - Délit mineur', 'Non-présentation à une convocation officielle', null, '$10,000', '10', false, false, null, 54, '{}'),
  ('L055', 'CP. 7403.', '2 - Délit mineur', 'Appel abusif aux services d’urgence', null, '$10,000', '10', false, false, null, 55, '{}'),
  ('L056', 'CP. 7405.', '2 - Délit mineur', 'Manifestation illégale', null, '$5,000', '10', false, false, null, 56, '{ordre_public}'),
  ('L057', 'CP. 8103.', '2 - Délit mineur', 'Possession de produit stupéfiant', null, '$2,500', '10', false, false, null, 57, '{drogue}'),
  ('L058', 'CP. 8106.', '2 - Délit mineur', 'Consommation de produit stupéfiant', null, '$2,500', '-', false, false, 'Placement en cellule de dégrisement', 58, '{drogue}'),
  ('L059', 'CP. 9101.', '2 - Délit mineur', 'Possession d''argent non-déclaré', null, '$0', '10', false, false, 'Saisie de la somme et retour sur présentation de justificatif de provenance', 59, '{fraude}'),
  ('L060', 'CP. 9102.', '2 - Délit mineur', 'Possession d''argent en espèce en quantité illégale', null, '$0', '10', false, false, 'Saisie de la somme et retour sur présentation de justificatif de provenance', 60, '{fraude}'),
  ('L061', 'CP. 10101.', '2 - Délit mineur', 'Conduite sans permis', null, '$5,000', '0', false, false, 'Immobilisation du vehicule', 61, '{circulation}'),
  ('L062', 'CP. 10105.', '2 - Délit mineur', 'Circulation avec un véhicule faussement immatriculé', null, '$10,000', '10', false, false, null, 62, '{circulation}'),
  ('L063', 'CP. 10201.', '2 - Délit mineur', 'Navigation sans permis', null, '$10,000', '0', false, false, 'Immobilisation de l''embarcation', 63, '{circulation}'),
  ('L064', 'CP. 11103.', '2 - Délit mineur', 'Destruction de la faune', null, '$300 par unité', '10', false, false, null, 64, '{environnement}'),
  ('L065', 'CP. 11108.', '2 - Délit mineur', 'Destruction de la flore  Applicable uniquement à Blaine County.', null, '$5,000', '15', true, false, null, 65, '{environnement}'),
  ('L066', 'CP. 11104.', '2 - Délit mineur', 'Pêche ou chasse illégale d''une espèce protégée', null, '$10,000', '10', false, false, null, 66, '{environnement}'),
  ('L067', 'CP. 4102.', '3 - Délit', 'Mise en danger de la vie d''autrui', null, '$5,000', '15', false, false, null, 67, '{homicide}'),
  ('L068', 'CP. 4104.', '3 - Délit', 'Violence avec arme blanche', null, '$2,500', '15', true, false, 'Saisie de l''arme', 68, '{armes,violence}'),
  ('L069', 'CP. 4105.', '3 - Délit', 'Violence avec arme à feu', null, '$10,000', '15', true, false, 'Saisie de l''arme', 69, '{armes,violence}'),
  ('L070', 'CP. 4403.', '3 - Délit', 'Abus de faiblesse', null, '$10,000', '15', true, false, null, 70, '{}'),
  ('L071', 'CP. 4405.', '3 - Délit', 'Racisme Applicable uniquement sur Los Santos.', null, '$15,000', '15', false, false, null, 71, '{}'),
  ('L072', 'CP. 4406.', '3 - Délit', 'Diffamation', null, '$10,000', '10', false, false, null, 72, '{}'),
  ('L073', 'CP. 5103.', '3 - Délit', 'Cambriolage', null, '$4,000', '15', false, false, null, 73, '{vol}'),
  ('L074', 'CP. 5104.', '3 - Délit', 'Recel', null, '$10,000', '15', false, false, null, 74, '{vol}'),
  ('L075', 'CP. 5105.', '3 - Délit', 'Extorsion', null, '$20,000', '15', true, false, null, 75, '{vol}'),
  ('L076', 'CP. 5106.', '3 - Délit', 'Contrefaçon', null, '$20,000', '15', false, false, null, 76, '{fraude}'),
  ('L077', 'CP. 5107.', '3 - Délit', 'Violation de propriété privée', null, '$5,000', '10', false, false, null, 77, '{}'),
  ('L078', 'CP. 6101.', '3 - Délit', 'Défaut de PPA', null, '$10,000', '30', false, false, 'Saisie de l''arme', 78, '{armes}'),
  ('L079', 'CP. 6103.1', '3 - Délit', 'Possession illégale d’arme blanche', null, '$7,500', '15', false, false, 'Saisie de l''arme', 79, '{armes}'),
  ('L080', 'CP. 6103.2', '3 - Délit', 'Possession illégale d’arme létale', null, '$15,000', '15', false, false, 'Saisie de l''arme', 80, '{armes}'),
  ('L081', 'CP. 7103.', '3 - Délit', 'Délit de fuite', null, '$10,000', '20', false, false, null, 81, '{}'),
  ('L082', 'CP. 7105.', '3 - Délit', 'Non-respect de contrôle judiciaire', null, '$5,000', '10', true, false, null, 82, '{}'),
  ('L083', 'CP. 7201.', '3 - Délit', 'Obstruction à la justice', null, '$20,000', '20', true, false, null, 83, '{corruption}'),
  ('L084', 'CP. 7501.', '3 - Délit', 'Violation du devoir de réserve', null, '$15,000', '30', false, false, null, 84, '{corruption}'),
  ('L085', 'CP. 7502.', '3 - Délit', 'Violation du secret professionnel', null, '$30,000', '30', false, false, null, 85, '{corruption}'),
  ('L086', 'CP. 7302.', '3 - Délit', 'Entrave à intervention des services publics', null, '$10,000', '20', false, false, null, 86, '{corruption}'),
  ('L087', 'CP. 8104.', '3 - Délit', 'Vente de produit stupéfiant', null, '$2,500', '10', false, false, null, 87, '{drogue}'),
  ('L088', 'CP. 9103.', '3 - Délit', 'Fraude', null, '$20,000', '15', true, false, null, 88, '{fraude}'),
  ('L089', 'CP. 9201.', '3 - Délit', 'Abus de confiance', null, '$10,000', '15', true, false, null, 89, '{fraude}'),
  ('L090', 'CP. 9301', '3 - Délit', 'Non respect d''un délai de paiement (Délai de 72h)', null, 'Amendes x2', '15', true, false, null, 90, '{fraude}'),
  ('L091', 'CP. 9303', '3 - Délit', 'Factures auprès d''un service public impayées au dela de 30 000$', null, 'Saisie', null, true, false, 'Saisie des biens a hauteur des amendes impayées', 91, '{fraude}'),
  ('L092', 'CP. 10102.', '3 - Délit', 'Conduite dangereuse', null, '$1,000', '0', false, false, null, 92, '{circulation}'),
  ('L093', 'CP. 10103.', '3 - Délit', 'Conduite sous emprise', null, '$1,000', '0', false, false, 'Immobilisation du véhicule + Placement en cellule de dégrisement', 93, '{circulation}'),
  ('L094', 'CP. 10104.', '3 - Délit', 'Course illégal', null, '$2,500', '10', false, false, 'Immobilisation du véhicule', 94, '{circulation,procedure}'),
  ('L095', 'CP. 10202.', '3 - Délit', 'Navigation dangereuse', null, '$5,000', '10', false, false, 'Immobilisation de l''embarcation', 95, '{circulation}'),
  ('L096', 'CP. 10203.', '3 - Délit', 'Navigation en zone interdite', null, '$15,000', '30', false, false, null, 96, '{circulation}'),
  ('L097', 'CP. 10301.', '3 - Délit', 'Pilotage d''un aéronef sans licence', null, '$20,000', '15', false, false, 'Immobilisation de l''aéronef', 97, '{circulation}'),
  ('L098', 'CP. 10302.', '3 - Délit', 'Pilotage dangereux d''un aéronef', null, '$10,000', '10', false, false, 'Retrait de la licence + Immobilisation de l''aéronef', 98, '{circulation}'),
  ('L099', 'CP. 10303.', '3 - Délit', 'Survol en aéronef d''une zone interdite', null, '$30,000', '30', false, false, null, 99, '{circulation}'),
  ('L100', 'CP. 11101.', '3 - Délit', 'Organisation de manifestation illégale dans un espace protégé', null, '$20,000', '15', false, false, null, 100, '{organisation,ordre_public,environnement}'),
  ('L101', 'CP. 11102.', '3 - Délit', 'Construction illégale dans un espace protégé', null, '$30,000', '30', false, false, null, 101, '{environnement}'),
  ('L102', 'CP. 11105.', '3 - Délit', 'Vente illégale d''une espèce protégée', null, '$20,000', '15', false, false, null, 102, '{environnement}'),
  ('L103', 'CP. 4106.', '4 - Crime', 'Acte de barbarie', null, '$80,000', '120', true, true, null, 103, '{violence}'),
  ('L104', 'CP. 4107.', '4 - Crime', 'Torture', null, '$80,000', '120', true, true, null, 104, '{violence}'),
  ('L105', 'CP. 4109.', '4 - Crime', 'Trafic d’organes', null, '$5,000', '15', false, false, null, 105, '{organisation}'),
  ('L106', 'CP. 4202.', '4 - Crime', 'Agression sexuelle', null, '$100,000', '120', true, true, null, 106, '{violence,sexuel}'),
  ('L107', 'CP. 4301.', '4 - Crime', 'Enlèvement et séquestration', null, '$30,000', '30', true, true, null, 107, '{violence}'),
  ('L108', 'CP. 4302.', '4 - Crime', 'Prise d’otage sans rançon', null, '$25,000', '30', true, true, 'Dans le cadre d''un braquage de Fleeca Bank, de Bijouterie, de Human Labs, de Train ou de Yacht, le Procureur n''est pas obligatoire si le détenu reconnaît les faits et accepte la peine nominale.', 108, '{vol,organisation,procedure}'),
  ('L109', 'CP. 4303.', '4 - Crime', 'Prise d’otage avec rançon', null, '$50,000', '60', true, true, null, 109, '{}'),
  ('L110', 'CP. 4502.', '4 - Crime', 'Homicide involontaire', null, '$30,000', '60', true, true, null, 110, '{homicide}'),
  ('L111', 'CP. 4504.', '4 - Crime', 'Tentative d''homicide', null, '$50,000', '60', true, true, null, 111, '{homicide}'),
  ('L112', 'CP. 5102.', '4 - Crime', 'Braquage (de conteneur, supérette, AmmuNation, magasin)', null, '$3,500', '20', false, false, null, 112, '{vol}'),
  ('L113', 'CP. 5102.', '4 - Crime', 'Braquage (de train)', null, '$60,000', '60', true, true, 'Le Procureur n''est pas obligatoire si le détenu reconnaît les faits et accepte la peine nominale.', 113, '{vol,organisation,procedure}'),
  ('L114', 'CP. 5102.', '4 - Crime', 'Braquage (de bijouterie, de yacht)', null, '$50,000', '60', true, true, 'Le Procureur n''est pas obligatoire si le détenu reconnaît les faits et accepte la peine nominale.', 114, '{vol,organisation,procedure}'),
  ('L115', 'CP. 5102.', '4 - Crime', 'Braquage (de Human Labs, entreprise patronale)', null, '$50,000', '60', true, true, 'Pour le braquage de Human Labs uniquement, le Procureur n''est pas obligatoire si le détenu reconnaît les faits et accepte la peine nominale.', 115, '{vol,organisation,procedure}'),
  ('L116', 'CP. 5102.', '4 - Crime', 'Braquage (de Fleeca Bank, convoi des services publics)', null, '$100,000', '60', true, true, 'Pour le braquage de Fleeca Bank uniquement, le Procureur n''est pas obligatoire si le détenu reconnaît les faits et accepte la peine nominale.', 116, '{vol,organisation,procedure}'),
  ('L117', 'CP. 5102.', '4 - Crime', 'Braquage (de Pacific Bank, Central Bank)', null, '$150,000', '120', false, true, 'Tribunal', 117, '{vol,procedure}'),
  ('L118', 'CP. 7106.', '4 - Crime', 'Evasion', null, '$100,000', '120', true, true, null, 118, '{}'),
  ('L119', 'CP. 7202.', '4 - Crime', 'Faux ou usage de faux', null, '$30,000', '30', true, true, null, 119, '{fraude}'),
  ('L120', 'CP. 7203.', '4 - Crime', 'Parjure', null, '$50,000', '60', true, true, null, 120, '{corruption}'),
  ('L121', 'CP. 7204.', '4 - Crime', 'Conspiration', null, '$100,000', '60', true, true, null, 121, '{organisation}'),
  ('L122', 'CP. 7301.', '4 - Crime', 'Usurpation d''identité ou de fonction', null, '$100,000', '60', true, true, null, 122, '{fraude}'),
  ('L123', 'CP. 7303.', '4 - Crime', 'Corruption', null, '$25,000', '30', true, true, null, 123, '{corruption}'),
  ('L124', 'CP. 7304.', '4 - Crime', 'Fraude électorale', null, '$50,000', '30', true, true, null, 124, '{fraude}'),
  ('L125', 'CP.7306', '4 - Crime', 'Outrage à magistrat', null, '$10,000', '15', true, false, null, 125, '{corruption}'),
  ('L126', 'CP. 8105.', '4 - Crime', 'Trafic de produit stupéfiant', null, '$30,000', '30', true, true, null, 126, '{drogue,organisation}'),
  ('L127', 'CP. 9104.', '4 - Crime', 'Evasion fiscale', null, '$100,000', '60', true, true, null, 127, '{fraude}'),
  ('L128', 'CP. 9202.', '4 - Crime', 'Abus de biens sociaux', null, '$50,000', '30', true, true, null, 128, '{fraude}'),
  ('L129', 'CP. 9203.', '4 - Crime', 'Détournement de fonds', null, 'Somme + 10%', '60', true, true, null, 129, '{fraude}'),
  ('L130', 'CP. 11106.', '4 - Crime', 'Trafic d''espèce protégée', null, '$100,000', '60', true, true, null, 130, '{organisation,environnement}'),
  ('L131', 'CP.4204.', '5 - Crime majeur', 'Proxénétisme Applicable uniquement sur Los Santos.', null, '$150,000', '120', false, true, 'Tribunal', 131, '{sexuel,procedure}'),
  ('L132', 'CP. 4203.', '5 - Crime majeur', 'Viol', null, '$150,000', '120', false, true, 'Tribunal', 132, '{sexuel,procedure}'),
  ('L133', 'CP. 4501.', '5 - Crime majeur', 'Homicide', null, '$150,000', '120', false, true, 'Tribunal', 133, '{homicide,procedure}'),
  ('L134', 'CP. 4503.', '5 - Crime majeur', 'Assassinat', null, '$200,000', '120', false, true, 'Tribunal', 134, '{homicide,procedure}'),
  ('L135', 'CP. 6105.', '5 - Crime majeur', 'Trafic d''armes', null, '$100,000', '90', false, true, 'Tribunal', 135, '{armes,organisation,procedure}'),
  ('L136', 'CP. 7305.', '5 - Crime majeur', 'Acte de terrorisme', null, '$250,000', '90', false, true, 'Tribunal', 136, '{procedure}'),
  ('L137', 'CP. 9105.', '5 - Crime majeur', 'Blanchiment de capitaux', null, 'Somme + 10%', '90', false, true, 'Tribunal', 137, '{fraude,procedure}'),
  ('L138', 'CP. 11107.', '5 - Crime majeur', 'Ecocide', null, '$175,000', '90', false, true, 'Tribunal', 138, '{procedure,environnement}');
