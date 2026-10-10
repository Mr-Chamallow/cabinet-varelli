// Suggestions pour la saisie d'un nom de stock (saisie libre toujours possible : un nom inconnu crée un nouvel article).
export interface Sugg { nom: string; emoji: string; categorie: string }
const I = (nom: string, emoji: string, categorie = "objet illégal"): Sugg => ({ nom, emoji, categorie });
export const ILLEGAL_ITEMS: Sugg[] = [
  I("Boîtier de piratage", "📟"), I("Boîtier Darknet", "🕸️"), I("Carte Fleeca", "💳"), I("Carte prépayée", "💳"), I("Encodeur", "🔌"),
  I("Disjoncteur modifié", "⚡"), I("Fausse plaque d'immatriculation", "🪪"), I("Outil de crochetage", "🗝️"), I("Serflex", "🔗"), I("Kevlar", "🦺", "kev"),
];
export const DRUG_COMPONENTS: Sugg[] = [
  "Graine de strawberry", "Fertilisant", "Kit de fabrication de meth", "Gaz BZ", "Poudre à canon", "B-Magic", "Acide sulfurique",
  "Feuilles de salvia", "Branche de cannabis", "Pavot", "Feuilles de coca", "Phosphore rouge", "Pseudoéphédrine", "Ammoniaque anhydre",
  "Éther", "Lithium", "Prométhazine", "Xylazine", "Belladone", "Datura", "Salvia", "Mexicana", "Blacktrip", "Spore X", "Oyster rouge",
  "Oyster bleu", "Amanita rouge", "Amanita vert", "Psilocybe vert", "Psilocybe rouge", "Psilocybe violet", "Moisissures spectrales",
  "Spores de veloceps", "Red fang", "Ma-huang", "Ladanum", "Acide acétylsalicylique",
].map(n => I(n, "🧪", "composant"));
// Explosifs recensés dans le code pénal (possession / fabrication).
export const EXPLOSIFS: Sugg[] = [
  I("Cocktail molotov", "🍾", "explosif"), I("Charge thermite", "💥", "explosif"), I("Grenade lacrymogène", "💨", "explosif"),
  I("Grenade", "💣", "explosif"), I("Bombe collante", "💣", "explosif"), I("Drone explosif", "🛸", "explosif"),
];
// Tags proposés par défaut (un tag inconnu tapé dans le formulaire est créé automatiquement).
export const DEFAULT_TAGS = ["drogue", "arme", "munition", "accessoire", "explosif", "kev", "composant", "objet illégal", "objet légal", "autre"];
export const ALL_SUGG: Sugg[] = [...ILLEGAL_ITEMS, ...EXPLOSIFS, ...DRUG_COMPONENTS].sort((a, b) => a.nom.localeCompare(b.nom));
