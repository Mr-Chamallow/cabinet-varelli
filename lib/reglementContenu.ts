// Contenu du module Reglement (reformule a partir des pages FlashBackFA, vu le 11/10/2026).
// Pas d'export Next ici : ce fichier est importe par la page /obsidian/reglement et l'organigramme.
import { REGLES_LIENS } from "@/lib/regles";

export interface Section { id: string; icon: string; titre: string; source: keyof typeof REGLES_LIENS; points: string[] }

export const SECTIONS: Section[] = [
  { id: "effectifs", icon: "👥", titre: "Effectifs et recrutement", source: "gangOrga", points: [
    "Organisation : 20 membres maximum en OP, 25 maximum sur Discord (gang : 25 et 30).",
    "Wipe obligatoire pour rejoindre un groupe officiel (pas pour le quitter). Pas de même nom sur plusieurs personnages, pas deux groupes officiels avec le même personnage.",
    "Délai interorga : 4 jours après un départ ou une exclusion, et 50 heures de jeu minimum pour rejoindre un groupe.",
    "Exceptions au délai : projet accepté sous 3 jours, wipe de projet par le staff ou un lead, ancien membre après 1 mois de projet, exclusion jugée injuste.",
    "Pas de demande F7 et aucun recrutement pendant une guerre validée par ticket. Pas de revendication sans recrutement via F7.",
    "Toujours vérifier l'historique des sanctions avant de recruter.",
    "Exclure un membre : scène RP de kick puis retrait du F7. Un lead ne peut plus demander de KP wipe.",
    "Abandon de projet par un lead principal ou wipe anticipé : 2 mois de BL pour les leads. Double projet : BL de 1 à 3 mois.",
    "Armes lourdes : réservées aux joueurs ayant 200 heures de jeu minimum, le donneur est responsable.",
  ]},
  { id: "dossier", icon: "📋", titre: "Dossier de création", source: "dossier", points: [
    "18 ans minimum pour créer une organisation. Dossier envoyé en ticket au format Google Doc ou Google Slides, validé par les référents illégal.",
    "Contenu obligatoire : nom du projet, background, âge et Discord de tous les membres (15 minimum, avec ID unique et ID Discord), objectifs, expérience illégale des leads, apport au serveur, véhicules souhaités, armes souhaitées, business souhaité, vision du RP illégal.",
    "Passage gang vers organisation : background du groupe, objectifs et ambitions, pourquoi devenir organisation, motivation, événements, réussites RP, apports au serveur.",
    "Aucun délai de traitement n'est indiqué sur la page.",
  ]},
  { id: "drogues", icon: "🧪", titre: "Drogues", source: "illegal", points: [
    "Organisations : production de Cocaïne, Tranq, Meth Bleue, Mexicana. Production limitée à 3 drogues, revendication limitée à 2.",
    "Nous : production Cocaïne, Tranq, Mexicana ; revendication Cocaïne et Mexicana (réglable plus bas).",
    "Récolte, production et transfert : uniquement dans les véhicules autorisés du catalogue illégal.",
    "Les indépendants et petites frappes peuvent collecter des matières premières pour les groupes officiels, contre rémunération.",
    "Vente aux PNJ : les organisations ne vendent dans la rue que des drogues liées à des événements. Interdit à moto, vélo, quad et en zone safe.",
    "Transactions : interruption possible seulement si clairement vue ; attaquer une cargaison exige un conflit préalable ; pas de véhicule de location ; interdit dans une instance, près d'un quartier, d'un entrepôt, d'un laboratoire ou d'une zone safe.",
    "Fours illégaux : 50 unités maximum par personne.",
  ]},
  { id: "labos", icon: "🏭", titre: "Laboratoires", source: "gangOrga", points: [
    "Coût : 1,5 M$ par laboratoire, 750 K$ pour déplacer un laboratoire public.",
    "Laboratoires privés réservés aux revendicateurs. Par revendicateur : 1 privé, 1 public sud et 1 public nord par drogue revendiquée.",
    "Distance minimale de 3 km par rapport aux entrepôts et au QG, pas de garage à proximité.",
    "Achat possible uniquement après démantèlement par la police, vente entre joueurs interdite.",
    "Véhicules : ceux des transactions et les 4x4/SUV, sauf Dune, Kalahari, Outlaw, Trophytruck, Vagrant, Verus, Winky, Astron, Habanero, Radi, Serrano, Toros, Rebla, Novak, Jubilee, Gresley H.",
  ]},
  { id: "territoires", icon: "🗺️", titre: "Territoires, zones et taxes", source: "gangOrga", points: [
    "Les organisations gèrent les territoires et sont les seules à pouvoir se les disputer. Les gangs gèrent les zones de vente.",
    "Un gang qui vend 750 unités dans une zone contrôlée peut la prendre (si personne ne se déclare sous 24 h). Un gang peut aussi gérer une zone d'organisation moyennant une taxe.",
    "La guerre de territoire (GDT) est obligatoire pour revendiquer une zone. Pas de taxe pendant une guerre.",
    "Cooldowns : 5 jours après la perte d'une zone, 7 jours après la perte d'un business.",
    "Taxe sur la drogue plafonnée à 80% du prix de revente par tonne. Taxe de revendication d'un point de récolte plafonnée à 50.000 $ par semaine.",
  ]},
  { id: "armes", icon: "🔫", titre: "Armes et kevlar", source: "illegal", points: [
    "Deux armes maximum sur soi : une lourde ou automatique et une de poing. Les armes de boutique ne se portent pas en public.",
    "Interdit de vendre des armes automatiques ou lourdes aux petites frappes et aux indépendants. Un indépendant ne peut pas acquérir d'armes de catégorie gang ou organisation.",
    "Accessoires : aucun pour les indépendants, tous sauf chargeurs pour les petites frappes, tous pour gangs et organisations.",
    "Kevlar : réservé aux organisations, 5 pièces maximum, une par joueur, doit rester visible. Pas de vente de kevlar ni d'accessoires d'armes aux indépendants.",
    "GPB : vente uniquement aux organisations et gangs, prix minimum 150.000 $ (propre ou sale), supplément de 20% maximum possible en sale. Les organisations gun lead ne peuvent plus acheter de GPB à un gang.",
    "Braquage d'arme : le gun lead peut braquer pour le type d'arme qu'il revendique, loot limité à 50% de l'inventaire (nombre impair inférieur), interdit si la cible n'a qu'une arme.",
    "Straff interdit, sauf guerres ouvertes, CVC, GDT, PVP et événements PVP validés par le staff.",
  ]},
  { id: "braquages", icon: "🏦", titre: "Braquages et Pacific Bank", source: "illegal", points: [
    "Pacific Bank : en semaine de 18h à minuit, le week-end de 14h à 2h, sans dossier.",
    "Chaque groupe avec F7 est limité en nombre et en type de braquages.",
    "Mules : uniquement des véhicules de la catégorie VANS, interdites pour les petits actes comme la vente de drogue. Le timer démarre à la fin du braquage.",
    "Interdits en braquage : armes lourdes ou automatiques, supersportives, véhicules d'entreprise ou de location, motos et bateaux (sauf négociation), plongée.",
    "Butin autorisé : 50% de la cargaison. Amende maximale : 75% de la valeur vendue.",
    "Plateforme pétrolière : une fois par semaine et par groupe.",
    "Nouveaux groupes : interdiction d'intervenir sur leurs transactions pendant 2 semaines.",
  ]},
  { id: "convois", icon: "🚚", titre: "Convois", source: "gangOrga", points: [
    "Organisation : 6 véhicules + 1 moto par convoi. Maximum 1 SUV et 1 Offroad par convoi.",
    "Transactions : uniquement des vans (hors Guardian, Bison, Bobcat XL, Burrito).",
  ]},
  { id: "blanchiment", icon: "💵", titre: "Blanchiment", source: "illegal", points: [
    "Réservé aux entreprises. Les gangs et organisations peuvent traiter directement avec une entreprise.",
    "Le blanchiment ne peut faire l'objet d'aucune revendication.",
    "Un groupe illégal qui possède une entreprise ne peut pas blanchir son propre argent. L'entreprise nous sera imposée par le staff : à clarifier en vocal.",
  ]},
  { id: "otages", icon: "🪢", titre: "Otages et rançons", source: "illegal", points: [
    "Rançon : 5.000 $ maximum par otage, 15.000 $ maximum par prise d'otages.",
    "Conditions : conflit RP ou scène de braquage, revendication obligatoire, pas en zone safe.",
    "Pas de prise d'otage pendant ou après un rendez-vous, sauf après 5 minutes et à plus de 2 km du lieu.",
    "Missionner un autre groupe pour une prise d'otage : seulement entre groupes officiels, mission payée avant, groupe missionné du même niveau hiérarchique que la cible.",
  ]},
  { id: "guerre", icon: "⚔️", titre: "Guerre", source: "gangOrga", points: [
    "Guerre ouverte : 5 véhicules + 1 moto pour une organisation, pas de gros CVC.",
    "Armes en guerre : 3 lourdes, 2 pistolets mitrailleurs, armes de poing et légères illimitées. UMP ou fusil lourd : un seul par guerre, 100 munitions maximum.",
    "Rançon en guerre : jusqu'à 50.000 $ pour un lead, 30.000 $ pour un membre. Fusillades autorisées après au moins 3 prises d'otage ou en cas de no-fear avéré.",
    "Reddition lors d'un rendez-vous en jeu, puis trêve de 7 jours.",
    "Drive-by : uniquement en guerre ouverte ou conflit existant, entre 20h et 01h, 2 maximum par soirée, 12 h d'écart. Interdit aux organisations en direct (via un gang ou un MC).",
  ]},
  { id: "vehicules", icon: "🚗", titre: "Véhicules", source: "catalogue", points: [
    "Supersportives autorisées sauf dans les scènes avec police (exception : grosses scènes comme Human Labs, Pacific Bank, trames). Une seule par scène avec police, interdites dans les petites scènes (ATM, Fleeca, armurerie).",
    "Certains modèles sont interdits pour toute action illégale (voir la liste dans le Garage).",
    "Le catalogue indique pour chaque modèle les groupes à qui il est interdit (Gang, Organisation, MC) ou le lore imposé.",
    "Les véhicules doivent correspondre au lore, à l'ethnie et au dossier RP. Notre lore est mixte : on évite les modèles réservés à un lore précis.",
  ]},
  { id: "alliances", icon: "🤝", titre: "Alliances", source: "illegal", points: [
    "Interdites, sauf pour des raisons commerciales. Le partage d'informations est autorisé.",
    "Une seule alliance par histoire, pas de changement pendant la confrontation, pas de groupe supplémentaire dans une scène déjà alliée.",
    "Contre la police : deux groupes maximum.",
  ]},
  { id: "evenements", icon: "🎪", titre: "Événements", source: "gangOrga", points: [
    "2 événements par mois pour les gangs et organisations, sans récompense du staff. Notre calendrier (audit, convoi, enchères, tribunal ou alerte) les couvre.",
  ]},
  { id: "sanctions", icon: "🚫", titre: "Sanctions et divers", source: "illegal", points: [
    "Tout transfert d'argent ou d'objet illégal vu par la modération : ban et ban organisation.",
    "Fuite d'information à la DOA interdite sauf cas précis : RP du groupe, warn, ban ou blacklist possibles.",
    "Tenues cohérentes avec le personnage, gilets pare-balles factices interdits.",
    "Ne pas prendre pour argent comptant une info donnée par un modérateur : la remonter à un Gestionnaire Modération ou un Responsable.",
  ]},
];

// Qui fait quoi chez Obsidian (valide avec le fondateur le 11/10/2026)
export const MISSIONS: Record<string, { titre: string; icon: string; missions: string[] }> = {
  directoire: { titre: "Directoire (CEO / COO)", icon: "👑", missions: [
    "CEO : lead, visage public, tranche les litiges, juge suprême du Tribunal de l'Ombre.",
    "COO : co-lead, contacts avec les groupes, convois, enchères, calendrier des événements.",
    "Dossier staff, vocal avec les référents, décisions de recrutement finales.",
  ]},
  juridique: { titre: "Pôle Juridique", icon: "⚖️", missions: [
    "Médiation dans toute situation entre groupes.",
    "Gestion juridique : pactes d'Obsidienne, contrats, audits de conformité.",
    "Tribunal de l'Ombre : instruction, acte d'accusation, avocat d'office.",
    "Veille du règlement FlashBackFA et vérification des conditions de recrutement (sanctions, délai interorga).",
    "Enquête et renseignement : fiches, tableau d'enquête.",
  ]},
  logistique: { titre: "Pôle Logistique", icon: "📦", missions: [
    "Logistique générale : hangars, convois, garage et véhicules autorisés.",
    "Gestion des stocks, achats et fournisseurs.",
    "Comptabilité, paie, taxes encaissées, blanchiment via l'entreprise imposée.",
    "Drogues : production (Cocaïne, Tranq, Mexicana), laboratoires, matières premières, transactions.",
  ]},
  securite: { titre: "Pôle Sécurité", icon: "🛡️", missions: [
    "Armes, munitions et kevlar (5 pièces maximum, une par joueur).",
    "Sécurité générale : gardes des hangars, escortes, protection du Directoire.",
    "Braquages et prises d'otages dans le respect du règlement (rançons plafonnées).",
    "Défense légitime uniquement : pas de guerre offensive, riposte par le Tribunal et les sanctions économiques.",
  ]},
};
