"use client";

import { useState, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Categorie = "constitution" | "penal_contravention" | "penal_delit_mineur" | "penal_delit_majeur" | "penal_crime" | "procedure" | "civil" | "travail" | "commerce" | "miranda";

interface Article {
  id: string;
  categorie: Categorie;
  titre: string;
  contenu: string;
  amende?: string;
  detention?: string;
  tags?: string[];
}

// ─── DONNÉES ─────────────────────────────────────────────────────────────────
const ARTICLES: Article[] = [
  // CONSTITUTION
  { id: "CONST-1", categorie: "constitution", titre: "Libertés fondamentales", contenu: "Sont garanties sans restriction injustifiée : liberté d'expression, liberté d'opinion politique, liberté de presse, liberté de création.", tags: ["liberté", "expression"] },
  { id: "CONST-2", categorie: "constitution", titre: "Libertés d'association", contenu: "Tout citoyen peut créer ou rejoindre une organisation, créer un parti politique, créer une entreprise, former des syndicats ou groupes civils. Aucun citoyen ne peut être forcé à quitter une organisation sans motif légal.", tags: ["association", "organisation"] },
  { id: "CONST-3", categorie: "constitution", titre: "Libertés de circulation", contenu: "Tout citoyen peut circuler librement sur le territoire de San Andreas. Exceptions : décision judiciaire, zones sécurisées ou restreintes, événements officiels fermés.", tags: ["circulation"] },
  { id: "CONST-4", categorie: "constitution", titre: "Libertés de réunion et manifestation", contenu: "Les citoyens peuvent organiser meetings politiques, manifestations, grèves, rassemblements publics. Sous réserve du maintien de l'ordre et de déclaration préalable aux autorités administratives.", tags: ["manifestation", "réunion"] },
  { id: "CONST-5", categorie: "constitution", titre: "Droit de propriété", contenu: "Tout citoyen peut posséder des biens, posséder une entreprise, acheter/vendre librement. Sous réserve des lois et décisions judiciaires.", tags: ["propriété"] },
  { id: "CONST-6", categorie: "constitution", titre: "Droit au travail", contenu: "Tout citoyen peut exercer librement une activité légale, entrepreneuriale ou salariée.", tags: ["travail"] },
  { id: "CONST-7", categorie: "constitution", titre: "Droit à la sécurité", contenu: "L'État garantit : protection policière, services médicaux, sécurité publique.", tags: ["sécurité"] },
  { id: "CONST-8", categorie: "constitution", titre: "Droit à un procès équitable", contenu: "Toute personne accusée a droit à : un avocat, une audience publique, un juge impartial, des preuves débattues. Sauf ordonnance judiciaire restrictive.", tags: ["procès", "équitable", "avocat"] },
  { id: "CONST-9", categorie: "constitution", titre: "Présomption d'innocence", contenu: "Toute personne est présumée innocente jusqu'à décision finale.", tags: ["innocence", "présomption"] },
  { id: "CONST-10", categorie: "constitution", titre: "Droit à la défense", contenu: "Tout citoyen peut se défendre librement via un avocat, arguments et contre-preuves.", tags: ["défense"] },
  { id: "CONST-11", categorie: "constitution", titre: "Égalité devant la loi", contenu: "Tous les citoyens sont égaux sans distinction de richesse, statut ou fonction politique.", tags: ["égalité"] },
  { id: "CONST-13", categorie: "constitution", titre: "Protection contre l'abus de pouvoir", contenu: "Aucune autorité ne peut sanctionner sans procédure, agir arbitrairement ou détourner les règles.", tags: ["abus", "pouvoir"] },

  // CONTRAVENTIONS
  { id: "C-1", categorie: "penal_contravention", titre: "Stationnement bateau hors port", contenu: "Stationner un bateau sur une côte dépourvue de port.", amende: "450$", detention: "Mise en fourrière du bateau", tags: ["bateau", "stationnement"] },
  { id: "C-2", categorie: "penal_contravention", titre: "Atterrissage inapproprié (avion/hélico)", contenu: "Atterrir avec un avion ou un hélicoptère sur un site non autorisé.", amende: "450$", detention: "Mise en fourrière de l'appareil", tags: ["avion", "hélicoptère"] },
  { id: "C-3", categorie: "penal_contravention", titre: "Survol de site inapproprié", contenu: "Survoler un site non autorisé en avion ou en hélicoptère.", amende: "135$", tags: ["avion", "survol"] },
  { id: "C-4", categorie: "penal_contravention", titre: "Atteinte à la pudeur", contenu: "Se déplacer nu ou en sous-vêtements dans un lieu public ou accessible au public.", amende: "450$", tags: ["pudeur"] },
  { id: "C-5", categorie: "penal_contravention", titre: "Conduite dangereuse", contenu: "Conduite dangereuse incluant le fait de ne pas maîtriser son véhicule, qu'il soit aérien, maritime ou terrestre.", amende: "2 700$", tags: ["conduite", "danger"] },
  { id: "C-6", categorie: "penal_contravention", titre: "Dissimulation du visage", contenu: "La dissimulation du visage dans un lieu public ou accessible au public. Tout objet/masque rendant difficile l'identification des personnes.", amende: "540$", tags: ["masque", "visage"] },
  { id: "C-7", categorie: "penal_contravention", titre: "Excès de vitesse (radar)", contenu: "Un excès de vitesse détecté par contrôle radar.", amende: "1 800$", tags: ["vitesse", "radar"] },
  { id: "C-8", categorie: "penal_contravention", titre: "Grand excès de vitesse (>50km/h)", contenu: "Un dépassement de plus de 50 km/h au-delà de la limite autorisée, détecté par contrôle radar.", amende: "3 000$", detention: "Retrait de permis", tags: ["vitesse", "radar"] },
  { id: "C-9", categorie: "penal_contravention", titre: "Holster interdit", contenu: "La possession d'un holster interdit. Tout accessoire conçu pour le port d'une arme à feu. Le holster peut être saisi.", amende: "1 350$", tags: ["holster", "arme"] },
  { id: "C-10", categorie: "penal_contravention", titre: "Insulte envers un civil", contenu: "Le fait d'insulter un civil. L'insulte est définie comme une expression outrageante adressée à un civil.", amende: "270$", tags: ["insulte", "civil"] },
  { id: "C-11", categorie: "penal_contravention", titre: "Ivresse / stupéfiants sur la voie publique", contenu: "Être en état d'ivresse ou consommer des stupéfiants sur la voie publique.", amende: "270$", tags: ["ivresse", "drogue", "stupéfiants"] },
  { id: "C-12", categorie: "penal_contravention", titre: "Mendicité en lieu public", contenu: "Le fait de demander de l'argent aux passants dans un lieu public.", amende: "1 350$", tags: ["mendicité"] },
  { id: "C-13", categorie: "penal_contravention", titre: "Non présentation des papiers d'identité", contenu: "Ne pas présenter ses papiers d'identité à la demande d'une personne dépositaire de l'autorité publique. Peut entraîner des vérifications complémentaires.", amende: "450$", tags: ["identité", "papiers"] },
  { id: "C-14", categorie: "penal_contravention", titre: "Participation à une manifestation illégale", contenu: "Participer à une manifestation non autorisée par les autorités publiques.", amende: "135$", tags: ["manifestation"] },
  { id: "C-15", categorie: "penal_contravention", titre: "Stationnement gênant", contenu: "Stationner sur un emplacement gênant et/ou interdit (sortie de garage, intersection, etc.). Le véhicule peut être mis en fourrière en cas d'absence de propriétaire.", amende: "270$", tags: ["stationnement", "véhicule"] },
  { id: "C-16", categorie: "penal_contravention", titre: "Tapage nocturne", contenu: "Produire des nuisances sonores trop fortes le soir.", amende: "360$", tags: ["bruit", "nuit"] },
  { id: "C-17", categorie: "penal_contravention", titre: "Usage abusif du klaxon", contenu: "Utiliser de manière abusive sans cadre de réel danger le klaxon d'un véhicule.", amende: "450$", tags: ["klaxon", "bruit"] },
  { id: "C-18", categorie: "penal_contravention", titre: "Consommation de drogue", contenu: "Consommer des substances classifiées comme stupéfiants. Toute drogue possédée est également saisie.", amende: "450$", tags: ["drogue", "stupéfiants"] },
  { id: "C-19", categorie: "penal_contravention", titre: "Faux appels (canulars)", contenu: "Appeler intentionnellement des numéros d'urgence dans le but de faire une blague.", amende: "405$", tags: ["canular", "appel"] },
  { id: "C-20", categorie: "penal_contravention", titre: "Possession / flagrant délit de crochetage", contenu: "La possession sur soi ou dans ses biens d'un outil de crochetage, ou le fait d'être pris en flagrant délit de crochetage. L'objet est saisi.", amende: "225$", tags: ["crochetage"] },
  { id: "C-21", categorie: "penal_contravention", titre: "Conduite en contresens", contenu: "Conduire à contresens, y compris circuler de manière prolongée sur une voie opposée.", amende: "2 700$", tags: ["contresens", "conduite"] },
  { id: "C-22", categorie: "penal_contravention", titre: "Dégradations de biens publics/privés", contenu: "Porter atteinte à l'état d'un bien public ou privé de manière volontaire ou involontaire.", amende: "1 100$", detention: "10 minutes", tags: ["dégradation", "bien"] },
  { id: "C-23", categorie: "penal_contravention", titre: "Fausse plaque d'immatriculation", contenu: "La possession ou l'utilisation d'une fausse plaque ou d'une plaque modifiée. L'objet est saisi.", amende: "120$ / unité", detention: "5 minutes", tags: ["plaque", "véhicule"] },

  // DÉLITS MINEURS — sélection représentative des 145 articles
  { id: "DM-1", categorie: "penal_delit_mineur", titre: "Agression sur citoyen / maltraitance animal", contenu: "Agresser physiquement un autre citoyen sans risque de mort. La violence volontaire envers un animal est également sanctionnée.", amende: "4 500$", detention: "30 minutes", tags: ["agression", "violence", "animal"] },
  { id: "DM-3", categorie: "penal_delit_mineur", titre: "Outrage envers représentant de l'État", contenu: "Porter atteinte à l'honneur d'un représentant de l'État et/ou d'un magistrat dans l'exercice de ses fonctions officielles (insultes, manque de respect abusif).", amende: "2 000$", detention: "10 minutes", tags: ["outrage", "police", "magistrat"] },
  { id: "DM-4", categorie: "penal_delit_mineur", titre: "Appel abusif service publics", contenu: "Appeler de manière abusive un numéro du service public sans raison valable et légitime.", amende: "1 800$", detention: "15 minutes", tags: ["appel", "urgences"] },
  { id: "DM-6", categorie: "penal_delit_mineur", titre: "Braquage de supérette", contenu: "Voler de l'argent dans une supérette par le moyen de la menace. L'argent liquide possédé par le délinquant est entièrement saisi.", amende: "3 600$", detention: "20 minutes", tags: ["braquage", "vol"] },
  { id: "DM-7", categorie: "penal_delit_mineur", titre: "Braquage / piratage d'ATM", contenu: "Voler de l'argent d'un distributeur automatique de billets. L'argent liquide est entièrement saisi.", amende: "2 250$", detention: "15 minutes", tags: ["ATM", "braquage"] },
  { id: "DM-8", categorie: "penal_delit_mineur", titre: "Cambriolage", contenu: "S'introduire par effraction pour voler des biens dans une résidence. Les biens volés sont saisis.", amende: "1 350$", detention: "15 minutes", tags: ["cambriolage", "effraction"] },
  { id: "DM-9", categorie: "penal_delit_mineur", titre: "Conduite sans permis", contenu: "Conduire sans permis un véhicule en nécessitant un. Le véhicule est mis en fourrière si aucune personne munie d'un permis n'est présente.", amende: "1 350$", detention: "15 minutes", tags: ["permis", "conduite"] },
  { id: "DM-10", categorie: "penal_delit_mineur", titre: "Conduite d'un véhicule volé", contenu: "Conduire un véhicule ayant été volé. Tout conducteur est considéré comme responsable de s'assurer de la provenance du véhicule.", amende: "1 350$", detention: "15 minutes", tags: ["véhicule", "volé"] },
  { id: "DM-12", categorie: "penal_delit_mineur", titre: "Délit de fuite", contenu: "Provoquer un accident impliquant des préjudices matériels et/ou physiques et ne pas s'arrêter en fuyant sa responsabilité.", amende: "1 350$", detention: "15 minutes", tags: ["fuite", "accident"] },
  { id: "DM-13", categorie: "penal_delit_mineur", titre: "Entrave à une opération/enquête", contenu: "Gêner volontairement les forces de l'ordre en opération (gyrophares/sirènes). S'applique également à l'entrave volontaire à une enquête ou déclarations biaisées.", amende: "3 500$", detention: "30 minutes", tags: ["entrave", "police", "enquête"] },
  { id: "DM-15", categorie: "penal_delit_mineur", titre: "Exhibition d'armes de poing", contenu: "Exhiber toute arme de poing (type pistolet) n'entrant pas dans la catégorie des armes lourdes/automatiques. Implique automatiquement le chef de possession.", amende: "1 350$", detention: "15 minutes", tags: ["arme", "exhibition", "pistolet"] },
  { id: "DM-16", categorie: "penal_delit_mineur", titre: "Exhibition d'armes lourdes/automatiques", contenu: "Exhiber toute arme lourde/automatique (pouvant tirer en rafale). Implique automatiquement le chef de possession.", amende: "4 500$", detention: "30 minutes", tags: ["arme", "lourde", "automatique"] },
  { id: "DM-20", categorie: "penal_delit_mineur", titre: "Utilisation d'une arme à feu", contenu: "Test de résidus de poudre positif suite à une fusillade non observée, sans blessé ni décès constaté.", amende: "1 350$", detention: "15 minutes", tags: ["arme", "tir", "poudre"] },
  { id: "DM-21", categorie: "penal_delit_mineur", titre: "Intrusion dans une zone à accès restreint", contenu: "L'intrusion dans une zone à accès restreint et/ou sécurisé sans autorisation préalable.", amende: "3 200$", detention: "30 minutes", tags: ["intrusion", "zone", "restreint"] },
  { id: "DM-22", categorie: "penal_delit_mineur", titre: "Menace et/ou intimidation envers un civil", contenu: "Démontrer manifestement une intention de nuire à un individu civil. Peut être verbale, écrite, dématérialisée ou physique. Vaut également pour l'intimidation.", amende: "3 500$", detention: "15 minutes", tags: ["menace", "intimidation", "civil"] },
  { id: "DM-23", categorie: "penal_delit_mineur", titre: "Mise en danger de la vie d'autrui", contenu: "Tout acte violant délibérément une règle de sécurité ayant comme conséquence un risque immédiat pour l'intégrité d'une personne.", amende: "5 800$", detention: "15 minutes", tags: ["danger", "vie", "sécurité"] },
  { id: "DM-24", categorie: "penal_delit_mineur", titre: "Non assistance à personne en danger", contenu: "Ne pas porter assistance à une personne manifestement en besoin de secours, lorsque les conditions le permettent.", amende: "4 050$", detention: "20 minutes", tags: ["assistance", "danger", "secours"] },
  { id: "DM-25", categorie: "penal_delit_mineur", titre: "Non dénonciation d'un acte illégal", contenu: "Avoir connaissance de la commission ou préparation d'un crime et omettre volontairement de le rapporter aux autorités. Exception : secret professionnel.", amende: "2 700$", detention: "15 minutes", tags: ["dénonciation", "crime"] },
  { id: "DM-26", categorie: "penal_delit_mineur", titre: "Non présentation à une convocation de police", contenu: "Ne pas se présenter à une convocation donnée par un agent des forces de l'ordre dans les délais, qu'elle soit orale ou écrite.", amende: "6 750$", detention: "20 minutes", tags: ["convocation", "police"] },
  { id: "DM-27", categorie: "penal_delit_mineur", titre: "Non respect de l'assignation géographique", contenu: "Ne pas respecter l'assignation géographique donnée dans le cadre d'une décision de justice ou d'une mesure de sûreté.", amende: "18 000$", detention: "10 minutes", tags: ["assignation", "justice"] },
  { id: "DM-29", categorie: "penal_delit_mineur", titre: "Non respect du contrôle judiciaire", contenu: "Ne pas se conformer aux mesures de sûreté prises à l'égard d'un individu en attente d'une condamnation.", amende: "2 700$", detention: "10 minutes", tags: ["contrôle", "judiciaire"] },
  { id: "DM-33", categorie: "penal_delit_mineur", titre: "Possession boîtier de piratage (Darknet)", contenu: "Posséder sur soi ou dans ses biens un boîtier Darknet. L'intégralité des possessions est saisie.", amende: "1 000$", detention: "10 minutes", tags: ["piratage", "darknet"] },
  { id: "DM-45", categorie: "penal_delit_mineur", titre: "Possession de pistolet 17", contenu: "La possession sur soi, dans son coffre ou dans l'un de ses biens d'un pistolet 17 est illégale. L'arme est saisie.", amende: "15 000$", detention: "10 minutes", tags: ["pistolet", "arme"] },
  { id: "DM-47", categorie: "penal_delit_mineur", titre: "Possession de pistolet", contenu: "La possession sur soi ou dans l'un de ses biens d'un pistolet est illégale. L'arme est saisie.", amende: "15 000$", detention: "20 minutes", tags: ["pistolet", "arme"] },
  { id: "DM-54", categorie: "penal_delit_mineur", titre: "Possession de pistolet paralysant (taser)", contenu: "La possession sur soi ou dans l'un de ses biens d'un pistolet paralysant (taser) est illégale. L'arme est saisie.", amende: "13 500$", detention: "20 minutes", tags: ["taser", "arme"] },
  { id: "DM-73", categorie: "penal_delit_mineur", titre: "Possession de kit de fabrication de meth", contenu: "Posséder sur soi ou dans l'un de ses biens un kit de fabrication de meth. L'intégralité des possessions est saisie.", amende: "5 000$", detention: "10 minutes", tags: ["meth", "drogue", "fabrication"] },
  { id: "DM-78", categorie: "penal_delit_mineur", titre: "Possession de cannabis", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon de cannabis est illégale. La possession est saisie.", amende: "32$ / unité", detention: "10 minutes", tags: ["cannabis", "drogue"] },
  { id: "DM-79", categorie: "penal_delit_mineur", titre: "Possession de cocaïne", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon de cocaïne est illégale. La possession est saisie.", amende: "45$ / unité", detention: "10 minutes", tags: ["cocaïne", "drogue"] },
  { id: "DM-80", categorie: "penal_delit_mineur", titre: "Possession de crack", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon de crack est illégale. La possession est saisie.", amende: "90$ / unité", detention: "10 minutes", tags: ["crack", "drogue"] },
  { id: "DM-84", categorie: "penal_delit_mineur", titre: "Possession d'héroïne", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon d'héroïne est illégale. La possession est saisie.", amende: "72$ / unité", detention: "10 minutes", tags: ["héroïne", "drogue"] },
  { id: "DM-90", categorie: "penal_delit_mineur", titre: "Possession de méthamphétamine", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon de méthamphétamine est illégale. La possession est saisie.", amende: "72$ / unité", detention: "10 minutes", tags: ["meth", "drogue"] },
  { id: "DM-119", categorie: "penal_delit_mineur", titre: "Possession de red fang", contenu: "La possession sur soi ou dans l'un de ses biens d'un pochon de red fang est illégale. La possession est saisie.", amende: "90$ / unité", detention: "10 minutes", tags: ["red fang", "drogue"] },
  { id: "DM-124", categorie: "penal_delit_mineur", titre: "Vente de drogue", contenu: "Acte de passer de la drogue à une autre personne, contre de l'argent ou non. Dès qu'une possession de 75 unités ou plus s'ajoute, le trafic est automatiquement considéré comme prouvé. L'argent liquide est entièrement saisi.", amende: "3 750$", detention: "10 minutes", tags: ["vente", "drogue", "trafic"] },
  { id: "DM-125", categorie: "penal_delit_mineur", titre: "Recel de véhicule volé", contenu: "Cacher ou garder, ou servir d'intermédiaire pour un véhicule dont on sait qu'il a été volé.", amende: "2 025$", detention: "10 minutes", tags: ["recel", "véhicule", "vol"] },
  { id: "DM-127", categorie: "penal_delit_mineur", titre: "Refus d'obtempérer", contenu: "Refus de se soumettre à une sommation d'un agent de l'autorité publique lors d'un contrôle, notamment en prenant la fuite.", amende: "900$", detention: "15 minutes", tags: ["refus", "police", "fuite"] },
  { id: "DM-128", categorie: "penal_delit_mineur", titre: "Refus de comparaître", contenu: "Ne pas se présenter à une convocation ou un subpoena à la date et l'heure indiquées sans motif valable donné au préalable.", amende: "1 800$", detention: "30 minutes", tags: ["comparution", "convocation"] },
  { id: "DM-129", categorie: "penal_delit_mineur", titre: "Refus de se soumettre à une injonction", contenu: "Ne pas se conformer à une injonction écrite émise par un magistrat exigeant d'accomplir ou cesser une action spécifique.", amende: "1 080$", detention: "1 heure", tags: ["injonction", "magistrat"] },
  { id: "DM-130", categorie: "penal_delit_mineur", titre: "Trafic de stupéfiants", contenu: "Organisation et gestion des activités liées à la production, au transport et à la distribution de drogues en grandes quantités. Le transport de 75 unités ou plus prouve d'office un trafic.", amende: "Variable", detention: "Variable", tags: ["trafic", "drogue", "stupéfiants"] },
  { id: "DM-131", categorie: "penal_delit_mineur", titre: "Troubles à l'ordre public", contenu: "Toute atteinte portée à la paix publique. Tout refus de faire revenir la situation au calme sur la voie publique suite aux demandes des forces de police.", amende: "1 350$", detention: "15 minutes", tags: ["ordre", "public", "trouble"] },
  { id: "DM-132", categorie: "penal_delit_mineur", titre: "Violation de propriété privée", contenu: "Entrer illégalement dans le périmètre d'une propriété privée (d'une entreprise ou d'un particulier).", amende: "1 800$", detention: "15 minutes", tags: ["propriété", "intrusion"] },
  { id: "DM-133", categorie: "penal_delit_mineur", titre: "Vol", contenu: "Soustraire de manière frauduleuse la chose d'autrui. Le fruit du vol est restitué au propriétaire dans la mesure du possible.", amende: "1 350$", detention: "15 minutes", tags: ["vol"] },
  { id: "DM-137", categorie: "penal_delit_mineur", titre: "Vol de véhicule", contenu: "Vol de véhicule de manière générale. Tout conducteur doit être en mesure de justifier la provenance de son véhicule.", amende: "2 000$", detention: "10 minutes", tags: ["vol", "véhicule"] },
  { id: "DM-138", categorie: "penal_delit_mineur", titre: "Vente d'objets illégaux", contenu: "Réaliser une vente dans laquelle sont impliqués des biens illégaux (servant à une activité illégale).", amende: "5 500$", detention: "20 minutes", tags: ["vente", "illégal"] },
  { id: "DM-140", categorie: "penal_delit_mineur", titre: "Utilisation illégale de menottes/serflex", contenu: "Utiliser tout objet pour restreindre la liberté d'agir d'un individu sans autorisation légale. L'objet est saisi.", amende: "120$", detention: "5 minutes", tags: ["menottes", "serflex"] },
  { id: "DM-144", categorie: "penal_delit_mineur", titre: "Évasion du poste de police", contenu: "S'échapper illégalement d'un lieu de garde à vue ou de détention provisoire avant d'avoir été présenté à un juge.", amende: "7 500$", detention: "20 minutes", tags: ["évasion", "police"] },

  // DÉLITS MAJEURS
  { id: "DMJ-1", categorie: "penal_delit_majeur", titre: "Abus de confiance", contenu: "Détourner, au préjudice d'autrui, des fonds, des valeurs ou un bien remis et acceptés à charge de les rendre ou d'en faire un usage déterminé. Un accord préalable (verbal ou écrit) doit exister.", amende: "12 500$", detention: "20 minutes", tags: ["abus", "confiance", "détournement"] },
  { id: "DMJ-2", categorie: "penal_delit_majeur", titre: "Braquage de société", contenu: "Braquer une société par le moyen de la menace d'une arme. Les armes et l'argent liquide sont saisis. Ce chef impose un jugement ou l'intervention d'un juge.", amende: "44 000$", detention: "20 minutes", tags: ["braquage", "société"] },
  { id: "DMJ-5", categorie: "penal_delit_majeur", titre: "Attaque convoi de fonds (Brinks, SAMP)", contenu: "Mettre en péril le bon déroulement d'un convoi organisé par l'État ou pour l'État par le biais de la violence, la menace ou la ruse.", amende: "8 500$", detention: "45 minutes", tags: ["convoi", "attaque", "brinks"] },
  { id: "DMJ-7", categorie: "penal_delit_majeur", titre: "Discrimination", contenu: "Organiser une différence de traitement sur des critères ethniques, religieux, ou sexuels dans le cadre de l'emploi, logement, services, aides de l'État.", amende: "7 200$", detention: "20 minutes", tags: ["discrimination"] },
  { id: "DMJ-8", categorie: "penal_delit_majeur", titre: "Chantage", contenu: "Utiliser une information sur quelqu'un, un moyen de pression matériel ou mental, une menace en échange d'un bien ou d'un service.", amende: "3 150$", detention: "15 minutes", tags: ["chantage", "menace"] },
  { id: "DMJ-9", categorie: "penal_delit_majeur", titre: "Agression sur agent (employé d'État / police)", contenu: "Porter atteinte physiquement à un agent des forces de l'ordre ou employé d'État (EMS, Gouvernement) dans le cadre de ses fonctions, sans danger pour la vie.", amende: "8 500$", detention: "1 heure", tags: ["agression", "police", "EMS"] },
  { id: "DMJ-10", categorie: "penal_delit_majeur", titre: "Outrage grave envers représentant de l'État", contenu: "Porter atteinte à l'honneur d'un employé d'État (FDO, Gouvernement, EMS, magistrat) de manière considérée comme abusive et sans retenue.", amende: "13 500$", detention: "45 minutes", tags: ["outrage", "représentant", "État"] },
  { id: "DMJ-11", categorie: "penal_delit_majeur", titre: "Menaces de mort / Menaces graves", contenu: "Proférer des menaces impliquant la mort de la victime. Ou proférer des menaces violentes et/ou choquantes.", amende: "8 500$", detention: "45 minutes", tags: ["menace", "mort"] },
  { id: "DMJ-12", categorie: "penal_delit_majeur", titre: "Harcèlement", contenu: "Harceler une personne par des propos ou comportements répétés ayant pour but de nuire.", amende: "15 000$", detention: "20 minutes", tags: ["harcèlement"] },
  { id: "DMJ-13", categorie: "penal_delit_majeur", titre: "Homicide involontaire", contenu: "Causer la mort d'autrui sans le vouloir par maladresse, négligence, non-respect d'une obligation de sécurité, imprudence ou inattention.", amende: "12 500$", detention: "25 minutes", tags: ["homicide", "mort", "involontaire"] },
  { id: "DMJ-14", categorie: "penal_delit_majeur", titre: "Association de malfaiteurs", contenu: "Caractérisée par la préméditation résultant d'un projet commun visant la commission de plusieurs délits ou crimes (minimum 3 individus). Applicable uniquement par des États-majors, procureurs et juges.", amende: "4 500$", detention: "30 minutes", tags: ["association", "malfaiteurs", "bande"] },
  { id: "DMJ-15", categorie: "penal_delit_majeur", titre: "Port de kevlar / gilet par balle", contenu: "Porter un kevlar ou gilet pare-balles sans y être autorisé par la loi ou les directives des autorités publiques.", amende: "5 000$", detention: "15 minutes", tags: ["kevlar", "gilet", "armure"] },
  { id: "DMJ-16", categorie: "penal_delit_majeur", titre: "Braquage d'armurerie", contenu: "Voler de l'argent ou des objets dans une armurerie par le moyen de la menace d'une arme. L'argent liquide est saisi.", amende: "7 200$", detention: "25 minutes", tags: ["braquage", "armurerie"] },
  { id: "DMJ-17", categorie: "penal_delit_majeur", titre: "Braquage bijouterie / supermarché", contenu: "Braquer une bijouterie ou le supermarché de Roxwood à main armée. L'argent liquide est saisi.", amende: "9 000$", detention: "30 minutes", tags: ["braquage", "bijouterie"] },
  { id: "DMJ-18", categorie: "penal_delit_majeur", titre: "Braquage banque centrale (Pacifique Banque)", contenu: "Braquer une banque centrale. L'argent liquide est entièrement saisi.", amende: "25 000$", detention: "60 minutes", tags: ["braquage", "banque", "centrale"] },
  { id: "DMJ-20", categorie: "penal_delit_majeur", titre: "Braquage du Human Labs", contenu: "Braquer le Human Labs. L'argent liquide est entièrement saisi.", amende: "18 000$", detention: "60 minutes", tags: ["braquage", "human labs"] },
  { id: "DMJ-21", categorie: "penal_delit_majeur", titre: "Braquage de banque (Fleeca, Pine Banque Roxwood)", contenu: "Voler de l'argent ou des objets dans une banque par le moyen de la menace d'une arme. L'argent liquide est entièrement saisi.", amende: "15 000$", detention: "25 minutes", tags: ["braquage", "banque"] },
  { id: "DMJ-22", categorie: "penal_delit_majeur", titre: "Achat d'armes illégales", contenu: "Effectuer un achat d'armes classifiées comme non légales. Les armes et l'argent sont saisis.", amende: "12 500$ × quantité", detention: "30 minutes", tags: ["arme", "achat", "illégal"] },
  { id: "DMJ-24", categorie: "penal_delit_majeur", titre: "Diffamation", contenu: "Présenter une personne de façon fallacieuse, atteindre à son honneur et tenter de lui porter préjudice.", amende: "3 500$", detention: "15 minutes", tags: ["diffamation", "honneur"] },
  { id: "DMJ-25", categorie: "penal_delit_majeur", titre: "Entreposage d'armes illégales (≥ 3)", contenu: "Entreposer des armes classifiées comme illégales dans l'un de ses biens à un nombre supérieur ou égal à 3.", amende: "9 000$ × nombre", detention: "30 minutes", tags: ["arme", "entreposage"] },
  { id: "DMJ-27", categorie: "penal_delit_majeur", titre: "Extorsion / Escroquerie", contenu: "Obtenir par la violence, la menace ou la contrainte des fonds, une signature, une renonciation de droit. Ou tromper une personne afin d'obtenir quelque chose d'elle.", amende: "8 500$", detention: "30 minutes", tags: ["extorsion", "escroquerie"] },
  { id: "DMJ-28", categorie: "penal_delit_majeur", titre: "Faux témoignage", contenu: "Produire un faux témoignage ou un témoignage falsifié de manière volontaire ayant pour conséquence de mal orienter une enquête ou de porter préjudice à un individu.", amende: "9 000$", detention: "30 minutes", tags: ["faux", "témoignage"] },
  { id: "DMJ-29", categorie: "penal_delit_majeur", titre: "Intimidation / Chantage envers magistrat", contenu: "Formuler des menaces à l'endroit d'un magistrat (juges, procureurs) ou exercer un chantage pour obtenir quelque chose d'un magistrat.", amende: "7 500$", detention: "30 minutes", tags: ["magistrat", "chantage", "intimidation"] },
  { id: "DMJ-31", categorie: "penal_delit_majeur", titre: "Non respect d'une décision de justice", contenu: "Ne pas se soumettre à une décision de justice rendue par un Tribunal.", amende: "9 000$", detention: "30 minutes", tags: ["justice", "décision"] },
  { id: "DMJ-35", categorie: "penal_delit_majeur", titre: "Parjure", contenu: "Produire volontairement un témoignage frauduleux lorsque l'on est sous serment (par la fonction ou par prestation devant un magistrat).", amende: "5 500$", detention: "30 minutes", tags: ["parjure", "serment", "témoignage"] },
  { id: "DMJ-36", categorie: "penal_delit_majeur", titre: "Participation à une fusillade", contenu: "Participer à un affrontement entre groupes ou contre les forces de l'ordre par le biais d'armes à feu. Peut entraîner l'exposition aux chefs relatifs aux atteintes à la vie des agents.", amende: "3 500$", detention: "30 minutes", tags: ["fusillade", "arme", "affrontement"] },
  { id: "DMJ-54", categorie: "penal_delit_majeur", titre: "Possession de fusil d'assaut", contenu: "La possession sur soi ou dans l'un de ses biens d'un fusil d'assaut est illégale. L'arme est saisie.", amende: "35 000$", detention: "25 minutes", tags: ["fusil", "assaut", "arme"] },
  { id: "DMJ-83", categorie: "penal_delit_majeur", titre: "Prise d'otage sur un civil", contenu: "Restreindre par la menace ou la violence un civil de sa liberté en vue d'obtenir quelque chose en échange de sa libération.", amende: "4 500$", detention: "15 minutes", tags: ["otage", "civil"] },
  { id: "DMJ-88", categorie: "penal_delit_majeur", titre: "Usage de faux", contenu: "Utiliser un document officiel dont on sait qu'il a été falsifié, peu importe si la personne est à l'origine du faux. Les documents sont saisis.", amende: "2 700$", detention: "30 minutes", tags: ["faux", "document"] },
  { id: "DMJ-90", categorie: "penal_delit_majeur", titre: "Usurpation (identité et/ou fonction)", contenu: "Se faire sciemment passer pour quelqu'un d'autre ou une fonction dans un objectif crapuleux, que ce soit dans un cadre réel ou inventé.", amende: "4 600$", detention: "30 minutes", tags: ["usurpation", "identité"] },
  { id: "DMJ-91", categorie: "penal_delit_majeur", titre: "Vol à main armée", contenu: "Voler un bien à un citoyen par le moyen de la menace d'une arme. Cela remplace le chef de vol simple. Les biens volés sont restitués.", amende: "5 000$", detention: "30 minutes", tags: ["vol", "arme"] },
  { id: "DMJ-95", categorie: "penal_delit_majeur", titre: "Destruction / Dissimulation de preuve", contenu: "Dissimuler ou détruire tout élément pouvant mener à une responsabilité pénale. Si l'arme du crime n'est pas retrouvée sur l'accusé, cette infraction peut être mise.", amende: "5 500$", detention: "30 minutes", tags: ["preuve", "destruction"] },
  { id: "DMJ-100", categorie: "penal_delit_majeur", titre: "Corruption", contenu: "Tout acte visant à obtenir un service de quelqu'un disposant d'une position d'autorité publique en échange d'un bien ou d'un service. Applicable aux deux parties si l'offre est acceptée.", amende: "22 500$", detention: "30 minutes", tags: ["corruption"] },
  { id: "DMJ-101", categorie: "penal_delit_majeur", titre: "Fraude fiscale", contenu: "La soustraction illégale à la loi fiscale, d'une personne morale ou physique, de tout ou partie de la matière imposable.", amende: "90 000$", detention: "30 minutes", tags: ["fraude", "fiscale", "impôt"] },
  { id: "DMJ-102", categorie: "penal_delit_majeur", titre: "Incendie criminel", contenu: "Provoquer volontairement le départ d'un feu à des fins criminelles, peu importe le lieu.", amende: "20 500$", detention: "30 minutes", tags: ["incendie", "feu"] },
  { id: "DMJ-105", categorie: "penal_delit_majeur", titre: "Braquage organisé de grande envergure", contenu: "Vol commis par un groupe de personnes armées qui planifient à l'avance de s'emparer de biens ou d'argent de grande valeur. Non cumulable avec les autres délits de braquage.", amende: "22 500$", detention: "30 minutes", tags: ["braquage", "organisé"] },

  // CRIMES
  { id: "CR-1", categorie: "penal_crime", titre: "Acte lié au terrorisme", contenu: "Commettre des actes pouvant faciliter la mise en œuvre d'actes terroristes, financer le terrorisme ou aider des terroristes.", amende: "15 000$", detention: "1 heure", tags: ["terrorisme"] },
  { id: "CR-2", categorie: "penal_crime", titre: "Blanchiment", contenu: "Dissimuler l'origine de fonds obtenus de manière illégale afin qu'ils soient perçus comme légaux.", amende: "5$ × somme totale blanchie", detention: "15 minutes", tags: ["blanchiment", "argent"] },
  { id: "CR-4", categorie: "penal_crime", titre: "Assassinat (Meurtre prémédité) — MORT RP", contenu: "Réaliser un homicide dont la préparation, les moyens et la mise en œuvre ont été mûrement réfléchis en amont. N'est applicable que si le personnage est réellement mort (implique un wipe).", amende: "225 000$", detention: "1 heure", tags: ["assassinat", "meurtre", "mort RP"] },
  { id: "CR-5", categorie: "penal_crime", titre: "Assassinat représentant de l'État — MORT RP", contenu: "Réaliser un homicide prémédité sur un représentant de l'État. N'est applicable que si le personnage est réellement mort (implique un wipe).", amende: "225 000$", detention: "1 heure", tags: ["assassinat", "police", "mort RP"] },
  { id: "CR-6", categorie: "penal_crime", titre: "Pratique illégale de la médecine", contenu: "Réaliser tout acte médical professionnel sans y être autorisé. Ou professionnel de santé ne respectant pas les protocoles établis.", amende: "9 000$", detention: "30 minutes", tags: ["médecine", "pratique", "illégale"] },
  { id: "CR-7", categorie: "penal_crime", titre: "Vente illégale d'armes", contenu: "Réaliser des transactions visant à échanger des armes illégales. La vente d'armes légales est concernée quand on sait que l'acheteur prévoit de commettre un crime. L'intégralité des sommes est saisie.", amende: "12 500$", detention: "30 minutes", tags: ["arme", "vente", "illégal"] },
  { id: "CR-8", categorie: "penal_crime", titre: "Meurtre — MORT RP", contenu: "Commettre un homicide volontaire sans préparation en amont. N'est applicable que si le personnage est réellement mort (implique un wipe).", amende: "100 800$", detention: "1 heure", tags: ["meurtre", "mort RP"] },
  { id: "CR-9", categorie: "penal_crime", titre: "Faux document administratif", contenu: "Réaliser la production d'un document délivré par une administration publique dans un but frauduleux pour le transmettre à un tiers (fausse identité, faux passeport, faux permis).", amende: "13 500$", detention: "30 minutes", tags: ["faux", "document", "identité"] },
  { id: "CR-11", categorie: "penal_crime", titre: "Cavale", contenu: "Évasion ou fuite d'un condamné qui a échappé à la justice et se cache pour éviter d'être repris et puni.", amende: "9 000$", detention: "1 heure", tags: ["cavale", "fuite", "fugitif"] },
  { id: "CR-12", categorie: "penal_crime", titre: "Détournement de fonds", contenu: "Appropriation frauduleuse de fonds, pour son propre intérêt ou celui d'une autre personne. S'applique aux fonds privés et publics.", amende: "18 000$", detention: "30 minutes", tags: ["détournement", "fonds"] },
  { id: "CR-14", categorie: "penal_crime", titre: "Évasion / Organisation d'évasion", contenu: "Ne pas se soumettre à sa peine de prison jusqu'à la fin en s'enfuyant. Vaut aussi pour tout individu ou groupe mettant en œuvre des moyens pour libérer un condamné.", amende: "13 500$", detention: "30 minutes", tags: ["évasion", "prison"] },
  { id: "CR-15", categorie: "penal_crime", titre: "Meurtre sur représentant de l'État — MORT RP", contenu: "Commettre un homicide volontaire non prémédité sur un représentant de l'État. N'est applicable que si le personnage est réellement mort (implique un wipe).", amende: "300 000$", detention: "30 minutes", tags: ["meurtre", "police", "mort RP"] },
  { id: "CR-16", categorie: "penal_crime", titre: "Meurtre représentant de l'État — COMA", contenu: "Utiliser une force meurtrière sur un représentant de l'État qui entraîne le coma. On applique la tentative si la force meurtrière n'entraîne pas le coma.", amende: "30 000$", detention: "30 minutes", tags: ["meurtre", "coma", "police"] },
  { id: "CR-17", categorie: "penal_crime", titre: "Meurtre — COMA", contenu: "Utiliser une force meurtrière sur un civil qui tombe dans le coma du fait de l'attaque. On applique la tentative si la force meurtrière n'entraîne pas le coma.", amende: "18 000$", detention: "30 minutes", tags: ["meurtre", "coma", "civil"] },
  { id: "CR-19", categorie: "penal_crime", titre: "Possession de grenade", contenu: "La possession sur soi ou dans l'un de ses biens d'une grenade est illégale. L'arme est saisie.", amende: "135 000$", detention: "30 minutes", tags: ["grenade", "explosif"] },
  { id: "CR-20", categorie: "penal_crime", titre: "Possession de bombe collante", contenu: "La possession sur soi ou dans l'un de ses biens d'une bombe collante est illégale. L'arme est saisie.", amende: "135 000$", detention: "30 minutes", tags: ["bombe", "explosif"] },
  { id: "CR-21", categorie: "penal_crime", titre: "Prise d'otage sur représentant de l'État", contenu: "Restreindre par la menace ou la violence un représentant de l'État de sa liberté en vue d'obtenir quelque chose en échange de sa libération. Peut entraîner l'interdiction de suppression du casier judiciaire.", amende: "18 000$", detention: "30 minutes", tags: ["otage", "police", "État"] },
  { id: "CR-22", categorie: "penal_crime", titre: "Séquestration", contenu: "Arrêter, enlever, détenir ou séquestrer une personne par la menace, la violence ou la contrainte, sans ordre des autorités constituées.", amende: "15 500$", detention: "30 minutes", tags: ["séquestration", "enlèvement"] },
  { id: "CR-23", categorie: "penal_crime", titre: "Terrorisme", contenu: "Tout acte individuel ou collectif ayant pour but de troubler gravement l'ordre public par l'intimidation et la terreur. L'intégralité des biens de la personne est saisie.", amende: "45 000$", detention: "1 heure", tags: ["terrorisme", "ordre public"] },
  { id: "CR-24", categorie: "penal_crime", titre: "Trafic d'organes", contenu: "Tous les actes entourant le commerce de tous membres du corps humain (organes, fluides, etc.).", amende: "18 000$", detention: "45 minutes", tags: ["trafic", "organes"] },
  { id: "CR-25", categorie: "penal_crime", titre: "Trahison", contenu: "Ensemble d'infractions commises par un représentant ou dépositaire de l'autorité publique remettant en cause la sécurité et les intérêts fondamentaux de la nation américaine.", amende: "225 000$", detention: "1 heure", tags: ["trahison", "nation"] },
  { id: "CR-26", categorie: "penal_crime", titre: "Trafic d'armes à grande échelle", contenu: "Toute vente organisée et régulière d'objets liés à l'armement constituant un trafic organisé, par un individu ou un groupe d'individus. L'ensemble des armes est saisi.", amende: "27 000$", detention: "1 heure", tags: ["trafic", "armes"] },
  { id: "CR-27", categorie: "penal_crime", titre: "Torture", contenu: "Souffrances physiques et traitements inhumains et cruels infligés volontairement à autrui. La torture peut être physique ou mentale.", amende: "25 000$ / personne", detention: "30 minutes", tags: ["torture", "violence"] },
  { id: "CR-31", categorie: "penal_crime", titre: "Violation du secret professionnel", contenu: "Révéler des informations obtenues dans le cadre d'une profession ou d'une fonction soumise au secret professionnel (avocats, médecins, fonctions publiques).", amende: "22 500$", detention: "30 minutes", tags: ["secret", "professionnel", "avocat"] },

  // PROCÉDURE PÉNALE
  { id: "PROC-1", categorie: "procedure", titre: "Légalité de la procédure", contenu: "Toute procédure pénale doit être fondée sur la loi et respecter les droits fondamentaux.", tags: ["légalité", "procédure"] },
  { id: "PROC-2", categorie: "procedure", titre: "Présomption d'innocence", contenu: "Toute personne est présumée innocente jusqu'à décision judiciaire définitive. Il incombe à l'accusation de prouver la culpabilité au-delà de tout doute raisonnable.", tags: ["innocence", "preuve"] },
  { id: "PROC-3", categorie: "procedure", titre: "Proportionnalité", contenu: "Les mesures prises doivent être strictement nécessaires et proportionnées aux faits reprochés.", tags: ["proportionnalité"] },
  { id: "PROC-4", categorie: "procedure", titre: "Loyauté de la preuve", contenu: "Les preuves doivent être obtenues légalement et de manière loyale.", tags: ["preuve", "loyauté"] },
  { id: "PROC-13", categorie: "procedure", titre: "Convocation — Conditions de validité", contenu: "Pour être juridiquement valide, une convocation de police doit comporter : nom du convoqué, date/heure/lieu, motif de l'audition (statut, infraction visée), et notification des droits dont celui à un avocat. L'absence d'une mention entraîne la nullité de plein droit.", tags: ["convocation", "validité"] },
  { id: "PROC-37", categorie: "procedure", titre: "Procédure de sécurité (déroulement)", contenu: "1. Constater l'infraction · 2. Menotter l'individu · 3. Palper (armes uniquement) · 4. Mettre dans le véhicule · 5. Citer les droits Miranda (délai max 15 min) · 6. Fouille complète · 7. Saisir ce qui est illégal · 8. Tenue de prisonnier · 9. Amende et peine de détention.", tags: ["procédure", "Miranda", "arrestation"] },
  { id: "PROC-38", categorie: "procedure", titre: "Contact obligatoire de la Justice", contenu: "Dès lors que la fiche comporte à minima un crime, trois délits majeurs ou cinq délits mineurs, l'appel d'un procureur ou juge est obligatoire.", tags: ["procureur", "juge", "obligation"] },
  { id: "PROC-40", categorie: "procedure", titre: "Conditions de fouille et de palpation", contenu: "Fouille véhicule : délit mineur commis / dépôt dans le coffre / mandat / accord conducteur. Palpation individu : test poudre positif / délit mineur commis / fusillade / holster / DEFCON 3+ / dissimulation du visage.", tags: ["fouille", "palpation"] },
  { id: "PROC-41", categorie: "procedure", titre: "Droits Miranda", contenu: "Tout individu arrêté doit être informé dans un délai de 15 minutes des raisons de son arrestation et de ses droits, y compris son droit de garder le silence et son droit à une assistance juridique. La lecture doit être effectuée dans un endroit calme.", tags: ["Miranda", "droits", "arrestation"] },
  { id: "PROC-42", categorie: "procedure", titre: "Vices de procédure", contenu: "Constituent des vices : arrestation abusive / palpation ou fouille sans raison / fouille avant droits Miranda / dépassement du délai de 15 minutes / mauvaise lecture des droits / oubli des 3 droits fondamentaux (avocat, EMS, nourriture) / oubli d'appeler procureur/juge quand requis / bavure policière / parjure avéré.", tags: ["vice", "procédure", "nullité"] },
  { id: "PROC-43", categorie: "procedure", titre: "Abandon des charges", contenu: "Conditions d'abandon : inculpation à tort d'un individu / absence de rapport complet expliquant l'arrestation et les chefs d'inculpation retenus.", tags: ["abandon", "charges"] },

  // DROITS MIRANDA (onglet dédié)
  { id: "MIR-1", categorie: "miranda", titre: "Droit de garder le silence", contenu: "Tout individu arrêté a le droit de garder le silence. Nul n'est obligé de s'auto-incriminer. Tout ce que vous direz pourra être retenu contre vous.", tags: ["silence", "Miranda"] },
  { id: "MIR-2", categorie: "miranda", titre: "Droit à un avocat", contenu: "Tout individu a droit à un avocat dès la mise en examen. Si vous ne pouvez pas vous offrir un avocat, il vous en sera commis un d'office.", tags: ["avocat", "Miranda"] },
  { id: "MIR-3", categorie: "miranda", titre: "Droit à l'EMS", contenu: "Tout individu en garde à vue a le droit de demander une assistance médicale (EMS) si son état de santé le nécessite.", tags: ["EMS", "médical", "Miranda"] },
  { id: "MIR-4", categorie: "miranda", titre: "Droit à la nourriture", contenu: "Tout individu en garde à vue a le droit de bénéficier d'une alimentation pendant la durée de sa détention.", tags: ["nourriture", "Miranda"] },
  { id: "MIR-5", categorie: "miranda", titre: "Délai de lecture des droits", contenu: "La lecture des droits Miranda doit être effectuée dans un délai maximum de 15 minutes suivant l'arrestation, dans un endroit calme ne pouvant pas distraire l'individu.", tags: ["délai", "Miranda"] },
  { id: "MIR-6", categorie: "miranda", titre: "Nullité pour violation Miranda", contenu: "Tout dépassement du délai de 15 minutes, toute omission d'un droit, toute lecture effectuée à une personne masquée ou avec une mauvaise identité constitue un vice de procédure pouvant entraîner la nullité.", tags: ["nullité", "Miranda", "vice"] },
];

// ─── CONFIG DES ONGLETS ───────────────────────────────────────────────────────
const ONGLETS: { key: Categorie; label: string; icon: string; color: string }[] = [
  { key: "constitution",          label: "Constitution",        icon: "🏛️", color: "#D4AF37" },
  { key: "penal_contravention",   label: "Contraventions",      icon: "📋", color: "#64748b" },
  { key: "penal_delit_mineur",    label: "Délits mineurs",      icon: "⚠️", color: "#f59e0b" },
  { key: "penal_delit_majeur",    label: "Délits majeurs",      icon: "🔴", color: "#ef4444" },
  { key: "penal_crime",           label: "Crimes",              icon: "💀", color: "#7c3aed" },
  { key: "procedure",             label: "Procédure pénale",    icon: "⚖️", color: "#3b82f6" },
  { key: "miranda",               label: "Droits Miranda",      icon: "🛡️", color: "#10b981" },
];

export default function JuridiqueePage() {
  const [activeTab, setActiveTab] = useState<Categorie>("constitution");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ARTICLES.filter(a => {
      if (a.categorie !== activeTab) return false;
      if (!q) return true;
      return (
        a.titre.toLowerCase().includes(q) ||
        a.contenu.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.includes(q))
      );
    });
  }, [activeTab, search]);

  const tabConfig = ONGLETS.find(o => o.key === activeTab)!;

  const catColors: Record<Categorie, string> = {
    constitution: "#D4AF37",
    penal_contravention: "#64748b",
    penal_delit_mineur: "#f59e0b",
    penal_delit_majeur: "#ef4444",
    penal_crime: "#7c3aed",
    procedure: "#3b82f6",
    civil: "#06b6d4",
    travail: "#84cc16",
    commerce: "#f97316",
    miranda: "#10b981",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Base juridique</h1>
          <p className="page-subtitle">Codes de l'État de San Andreas · FlashBackFA</p>
          <div className="gold-line" />
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {ONGLETS.map(o => (
          <button
            key={o.key}
            onClick={() => { setActiveTab(o.key); setSearch(""); setExpanded(null); }}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: 8,
              border: `1px solid ${activeTab === o.key ? o.color + "60" : "var(--border)"}`,
              background: activeTab === o.key ? o.color + "18" : "var(--surface)",
              color: activeTab === o.key ? o.color : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.82rem",
              fontWeight: activeTab === o.key ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            <span>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="text"
          placeholder={`Rechercher dans ${tabConfig.label}…`}
          value={search}
          onChange={e => { setSearch(e.target.value); setExpanded(null); }}
          style={{ width: "100%", padding: "0.75rem 1rem" }}
        />
      </div>

      {/* Compteur */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          {search && ` pour « ${search} »`}
        </span>
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch("")}>Effacer</button>
        )}
      </div>

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem" }}>
            Aucun article trouvé
          </div>
        )}
        {filtered.map(article => {
          const isOpen = expanded === article.id;
          const color = catColors[article.categorie];
          return (
            <div
              key={article.id}
              style={{
                background: "var(--card)",
                border: `1px solid ${isOpen ? color + "40" : "var(--border)"}`,
                borderRadius: "var(--radius)",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : article.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "1rem 1.25rem",
                  background: "transparent",
                  border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  color: "var(--text)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1, minWidth: 0 }}>
                  <span style={{
                    flexShrink: 0,
                    fontSize: "0.7rem",
                    fontFamily: "'Cinzel', serif",
                    letterSpacing: "0.05em",
                    color,
                    background: color + "15",
                    padding: "0.2rem 0.55rem",
                    borderRadius: 4,
                    border: `1px solid ${color}30`,
                  }}>{article.id}</span>
                  <span style={{ fontWeight: 500, fontSize: "0.875rem", flex: 1 }}>{article.titre}</span>
                  {article.amende && (
                    <span style={{ flexShrink: 0, fontSize: "0.78rem", color: "var(--gold)", fontWeight: 600 }}>
                      {article.amende}
                    </span>
                  )}
                </div>
                <span style={{ marginLeft: "0.75rem", color: "var(--text-dim)", transform: isOpen ? "rotate(90deg)" : "none", transition: "0.15s" }}>›</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 1.25rem 1.25rem 1.25rem" }}>
                  <div style={{ height: 1, background: "var(--border)", marginBottom: "1rem" }} />

                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>
                    {article.contenu}
                  </p>

                  {(article.amende || article.detention) && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {article.amende && (
                        <div style={{
                          background: "rgba(212,175,55,0.08)",
                          border: "1px solid rgba(212,175,55,0.25)",
                          borderRadius: 8, padding: "0.5rem 0.875rem",
                        }}>
                          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.15rem" }}>Amende</div>
                          <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.9rem" }}>{article.amende}</div>
                        </div>
                      )}
                      {article.detention && (
                        <div style={{
                          background: "rgba(239,68,68,0.07)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 8, padding: "0.5rem 0.875rem",
                        }}>
                          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.15rem" }}>Détention</div>
                          <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>{article.detention}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {article.tags && article.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.875rem" }}>
                      {article.tags.map(t => (
                        <button
                          key={t}
                          onClick={() => setSearch(t)}
                          style={{
                            fontSize: "0.7rem", padding: "0.2rem 0.55rem",
                            borderRadius: 999, background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-dim)", cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >#{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
