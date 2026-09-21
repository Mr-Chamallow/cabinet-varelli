export interface Infraction {
  id: string;
  categorieId: number;
  categorieNom: 'Contravention' | 'Délit mineur' | 'Délit majeur' | 'Crime' | 'Délit routier';
  titre: string;
  amendeDeBase: number;
  peineDeBaseMin: number; // Temps de détention en minutes
  description: string;
  coefficientType: 'Global' | 'Cible';
}

export interface CategorieInfraction {
  id: number;
  nom: string;
}

export const CATEGORIES_INFRACTIONS: CategorieInfraction[] = [
  { id: 1, nom: 'Contravention' },
  { id: 2, nom: 'Délit mineur' },
  { id: 3, nom: 'Délit majeur' },
  { id: 4, nom: 'Crime' },
  { id: 5, nom: 'Délit routier' },
];

export const CODE_PENAL: Infraction[] = [
  // ==========================================
  // CONTRAVENTIONS (LIVRE II - CODE PÉNAL)
  // ==========================================
  {
    id: 'CP-C-01',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Stationnement d\'un bateau sur la côte hors d\'un port',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Stationner un bateau sur une côte dépourvue de port. Entraîne la mise en fourrière du bateau.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-02',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Atterrissage d\'un avion ou hélicoptère sur un site inapproprié',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Atterrir avec un appareil aérien sur un site non autorisé. Entraîne la mise en fourrière de l\'appareil.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-03',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Survol d\'un avion ou hélicoptère sur un site inapproprié',
    amendeDeBase: 135,
    peineDeBaseMin: 0,
    description: 'Survoler un site non autorisé en avion ou en hélicoptère.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-04',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Atteinte à la pudeur',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Se déplacer nu ou en sous-vêtements dans un lieu public ou accessible au public.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-05',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Conduite dangerous en véhicule (aérien, maritime, terrestre)',
    amendeDeBase: 2700,
    peineDeBaseMin: 0,
    description: 'Comportement imprudent ou irresponsable risquant de compromettre la sécurité ou de causer des dommages.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-06',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Dissimulation du visage',
    amendeDeBase: 540,
    peineDeBaseMin: 0,
    description: 'Port de tout objet ou masque rendant difficile l\'identification dans un lieu public.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-07',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Excès de vitesse (contrôle radar)',
    amendeDeBase: 1800,
    peineDeBaseMin: 0,
    description: 'Excès de vitesse détecté par un contrôle radar.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-08',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Grand excès de vitesse (>50km/h)',
    amendeDeBase: 3000,
    peineDeBaseMin: 0,
    description: 'Dépassement de plus de 50 km/h de la limite autorisée. Entraîne un retrait de permis.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-09',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Holster interdit',
    amendeDeBase: 1350,
    peineDeBaseMin: 0,
    description: 'Possession d\'un holster interdit. L\'accessoire peut être saisi par la police.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-10',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Insulte envers un civil',
    amendeDeBase: 270,
    peineDeBaseMin: 0,
    description: 'Expression outrageante adressée à un civil, utilisant des termes de mépris ou d\'invectives.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-11',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Ivresse ou consommation de stupéfiants sur la voie publique',
    amendeDeBase: 270,
    peineDeBaseMin: 0,
    description: 'État d\'ivresse manifeste ou consommation de stupéfiants sur la voie publique.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-12',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Mendicité en lieu public',
    amendeDeBase: 1350,
    peineDeBaseMin: 0,
    description: 'Demander de l\'argent aux passants dans un lieu public.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-13',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Non présentation des papiers d\'identité',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Refus ou incapacité de présenter ses pièces d\'identité sur demande d\'un dépositaire de l\'autorité.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-14',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Participation à une manifestation illégale',
    amendeDeBase: 135,
    peineDeBaseMin: 0,
    description: 'Participation à un rassemblement non autorisé par les autorités publiques.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-15',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Stationnement gênant',
    amendeDeBase: 270,
    peineDeBaseMin: 0,
    description: 'Stationnement sur un emplacement gênant ou interdit. Véhicule mis en fourrière si propriétaire absent.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-16',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Tapage nocturne',
    amendeDeBase: 360,
    peineDeBaseMin: 0,
    description: 'Emission de nuisances sonores excessives durant la nuit.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-17',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Usage abusif du Klaxon',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Utilisation abusive du klaxon hors d\'un cadre de danger immédiat.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-18',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Consommation de drogue',
    amendeDeBase: 450,
    peineDeBaseMin: 0,
    description: 'Consommation de substances classifiées comme stupéfiants. Saisie immédiate des produits.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-19',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Faux appels (canulars)',
    amendeDeBase: 405,
    peineDeBaseMin: 0,
    description: 'Appels malveillants ou canulars téléphoniques intentionnels.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-20',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Possession ou flagrant délit de crochetage',
    amendeDeBase: 225,
    peineDeBaseMin: 0,
    description: 'Possession d\'outils de crochetage ou tentative d\'utilisation sur un verrou/véhicule. Saisie du matériel.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-21',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Conduite en contresens',
    amendeDeBase: 2700,
    peineDeBaseMin: 0,
    description: 'Circuler à contresens ou de manière prolongée sur la voie opposée.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-22',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Dégradations de biens publics/privés/matériels',
    amendeDeBase: 1100,
    peineDeBaseMin: 0,
    description: 'Atteinte volontaire ou involontaire à l\'état d\'un bien public ou privé.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-C-23',
    categorieId: 1,
    categorieNom: 'Contravention',
    titre: 'Véhicule non-homologué pour Cayo',
    amendeDeBase: 1200,
    peineDeBaseMin: 0,
    description: 'Circulation sur Cayo Perico avec un véhicule non répertorié. Entraîne l\'immobilisation du véhicule.',
    coefficientType: 'Global'
  },

  // ==========================================
  // DÉLITS MINEURS (LIVRE III - CODE PÉNAL)
  // ==========================================
  {
    id: 'CP-DM-01',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Agression sur citoyen / Maltraitance animale',
    amendeDeBase: 4500,
    peineDeBaseMin: 30,
    description: 'Agression physique sans risque de mort ou actes de cruauté / mauvais traitements envers un animal.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-02',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de poissons illégaux',
    amendeDeBase: 900,
    peineDeBaseMin: 10,
    description: 'Possession de requins, tortues, dauphins, piranhas ou espadons (amende multipliée par le nombre d\'unités). Saisie des animaux. Non applicable sur Cayo.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-03',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Outrage envers un représentant de l\'état / magistrat',
    amendeDeBase: 2500,
    peineDeBaseMin: 0,
    description: 'Injures ou irrespect caractérisé envers un agent ou un magistrat dans l\'exercice de ses fonctions. Amendes cumulables.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-04',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Appel abusif des services publics',
    amendeDeBase: 1800,
    peineDeBaseMin: 15,
    description: 'Sollicitation injustifiée ou répétée des services d\'urgence (police, EMS, pompiers).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-05',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Braconnage - Chasse',
    amendeDeBase: 1350,
    peineDeBaseMin: 10,
    description: 'Chasse illégale d\'espèces protégées ou non-respect de la réglementation. Retrait du permis de chasse.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-06',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Braquage de supérette / LTD',
    amendeDeBase: 2250,
    peineDeBaseMin: 20,
    description: 'Vol sous la menace d\'une arme dans un commerce de proximité. Saisie de l\'argent liquide.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DM-07',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Braquage d\'ATM / Piratage d\'ATM',
    amendeDeBase: 2250,
    peineDeBaseMin: 15,
    description: 'Piratage ou attaque physique d\'un distributeur de billets. Saisie de l\'argent liquide.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DM-08',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Cambriolage',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Introduction par effraction dans une résidence privée pour y dérober des biens. Saisie des objets volés.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-09',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Conduite sans permis',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Conduite d\'un véhicule motorisé sans détenir le permis requis. Mise en fourrière du véhicule.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-10',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Conduite d\'un véhicule volé',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Utilisation d\'un véhicule déclaré volé. Peut être cumulé avec le recel de véhicule.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-11',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Course de rue illégale',
    amendeDeBase: 1350,
    peineDeBaseMin: 10,
    description: 'Organisation ou participation à des courses automobiles clandestines. Véhicules envoyés en fourrière.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-12',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Délit de fuite',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Fuite après avoir causé ou été impliqué dans un accident provoquant des dommages matériels ou physiques.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-13',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Entrave à une opération / enquête',
    amendeDeBase: 3500,
    peineDeBaseMin: 30,
    description: 'Gêner l\'action des forces de l\'ordre en intervention ou fournir des fausses déclarations pour faire échouer une enquête.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-14',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Entrave aux espaces aériens',
    amendeDeBase: 900,
    peineDeBaseMin: 10,
    description: 'Stationnement aérien gênant la circulation. Confiscation de l\'engin et retrait du permis aérien.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-15',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Exhibition d\'armes de poing',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Brandir ou porter de manière ostensible un pistolet. Implique la charge de possession d\'arme.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-16',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Exhibition d\'armes lourdes / automatiques',
    amendeDeBase: 4500,
    peineDeBaseMin: 30,
    description: 'Brandir une arme automatique ou lourde. Implique automatiquement la charge de possession d\'arme.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-17',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Go Fast',
    amendeDeBase: 2250,
    peineDeBaseMin: 20,
    description: 'Transport rapide de marchandises illégales visant à échapper aux contrôles de police. Fourrière automatique.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-18',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Utilisation illégale de drone en zone réglementée',
    amendeDeBase: 12000,
    peineDeBaseMin: 20,
    description: 'Survol en drone de sites protégés (police, hôpitaux, bases militaires, gouvernement). Confiscation du matériel.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-19',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Organisateur d\'une manifestation illégale',
    amendeDeBase: 4100,
    peineDeBaseMin: 15,
    description: 'Planification d\'un rassemblement public sans autorisation préalable.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-20',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Utilisation d\'une arme à feu',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Test de résidus de poudre positif sans victime directe ni blessé identifié.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-21',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Intrusion dans une zone à accès restreint',
    amendeDeBase: 3200,
    peineDeBaseMin: 30,
    description: 'Pénétration non autorisée dans un périmètre sécurisé ou protégé.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-22',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Menace et/ou intimidation envers un civil',
    amendeDeBase: 3500,
    peineDeBaseMin: 15,
    description: 'Intention manifeste de nuire ou pression psychologique/physique exercée sur un citoyen.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-23',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Mise en danger de la vie d\'autrui',
    amendeDeBase: 5800,
    peineDeBaseMin: 15,
    description: 'Violation délibérée d\'une règle de sécurité créant un risque immédiat de mort ou de blessure grave.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-24',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non assistance à personne en danger',
    amendeDeBase: 4050,
    peineDeBaseMin: 20,
    description: 'Refus ou omission délibérée d\'aider une personne en détresse physique évidente.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-25',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non dénonciation d\'un acte illégal',
    amendeDeBase: 2700,
    peineDeBaseMin: 15,
    description: 'Omettre sciemment de signaler la préparation ou la commission d\'un crime aux autorités.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-26',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non présentation à une convocation de police',
    amendeDeBase: 6750,
    peineDeBaseMin: 20,
    description: 'Absence injustifiée suite à une convocation officielle orale ou écrite délivrée par un agent.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-27',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect de l\'assignation géographique',
    amendeDeBase: 18000,
    peineDeBaseMin: 10,
    description: 'Franchir les limites d\'un périmètre imposé par une décision de justice.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-28',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect du code du travail',
    amendeDeBase: 7200,
    peineDeBaseMin: 10,
    description: 'Non-conformité de la direction aux règles encadrant le droit du travail. Sanction pénale d\'entreprise.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-29',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect du contrôle judiciaire',
    amendeDeBase: 2700,
    peineDeBaseMin: 10,
    description: 'Violation des obligations de sûreté ordonnées par un magistrat dans l\'attente d\'un jugement.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-30',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Pêche illégale (Espèce protégée)',
    amendeDeBase: 3600,
    peineDeBaseMin: 10,
    description: 'Pêche en zone protégée ou avec des appâts prohibés. Saisie du matériel et des captures.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-31',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'espèce protégée (viande/poisson)',
    amendeDeBase: 18,
    peineDeBaseMin: 10,
    description: 'Détention de faune protégée (18$ par unité détenue). Saisie de la marchandise.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-32',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'appât illégal',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention d\'appâts destinés à la capture d\'espèces protégées (45$ par unité). Saisie. Non applicable sur Cayo.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-33',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîtier de piratage / Darknet',
    amendeDeBase: 1000,
    peineDeBaseMin: 10,
    description: 'Détention d\'outils informatiques de piratage. Saisie du matériel.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-34',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de canon d\'arme',
    amendeDeBase: 1500,
    peineDeBaseMin: 10,
    description: 'Détention de pièces détachées d\'armes à feu (pompe, assaut, glock, etc.). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-35',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de carte Fleeca / Banque',
    amendeDeBase: 2700,
    peineDeBaseMin: 25,
    description: 'Détention d\'outils d\'accès aux cartes bancaires sécurisées. Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-36',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Port d\'arme de chasse non réglementaire',
    amendeDeBase: 1350,
    peineDeBaseMin: 10,
    description: 'Port d\'arme de chasse sans permis valide ou en dehors d\'une zone de chasse officielle. Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-37',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Utilisation illégale d\'une arme légale',
    amendeDeBase: 1500,
    peineDeBaseMin: 10,
    description: 'Usage d\'une arme autorisée dans le cadre d\'une activité criminelle.',
    coefficientType: 'Global'
  },

  // POSSESSIONS D'ARMES BLANCHES & PISTOLETS (DÉLITS MINEURS)
  {
    id: 'CP-DM-38',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Machette',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention illégale d\'une machette. Confiscation automatique.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-39',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Fourchette tordue',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention d\'arme blanche artisanale improvisée. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-40',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Couteau artisanal',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention d\'un couteau de fabrication artisanale. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-41',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Tesson de bouteille',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Port d\'un débris de verre tranchant comme arme. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-42',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Hache',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention d\'une hache sans cadre professionnel. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-43',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Hache de guerre',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention d\'une arme tranchante de combat. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-44',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Dague antique',
    amendeDeBase: 2000,
    peineDeBaseMin: 15,
    description: 'Détention illégale d\'une dague. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-45',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet 17',
    amendeDeBase: 15000,
    peineDeBaseMin: 10,
    description: 'Détention illégale d\'un pistolet 17. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-46',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet compact',
    amendeDeBase: 15000,
    peineDeBaseMin: 10,
    description: 'Détention illégale d\'un pistolet compact. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-47',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un pistolet standard. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-48',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet MXP 45',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un MXP 45. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-49',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet calibre 50',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention d\'un arme de poing lourd calibre .50. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-50',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet MKII',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un Pistolet MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-51',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet Combat (Glock)',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un pistolet de combat. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-52',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet céramique',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention d\'un pistolet indétectable en céramique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-53',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet lourd',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention d\'un pistolet lourd. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-54',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Taser / Pistolet paralysant',
    amendeDeBase: 13500,
    peineDeBaseMin: 20,
    description: 'Possession non autorisée d\'un dispositif d\'impulsion électrique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-55',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet perforant',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention d\'un pistolet à munitions perforantes. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-56',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet SNS',
    amendeDeBase: 11700,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un pistolet ultra-compact SNS. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-57',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de SNS Pico',
    amendeDeBase: 11700,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un pétoire compact. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-58',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pétoire Event',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale de pétoire d\'événement. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-59',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Revolver lourd',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'un revolver de gros calibre. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-60',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Revolver lourd MKII',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention d\'un revolver lourd modernisé MK2. Confiscation.',
    coefficientType: 'Global'
  },

  // MUNITIONS & BOÎTES DE MUNITIONS (DÉLITS MINEURS)
  {
    id: 'CP-DM-61',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de munitions de pistolet',
    amendeDeBase: 18,
    peineDeBaseMin: 10,
    description: 'Détention de balles de 9mm / pistolet (18$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-62',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de munitions de SMG',
    amendeDeBase: 23,
    peineDeBaseMin: 10,
    description: 'Détention de munitions pour mitraillette (23$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-63',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de munitions de fusil à pompe',
    amendeDeBase: 27,
    peineDeBaseMin: 10,
    description: 'Détention de cartouches de fusil à pompe (27$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-64',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de munitions de fusil d\'assaut',
    amendeDeBase: 32,
    peineDeBaseMin: 10,
    description: 'Détention de balles d\'assaut 5.56 / 7.62 (32$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-65',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de munitions de machine gun',
    amendeDeBase: 36,
    peineDeBaseMin: 10,
    description: 'Détention de munitions pour mitrailleuse lourde (36$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-66',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîte de munitions de pistolet',
    amendeDeBase: 180,
    peineDeBaseMin: 10,
    description: 'Détention de boîtes scellées de 9mm (180$ par boîte). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-67',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîte de munitions de SMG',
    amendeDeBase: 230,
    peineDeBaseMin: 10,
    description: 'Détention de boîtes de munitions SMG (230$ par boîte). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-68',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîte de munitions de fusil à pompe',
    amendeDeBase: 270,
    peineDeBaseMin: 10,
    description: 'Détention de boîtes de cartouches (270$ par boîte). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-69',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîte de munitions de fusil d\'assaut',
    amendeDeBase: 320,
    peineDeBaseMin: 10,
    description: 'Détention de boîtes de munitions d\'assaut (320$ par boîte). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-70',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession boîte de munitions de machine gun',
    amendeDeBase: 360,
    peineDeBaseMin: 10,
    description: 'Détention de boîtes de munitions lourdes (360$ par boîte). Saisie.',
    coefficientType: 'Global'
  },

  // DROGUES, COMPOSANTS & MATÉRIEL ILLÉGAL (DÉLITS MINEURS)
  {
    id: 'CP-DM-71',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de graine de strawberry',
    amendeDeBase: 30,
    peineDeBaseMin: 10,
    description: 'Détention de graines illégales de culture (30$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-72',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de fertilisant',
    amendeDeBase: 1,
    peineDeBaseMin: 10,
    description: 'Détention d\'engrais destine aux cultures illégales (1$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-73',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de kit de fabrication de meth',
    amendeDeBase: 5000,
    peineDeBaseMin: 10,
    description: 'Détention de matériel chimique de synthèse (5000$ par kit). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-74',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de gaz BZ',
    amendeDeBase: 250,
    peineDeBaseMin: 10,
    description: 'Détention de composés chimiques incapacitants (250$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-75',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de poudre à canon',
    amendeDeBase: 2,
    peineDeBaseMin: 10,
    description: 'Détention de composants explosifs de base (2$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-76',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de B-Magic',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de substances hallucinogènes de synthèse (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-77',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de H-47',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de produits de synthèse contrôlés (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-78',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de cannabis',
    amendeDeBase: 32,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de cannabis (32$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-79',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de cocaïne',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de cocaïne (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-80',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de crack',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de crack (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-81',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'ecstasy',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de comprimés ou pochons d\'ecstasy (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-82',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'opium',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention d\'opium brut ou raffiné (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-83',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de tranq',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de seringues ou doses de tranquillisant puissant (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-84',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'héroïne',
    amendeDeBase: 72,
    peineDeBaseMin: 10,
    description: 'Détention d\'héroïne (72$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-85',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de purple haze',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de cannabis haut de gamme (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-86',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'acide sulfurique',
    amendeDeBase: 41,
    peineDeBaseMin: 10,
    description: 'Détention de précurseurs chimiques acides (41$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-87',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de feuilles de salvia',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de matière végétale psychotrope (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-88',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de branche de cannabis',
    amendeDeBase: 15,
    peineDeBaseMin: 10,
    description: 'Détention de parties végétales brutes de cannabis (15$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-89',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'encodeur',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de matériel électronique de clonage (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-90',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de méthamphétamine',
    amendeDeBase: 72,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de méthamphétamine (72$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-91',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de pavot',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de graines ou têtes de pavot (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-92',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de feuilles de coca',
    amendeDeBase: 41,
    peineDeBaseMin: 10,
    description: 'Détention de feuilles végétales brutes de coca (41$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-93',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de phosphore rouge',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de réactifs chimiques réglementés (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-94',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de pseudoéphédrine',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de précurseurs pharmaceutiques contrôlés (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-95',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'ammoniaque anhydre',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de produits chimiques dangereux (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-96',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'éther',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de solvants réactifs (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-97',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de lithium',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de composants de synthèse (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-98',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de meth bleue',
    amendeDeBase: 72,
    peineDeBaseMin: 10,
    description: 'Détention de méthamphétamine haute pureté (72$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-99',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de prométhazine',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de sirop ou comprimés de prométhazine (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-100',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de fentanyl',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention d\'opioïdes de synthèse surpuissants (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-101',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de xylazine',
    amendeDeBase: 41,
    peineDeBaseMin: 10,
    description: 'Détention d\'adjuvants sédatifs (41$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-102',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de belladone',
    amendeDeBase: 41,
    peineDeBaseMin: 10,
    description: 'Détention de plantes toxiques ou alcaloïdes (41$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-103',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de morphine',
    amendeDeBase: 41,
    peineDeBaseMin: 10,
    description: 'Détention d\'opiaces d\'usage médical sans ordonnance (41$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-104',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de datura',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de végétaux hallucinogènes dangereux (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-105',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de salvia',
    amendeDeBase: 25,
    peineDeBaseMin: 10,
    description: 'Détention de plants de salvia divinorum (25$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-106',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de mexicana',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de champignons hallucinogènes mexicana (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-107',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de blacktrip',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de pochons hallucinogènes (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-108',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de spore X',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de matériel fongique hallucinogène (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-109',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de oyster rouge',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de champignons psychotropes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-110',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de oyster bleu',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de champignons psychotropes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-111',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de amanita rouge',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention d\'amanites tue-mouches / psychotropes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-112',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de amanita vert',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention d\'amanites toxiques/psychotropes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-113',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de psilocybe vert',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de champignons hallucinogènes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-114',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de moisissures spectrales',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de cultures hallucinogènes brutes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-115',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de spores de veloceps',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de précurseurs fongiques (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-116',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de carte prépayée',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détention de cartes de crédit prépayées anonymes (45$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-117',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de psilocybe rouge',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de psilocybes hallucinogènes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-118',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de psilocybe violet',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de psilocybes hallucinogènes (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-119',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de red fang',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de pochons de stupéfiants synthétiques (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-120',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de lean',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention de mélanges codéinés / lean (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-121',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'acide acétylsalicylique',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention non déclarée de composés chimiques (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-122',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de ma-huang',
    amendeDeBase: 20,
    peineDeBaseMin: 10,
    description: 'Détention de branches de plantes à éphédrine (20$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-123',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de ladanum',
    amendeDeBase: 90,
    peineDeBaseMin: 10,
    description: 'Détention d\'échantillons de résine d\'opium (90$ par unité). Saisie.',
    coefficientType: 'Global'
  },

  // PROCÉDURES, FRAUDES & INFRACTIONS DIVERSES (DÉLITS MINEURS)
  {
    id: 'CP-DM-124',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vente de drogue ou assimilé',
    amendeDeBase: 3750,
    peineDeBaseMin: 10,
    description: 'Echange de drogue de la main à la main (<75 unités). Saisie intégrale du cash et des stupéfiants.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-125',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Recel de véhicule volé',
    amendeDeBase: 2025,
    peineDeBaseMin: 10,
    description: 'Dissimulation ou détention d\'un véhicule d\'origine frauduleuse.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-126',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Recel de vol (objets + armes légales)',
    amendeDeBase: 50,
    peineDeBaseMin: 10,
    description: 'Conservation ou transfert d\'objets ou d\'armes légitimes volés (50$ par objet). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-127',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Refus d\'obtempérer',
    amendeDeBase: 900,
    peineDeBaseMin: 15,
    description: 'Refus explicite de se soumettre aux sommations d\'arrêt d\'un agent public.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-128',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Refus de comparaître',
    amendeDeBase: 1800,
    peineDeBaseMin: 30,
    description: 'Absence non justifiée lors d\'une convocation judiciaire ou citation à comparaître.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-129',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Refus de se soumettre à une injonction',
    amendeDeBase: 1080,
    peineDeBaseMin: 60,
    description: 'Inexécution délibérée d\'une ordonnance écrite rendue par un magistrat.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-130',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Trafic de stupéfiant ou assimilé',
    amendeDeBase: 0,
    peineDeBaseMin: 30,
    description: 'Production, distribution ou transport de drogues (caractérisé dès 75 unités). Non cumulable avec la vente.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-131',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Troubles à l\'ordre public',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Atteinte délibérée à la tranquillité publique ou refus de se disperser lors d\'un attroupement.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-132',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Violation de propriété privée',
    amendeDeBase: 1800,
    peineDeBaseMin: 15,
    description: 'Pénétration non autorisée sur un domaine privé, résidence ou entreprise.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-133',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vol',
    amendeDeBase: 1350,
    peineDeBaseMin: 15,
    description: 'Soustraction frauduleuse du bien d\'autrui. Restitution des biens.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-134',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vol d\'équipements d\'entreprise',
    amendeDeBase: 450,
    peineDeBaseMin: 10,
    description: 'Vol de matériel d\'exploitation d\'une société (450$ par objet). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-135',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession d\'un disjoncteur modifié',
    amendeDeBase: 2500,
    peineDeBaseMin: 10,
    description: 'Détention d\'outils de sabotage électrique (2500$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-136',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vol de produits d\'entreprise',
    amendeDeBase: 45,
    peineDeBaseMin: 10,
    description: 'Détournement ou vol des marchandises produites par une société (45$ par unité).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-137',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vol de véhicule',
    amendeDeBase: 2000,
    peineDeBaseMin: 10,
    description: 'Soustraction frauduleuse d\'un véhicule automobile.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-138',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Vente d\'objets illégaux',
    amendeDeBase: 5500,
    peineDeBaseMin: 20,
    description: 'Transaction portant sur du matériel destiné à des activités criminelles.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-139',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect des licences et des papiers officiels',
    amendeDeBase: 10000,
    peineDeBaseMin: 30,
    description: 'Non-conformité des autorisations réglementaires ou licences professionnelles.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-140',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Utilisation illégale de menottes / serflex',
    amendeDeBase: 120,
    peineDeBaseMin: 5,
    description: 'Entrave de la liberté de mouvement d\'un individu sans habilitation légale. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-141',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession ou utilisation de fausse plaque d\'immatriculation',
    amendeDeBase: 120,
    peineDeBaseMin: 5,
    description: 'Usage ou détention de plaques falsifiées ou modifiées (120$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-142',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect du code de commerce',
    amendeDeBase: 7200,
    peineDeBaseMin: 10,
    description: 'Manquements aux obligations commerciales fixées par la réglementation de l\'État.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-143',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Revente à perte',
    amendeDeBase: 5000,
    peineDeBaseMin: 10,
    description: 'Vente délibérée de produits ou services sous leur coût de production.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-144',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Évasion du poste de police',
    amendeDeBase: 7500,
    peineDeBaseMin: 20,
    description: 'Fuite du commissariat après la lecture des droits Miranda.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-145',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Non respect des consignes de l\'État d\'Urgence',
    amendeDeBase: 4500,
    peineDeBaseMin: 30,
    description: 'Non-respect des décrets sanitaires, sécuritaires ou de couvre-feu en DEFCON/État d\'urgence.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DM-146',
    categorieId: 2,
    categorieNom: 'Délit mineur',
    titre: 'Possession de Pistolet Artisanal',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Détention illégale d\'une arme de poing de fabrication artisanale. Confiscation.',
    coefficientType: 'Global'
  },

  // ==========================================
  // DÉLITS MAJEURS (LIVRE IV - CODE PÉNAL)
  // ==========================================
  {
    id: 'CP-DMAJ-01',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Abus de confiance',
    amendeDeBase: 12500,
    peineDeBaseMin: 20,
    description: 'Détournement de fonds ou de biens remis volontairement sous contrat ou accord préalable.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-02',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage de société',
    amendeDeBase: 44000,
    peineDeBaseMin: 20,
    description: 'Vol qualifié avec armes ciblant une entreprise. Saisie des armes et du cash. Présence d\'un juge requise.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-03',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Plagiat',
    amendeDeBase: 17500,
    peineDeBaseMin: 30,
    description: 'Copie ou appropriation du travail intellectuel d\'autrui sans accord.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-04',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Contrefaçon',
    amendeDeBase: 15000,
    peineDeBaseMin: 25,
    description: 'Reproduction ou vente illégale de produits sous marque ou brevet protégé.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-05',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Attaque convoi de fonds (Brinks / Convoi SAMP)',
    amendeDeBase: 8500,
    peineDeBaseMin: 45,
    description: 'Interception violente d\'un convoi sécurisé officiel. Saisie des armes, de l\'argent et des biens volés.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-06',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Sollicitation ou incitation à la prostitution',
    amendeDeBase: 9000,
    peineDeBaseMin: 60,
    description: 'Proxénétisme ou incitation au commerce sexuel hors du cadre de la loi.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-07',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Discrimination',
    amendeDeBase: 7200,
    peineDeBaseMin: 20,
    description: 'Traitement défavorable fondé sur l\'origine, le genre, la religion ou l\'orientation dans un cadre légal/emploi.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-08',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Chantage',
    amendeDeBase: 3150,
    peineDeBaseMin: 15,
    description: 'Extorsion d\'un consentement, d\'un bien ou d\'un service sous la menace de révélations ou de préjudice.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-09',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Agression sur agent (employé d\'état ou police)',
    amendeDeBase: 8500,
    peineDeBaseMin: 60,
    description: 'Violence physique exercée sur un agent en service sans mise en danger directe de sa vie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-10',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession d\'accessoires d\'armes',
    amendeDeBase: 2000,
    peineDeBaseMin: 10,
    description: 'Détention de viseurs, silencieux, poignées ou chargeurs modifiés (2000$ par unité). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-11',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Menaces de Mort et ou Menaces graves',
    amendeDeBase: 8500,
    peineDeBaseMin: 45,
    description: 'Menaces explicites d\'atteinte à la vie ou d\'actes de violence grave.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-12',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Harcèlement',
    amendeDeBase: 15000,
    peineDeBaseMin: 20,
    description: 'Propos ou agissements répétés ayant pour objet ou effet une dégradation des conditions de vie d\'une personne.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-13',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Homicide involontaire',
    amendeDeBase: 12500,
    peineDeBaseMin: 25,
    description: 'Inattention, imprudence ou négligence grave ayant entraîné la mort d\'autrui sans intention de la donner.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-14',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Bande Organisée',
    amendeDeBase: 2500,
    peineDeBaseMin: 30,
    description: 'Groupement d\'au moins 3 personnes agissant de manière coordonnée (radio, rôles distribués).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-15',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Port de kevlar / Gilet par balle',
    amendeDeBase: 5000,
    peineDeBaseMin: 15,
    description: 'Port non autorisé d\'une protection balistique sur soi. Implique la possession.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-16',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage d\'armurerie',
    amendeDeBase: 7200,
    peineDeBaseMin: 25,
    description: 'Vol armé dans un commerce d\'armes. Saisie de l\'argent liquide et des complices armés.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-17',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage à main armée bijouterie / supermarché',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Vol à main armée de la bijouterie Vangelico ou du supermarché de Roxwood. Saisie du cash.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-18',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage de banque centrale (Pacifique)',
    amendeDeBase: 25000,
    peineDeBaseMin: 60,
    description: 'Attaque qualifiée de la Banque Centrale. Saisie intégrale des fonds volés.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-19',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Participation à une transaction illégale (DOA)',
    amendeDeBase: 8000,
    peineDeBaseMin: 15,
    description: 'Chef spécifique aux agents de la DOA pour échange direct d\'armes, de drogue ou de matériel militaire.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-20',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage du Humane Labs',
    amendeDeBase: 18000,
    peineDeBaseMin: 60,
    description: 'Attaque armée des laboratoires Humane Labs. Saisie intégrale des objets/fonds.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-21',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage de banque (Fleeca / Pine Bank)',
    amendeDeBase: 15000,
    peineDeBaseMin: 25,
    description: 'Vol qualifié dans une agence bancaire locale. Saisie des fonds.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-22',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Achat d\'armes illégales',
    amendeDeBase: 12500,
    peineDeBaseMin: 30,
    description: 'Acquisition d\'armes non autorisées (amende de 12 500$ multipliée par le nombre d\'armes). Saisie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-23',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Divulgation d\'informations confidentielles',
    amendeDeBase: 2000,
    peineDeBaseMin: 30,
    description: 'Violation du secret professionnel ou fuite de données gouvernementales.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-24',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Diffamation',
    amendeDeBase: 3500,
    peineDeBaseMin: 15,
    description: 'Allégation ou imputation d\'un fait qui porte atteinte à l\'honneur d\'une personne.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-25',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Entreposage d\'armes illégales (≥3)',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Stockage d\'au moins 3 armes illégales dans une propriété/coffre (9000$ multiplié par le nombre d\'armes).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-26',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Escroquerie à l\'entreprise',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Tromperie orchestrée au nom ou au préjudice d\'une entreprise commercialement enregistrée.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-27',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Extorsion / Escroquerie',
    amendeDeBase: 8500,
    peineDeBaseMin: 30,
    description: 'Obtention par la contrainte physique/morale de fonds ou avantages. Saisie des biens.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-28',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Faux témoignage',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Déclaration mensongère délibérée orientant de façon erronée une enquête policière.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-29',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Intimidation / Chantage envers magistrat',
    amendeDeBase: 7500,
    peineDeBaseMin: 30,
    description: 'Pressions ou menaces visant un procureur ou un juge.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-30',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Menace et/ou intimidation envers un représentant de l\'état',
    amendeDeBase: 3500,
    peineDeBaseMin: 20,
    description: 'Intimidation verbale, écrite ou avec arme d\'un fonctionnaire ou membre du gouvernement.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-31',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Non respect d\'une décision de justice d\'un citoyen',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Refus par un citoyen d\'exécuter un jugement rendu par un tribunal.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-32',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Non respect d\'une décision de justice d\'une entreprise',
    amendeDeBase: 18000,
    peineDeBaseMin: 30,
    description: 'Inexécution d\'un jugement par le dirigeant représentant une personne morale.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-33',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Non respect des normes incendie (entreprise)',
    amendeDeBase: 18000,
    peineDeBaseMin: 0,
    description: 'Absence d\'équipements de sécurité ou de conformité aux normes anti-incendie d\'une entreprise.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-34',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Organisation d\'insolvabilité',
    amendeDeBase: 13500,
    peineDeBaseMin: 0,
    description: 'Dissimulation délibérée de ses actifs pour éviter l\'exécution d\'une condamnation financière.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-35',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Parjure',
    amendeDeBase: 5500,
    peineDeBaseMin: 30,
    description: 'Faux témoignage prêté sous serment devant un tribunal ou une autorité compétente.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-36',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Participation à une fusillade',
    amendeDeBase: 3500,
    peineDeBaseMin: 30,
    description: 'Implication active dans un échange de coups de feu avec des civils ou les forces de l\'ordre.',
    coefficientType: 'Global'
  },

  // POSSESSION D'ARMES AUTOMATIQUES & LOURDES (DÉLITS MAJEURS)
  {
    id: 'CP-DMAJ-37',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de ADP de combat',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un arme de défense personnelle automatique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-38',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de SMG',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention illégale d\'une mitraillette SMG. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-39',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de SMG MKII',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une mitraillette SMG MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-40',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de SMG d\'assaut',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet mitrailleur d\'assaut. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-41',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de mini-SMG',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une mitraillette ultra-compacte. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-42',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Phantom 10',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une mitraillette Phantom 10. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-43',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Pistolet mitrailleur',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet automatique rafaleur. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-44',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de MX Tactic',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un arme automatique tactique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-45',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Sulfateuse Gusenberg',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une mitrailleuse vintage Gusenberg. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-46',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Carabine',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une carabine d\'assaut. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-47',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Carabine MKII',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une carabine modernisée MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-48',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil tactique',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil tactique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-49',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Carabine spéciale',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une carabine spéciale. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-50',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Carabine spéciale MKII',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'une carabine spéciale MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-51',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil amélioré (TAR-21)',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut TAR-21. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-52',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil compact',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut compact. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-53',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de SMG-45',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet mitrailleur SMG-45. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-54',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil d\'assaut',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention illégale d\'un fusil d\'assaut AK. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-55',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de AR7',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut AR7. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-56',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de MK Priss',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil MK Priss. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-57',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Battle Rifle',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil de combat puissant. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-58',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil lourd',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut lourd. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-59',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil SBR-52',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil tactique SBR-52. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-60',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe Bullpup',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pompe compact Bullpup. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-61',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil d\'assaut Bullpup',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut Bullpup. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-62',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil d\'assaut Bullpup MKII',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un Bullpup MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-63',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil d\'assaut MKII',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut modernisé MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-64',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil militaire',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut de qualité militaire. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-65',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Mousquet',
    amendeDeBase: 15000,
    peineDeBaseMin: 25,
    description: 'Détention illégale d\'un mousquet d\'époque. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-66',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à canon scié (Sawed Off)',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe altéré à canon scié. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-67',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Striker 12',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe semi-auto Striker 12. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-68',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à double canon',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil de chasse à double canon. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-69',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe standard. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-70',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de SPAS 12',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe tactique SPAS-12. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-71',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe MKII',
    amendeDeBase: 30000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe MK2. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-72',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe d\'assaut',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe automatique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-73',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Pistolet automatique',
    amendeDeBase: 20000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet mitrailleur. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-74',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Vesper 9',
    amendeDeBase: 20000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet mitrailleur Vesper 9. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-75',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Vortex',
    amendeDeBase: 20000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet automatique Vortex. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-76',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe de combat',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe de combat. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-77',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil à pompe lourd',
    amendeDeBase: 25000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil à pompe lourd. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-78',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Tactical SMG',
    amendeDeBase: 22500,
    peineDeBaseMin: 25,
    description: 'Détention d\'un pistolet mitrailleur tactique. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-79',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil de combat',
    amendeDeBase: 35000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil d\'assaut de combat. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-80',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Fusil d\'élite',
    amendeDeBase: 40000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un fusil de précision / d\'élite. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-81',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Gilet pare-balles',
    amendeDeBase: 15000,
    peineDeBaseMin: 25,
    description: 'Détention d\'un gilet pare-balles sans autorisation. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-82',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession d\'argent liquide illégal ou >5000$ sans justificatif',
    amendeDeBase: 1,
    peineDeBaseMin: 10,
    description: 'Port de plus de 5000$ en liquide sans preuve écrite irréfutable (1$ d\'amende par dollar possédé). Saisie.',
    coefficientType: 'Global'
  },

  // INFRACTIONS GRAVES & TRAVAIL DISSIMULÉ (DÉLITS MAJEURS)
  {
    id: 'CP-DMAJ-83',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Prise d\'otage sur un civil',
    amendeDeBase: 4500,
    peineDeBaseMin: 15,
    description: 'Séquestration armée ou non d\'un citoyen en vue d\'obtenir des avantages.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-84',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Rapport de vol non enregistré',
    amendeDeBase: 9000,
    peineDeBaseMin: 10,
    description: 'Omission d\'enregistrement officiel d\'un procès-verbal de vol.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-85',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Recel de malfaiteurs',
    amendeDeBase: 1800,
    peineDeBaseMin: 30,
    description: 'Héberger ou fournir des moyens de fuite à des membres d\'un réseau criminel.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-86',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Témoignage ou fausse déclaration dans le but de réaliser un profit',
    amendeDeBase: 8500,
    peineDeBaseMin: 30,
    description: 'Falsification de faits à des fins d\'enrichissement personnel.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-87',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Acte / Trafic illégal sur Bleeter',
    amendeDeBase: 18000,
    peineDeBaseMin: 30,
    description: 'Utilisation d\'un réseau social public pour la promotion d\'activités ou trafics illicites.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-88',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Usage de faux',
    amendeDeBase: 2700,
    peineDeBaseMin: 30,
    description: 'Utilisation de documents officiels ou d\'identité falsifiés. Saisie des faux.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-89',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Abus de fonction',
    amendeDeBase: 7200,
    peineDeBaseMin: 30,
    description: 'Utiliser son statut professionnel pour servir des intérêts exclusivement personnels.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-90',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Usurpation (identité et/ou fonction)',
    amendeDeBase: 4600,
    peineDeBaseMin: 30,
    description: 'Se faire passer pour un tiers ou un agent dépositaire de l\'autorité.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-91',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Vol à main armée',
    amendeDeBase: 5000,
    peineDeBaseMin: 30,
    description: 'Vol commis sous la menace d\'une arme à feu sur un citoyen. Restitution.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-92',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de Cocktail Molotov',
    amendeDeBase: 15000,
    peineDeBaseMin: 30,
    description: 'Détention d\'engins incendiaires artisanaux. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-93',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de charge thermite / explosive',
    amendeDeBase: 15000,
    peineDeBaseMin: 30,
    description: 'Détention de matériel de découpe thermique ou d\'explosifs de perçage. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-94',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Possession de grenade lacrymogène',
    amendeDeBase: 15000,
    peineDeBaseMin: 30,
    description: 'Détention de grenades neutralisantes non autorisées. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-95',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Destruction / Dissimulation de preuve',
    amendeDeBase: 5500,
    peineDeBaseMin: 30,
    description: 'Altérer, cacher ou détruire du matériel d\'enquête ou l\'arme d\'un crime.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-96',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Travail dissimulé par dissimulation d\'activité',
    amendeDeBase: 58500,
    peineDeBaseMin: 60,
    description: 'Générer du chiffre d\'affaires non déclaré ou hors des statuts officiels. Saisie de la société.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-97',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Travail dissimulé par dissimulation d\'emploi salarié',
    amendeDeBase: 45000,
    peineDeBaseMin: 60,
    description: 'Emploi illégal d\'employés sans contrat ni déclarations fiscales. Saisie de la société.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-98',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Travail dissimulé',
    amendeDeBase: 45000,
    peineDeBaseMin: 60,
    description: 'Exercice général d\'une activité professionnelle rémunérée non déclarée.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-99',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Absence de documents légaux d\'une entreprise',
    amendeDeBase: 63000,
    peineDeBaseMin: 60,
    description: 'Défaut d\'autorisation d\'exploitation administrative ou de registres officiels.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-100',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Corruption',
    amendeDeBase: 22500,
    peineDeBaseMin: 30,
    description: "Offre ou acceptation d\'avantages illégitimes en échange d'un acte officiel.",
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-101',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Fraude fiscale',
    amendeDeBase: 90000,
    peineDeBaseMin: 30,
    description: 'Soustraction délibérée et illégale à l\'imposition sur le chiffre d\'affaires ou les revenus.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-102',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Incendie criminel',
    amendeDeBase: 20500,
    peineDeBaseMin: 30,
    description: 'Provoquer délibérément un incendie détruisant des biens immobiliers ou matériels.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-103',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Abus de pouvoir',
    amendeDeBase: 7500,
    peineDeBaseMin: 15,
    description: 'Usage abusif de son autorité hiérarchique ou position pour contraindre autrui.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-104',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Vente de biens immobilier abusive',
    amendeDeBase: 0,
    peineDeBaseMin: 0,
    description: 'Vente immobilière dépassant les barèmes légaux fixés. Amende égale au montant du dépassement.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-105',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Braquage organisé de grande envergure',
    amendeDeBase: 22500,
    peineDeBaseMin: 30,
    description: 'Vol de grande ampleur planifié par un groupe armé. Non cumulable avec les autres braquages.',
    coefficientType: 'Cible'
  },
  {
    id: 'CP-DMAJ-106',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Exploitation d\'une entreprise sans autorisation (2 semaines)',
    amendeDeBase: 100000,
    peineDeBaseMin: 0,
    description: 'Exploitation continue confirmée par la mairie pendant 2 semaines sans agrément.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-107',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Absence d\'autorisation d\'exploitation (1 mois)',
    amendeDeBase: 250000,
    peineDeBaseMin: 0,
    description: 'Défaut d\'autorisation d\'un mois. Convocation obligatoire de la gérance en justice.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-DMAJ-108',
    categorieId: 3,
    categorieNom: 'Délit majeur',
    titre: 'Attaque à l\'explosif',
    amendeDeBase: 7500,
    peineDeBaseMin: 30,
    description: 'Sabotage des réseaux ou infrastructures par engins explosifs.',
    coefficientType: 'Global'
  },

  // ==========================================
  // CRIMES (LIVRE V - CODE PÉNAL)
  // ==========================================
  {
    id: 'CP-CR-01',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Acte lié au terrorisme',
    amendeDeBase: 15000,
    peineDeBaseMin: 60,
    description: 'Financement, logistique ou soutien direct apporté à une entreprise terroriste.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-02',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Blanchiment',
    amendeDeBase: 5,
    peineDeBaseMin: 15,
    description: 'Dissimulation de l\'origine illégale d\'actifs financiers (amende de 5$ par dollar blanchi).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-03',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Possession / Utilisation de drone explosif',
    amendeDeBase: 150000,
    peineDeBaseMin: 60,
    description: 'Détention ou vol d\'engins aériens piégés. Confiscation et destruction immédiate.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-04',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Assassinat (MORT RP UNIQUEMENT)',
    amendeDeBase: 225000,
    peineDeBaseMin: 60,
    description: 'Homicide prémédité sur citoyen. Applicable uniquement si mort définitive du personnage (Wipe).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-05',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Assassinat sur représentant de l\'état (MORT RP UNIQUEMENT)',
    amendeDeBase: 225000,
    peineDeBaseMin: 60,
    description: 'Homicide prémédité d\'un agent public. Applicable uniquement en cas de mort définitive (Wipe).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-06',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Pratique illégale de la médecine',
    amendeDeBase: 9000,
    peineDeBaseMin: 30,
    description: 'Exercice d\'actes chirurgicaux ou médicaux sans diplôme ou hors protocole légal.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-07',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Vente illégale d\'armes',
    amendeDeBase: 12500,
    peineDeBaseMin: 30,
    description: 'Commerce clandestin d\'armes illégales ou fourniture en connaissance d\'un projet criminel. Saisie des fonds.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-08',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Meurtre (MORT RP UNIQUEMENT)',
    amendeDeBase: 100800,
    peineDeBaseMin: 60,
    description: 'Homicide volontaire non prémédité sur un civil. Requis uniquement si décès réel (Wipe).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-09',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Procurer frauduleusement un document d\'administration publique',
    amendeDeBase: 13500,
    peineDeBaseMin: 30,
    description: 'Création ou fourniture de faux passeports, fausses cartes d\'identité ou vrais-faux permis.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-10',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Atteinte à la sécurité intérieure',
    amendeDeBase: 12500,
    peineDeBaseMin: 30,
    description: 'Attaques d\'envergure déstabilisant les institutions sécuritaires et la population.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-11',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Cavale',
    amendeDeBase: 9000,
    peineDeBaseMin: 60,
    description: 'Fuite organisée et maintien hors d\'atteinte de la justice suite à une condamnation ferme.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-12',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Détournement de fonds',
    amendeDeBase: 18000,
    peineDeBaseMin: 30,
    description: 'Appropriation frauduleuse de capitaux publics ou privés gérés dans le cadre de ses fonctions.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-13',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Espionnage',
    amendeDeBase: 7000,
    peineDeBaseMin: 30,
    description: 'Collecte de renseignements stratégiques au profit d\'une puissance ou entité ennemie.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-14',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Évasion / Organisation d\'évasion (Prison ou convoi)',
    amendeDeBase: 13500,
    peineDeBaseMin: 30,
    description: 'S\'échapper d\'un centre pénitencier ou attaquer un convoi d\'extraction de détenus.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-15',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Meurtre sur représentant de l\'état (MORT RP UNIQUEMENT)',
    amendeDeBase: 300000,
    peineDeBaseMin: 30,
    description: 'Homicide d\'un agent public sans préméditation. Requis uniquement en cas de mort RP réelle.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-16',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Meurtre sur représentant de l\'état (COMA)',
    amendeDeBase: 30000,
    peineDeBaseMin: 30,
    description: 'Tir ou force létale plongeant un représentant de l\'État dans un état d\'inconscience (Coma réversible).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-17',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Meurtre (COMA)',
    amendeDeBase: 18000,
    peineDeBaseMin: 30,
    description: 'Agression entraînant le coma d\'un citoyen (avec réanimation possible par le personnel médical).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-18',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Participation à un acte visant à commettre un crime contre l\'état',
    amendeDeBase: 35500,
    peineDeBaseMin: 30,
    description: 'Aide active à une conspiration ciblant directement les intérêts suprêmes de l\'État.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-19',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Possession de Grenade',
    amendeDeBase: 135000,
    peineDeBaseMin: 30,
    description: 'Détention d\'engins explosifs à fragmentation. Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-20',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Possession de Bombe',
    amendeDeBase: 135000,
    peineDeBaseMin: 30,
    description: 'Détention de bombes collantes (C4/Sticky). Confiscation.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-21',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Prise d\'otage sur représentant de l\'état',
    amendeDeBase: 18000,
    peineDeBaseMin: 30,
    description: 'Séquestration d\'un agent public ou fonctionnaire. Peut bloquer le nettoyage de casier.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-22',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Séquestration',
    amendeDeBase: 15500,
    peineDeBaseMin: 30,
    description: 'Privation illégale de la liberté d\'aller et venir d\'une personne.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-23',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Terrorisme',
    amendeDeBase: 45000,
    peineDeBaseMin: 60,
    description: 'Actes de violence visant à répandre la terreur et troubler gravement l\'ordre. Saisie totale des biens.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-24',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Trafic d\'organe',
    amendeDeBase: 18000,
    peineDeBaseMin: 45,
    description: 'Commerce ou prélèvement illicite de membres, sang ou organes humains.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-25',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Trahison',
    amendeDeBase: 225000,
    peineDeBaseMin: 60,
    description: 'Désertion ou atteinte grave aux intérêts fondamentaux du pays par un dépositaire de l\'autorité.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-26',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Trafic d\'armes à grande échelle',
    amendeDeBase: 27000,
    peineDeBaseMin: 60,
    description: 'Organisation d\'un réseau de distribution d\'armes de guerre. Saisie complète de l\'arsenal.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-27',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Torture',
    amendeDeBase: 25000,
    peineDeBaseMin: 30,
    description: 'Traitements cruels et inhumains infligés délibérément (25 000$ d\'amende par personne affectée).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-28',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Violation d\'un ordre / décret gouvernemental',
    amendeDeBase: 40500,
    peineDeBaseMin: 60,
    description: 'Inobservation d\'un décret exécutif d\'exception spécifiant une qualification criminelle.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-29',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Atteintes aux intérêts fondamentaux de la nation',
    amendeDeBase: 30600,
    peineDeBaseMin: 60,
    description: 'Actes mettant en péril l\'intégrité territoriale, la souveraineté ou la population.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-30',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Atteintes aux institutions de la nation',
    amendeDeBase: 18000,
    peineDeBaseMin: 60,
    description: 'Actions visant à détruire ou paralyser le fonctionnement des organes publics.',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-31',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Violation du secret professionnel',
    amendeDeBase: 22500,
    peineDeBaseMin: 30,
    description: 'Révélation d\'informations confidentielles confiées sous le sceau de sa profession (avocat, médecin, etc.).',
    coefficientType: 'Global'
  },
  {
    id: 'CP-CR-32',
    categorieId: 4,
    categorieNom: 'Crime',
    titre: 'Association de malfaiteurs',
    amendeDeBase: 4500,
    peineDeBaseMin: 30,
    description: 'Groupement criminels préparatoire à la commission de crimes (min. 8 personnes). Applicable uniquement par magistrats.',
    coefficientType: 'Global'
  },

  // ==========================================
  // DÉLITS ROUTIERS (CODE DE LA ROUTE)
  // ==========================================
  {
    id: 'CR-Art-63',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Conduite malgré suspension de permis',
    amendeDeBase: 3500,
    peineDeBaseMin: 15,
    description: 'Conduire un véhicule alors que le permis de conduire fait l\'objet d\'une mesure de suspension administrative ou judiciaire.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-64',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Conduite malgré annulation du permis',
    amendeDeBase: 5000,
    peineDeBaseMin: 20,
    description: 'Conduire un véhicule alors que le titre a été annulé de façon définitive.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-65',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Usage de faux permis',
    amendeDeBase: 4500,
    peineDeBaseMin: 20,
    description: 'Présentation d\'un permis falsifié ou imité lors d\'un contrôle routier.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-79',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Refus d\'obtempérer au contrôle routier',
    amendeDeBase: 2500,
    peineDeBaseMin: 15,
    description: 'Refus délibéré de s\'arrêter suite à l\'injonction lumineuse ou sonore des forces de l\'ordre.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-95',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Installation ou usage illégal de gyrophare',
    amendeDeBase: 1500,
    peineDeBaseMin: 0,
    description: 'Installer ou faire fonctionner un dispositif lumineux réservé aux services d\'urgence.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-130',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Rodéo urbain',
    amendeDeBase: 500,
    peineDeBaseMin: 10,
    description: 'Manœuvres spectaculaires et dangereuses exécutées en groupe (minimum 5 personnes).',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-131',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Drift non autorisé sur la voie publique',
    amendeDeBase: 250,
    peineDeBaseMin: 0,
    description: 'Dérapages contrôlés exécutés volontairement sur les voies publiques.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-132',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Zigzag / Conduite dangereuse',
    amendeDeBase: 250,
    peineDeBaseMin: 0,
    description: 'Changements répétitifs et intempestifs de voie mettant en danger les usagers.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-134',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Obstruction volontaire de la circulation',
    amendeDeBase: 500,
    peineDeBaseMin: 0,
    description: 'Bloquer ou ralentir intentionnellement le trafic routier sans motif légitime.',
    coefficientType: 'Global'
  },
  {
    id: 'CR-Art-152',
    categorieId: 5,
    categorieNom: 'Délit routier',
    titre: 'Obstruction volontaire d\'intersection',
    amendeDeBase: 350,
    peineDeBaseMin: 0,
    description: 'S\'immobiliser au milieu d\'un carrefour et bloquer le passage des autres voies.',
    coefficientType: 'Global'
  }
];

/**
 * Fonction d'aide pour calculer l'amende et la détention selon le coefficient appliqué (ex: récidive, gang)
 */
export function calculerPeine(
  infraction: Infraction,
  coefficientMultiplier: number = 1.0
) {
  const amendeCalculee = Math.round(infraction.amendeDeBase * coefficientMultiplier);
  const peineTempsCalculee = Math.round(infraction.peineDeBaseMin * coefficientMultiplier);

  return {
    amende: amendeCalculee,
    tempsPrisonMin: peineTempsCalculee,
  };
}