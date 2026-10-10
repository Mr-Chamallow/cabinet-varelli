// Suggestions pour la saisie d'un nom de stock (saisie libre toujours possible : un nom inconnu crée un nouvel article).
export interface Sugg { nom: string; emoji: string; categorie: string }
const I = (nom: string, emoji: string, categorie = "autre"): Sugg => ({ nom, emoji, categorie });
export const ILLEGAL_ITEMS: Sugg[] = [
  I("Boîtier de piratage", "📟"), I("Boîtier Darknet", "🕸️"), I("Carte Fleeca", "💳"), I("Carte prépayée", "💳"), I("Encodeur", "🔌"),
  I("Disjoncteur modifié", "⚡"), I("Fausse plaque d'immatriculation", "🪪"), I("Outil de crochetage", "🗝️"), I("Serflex", "🔗"), I("Kevlar", "🦺", "gilet"),
];
export const DRUG_COMPONENTS: Sugg[] = [
  "Graine de strawberry", "Fertilisant", "Kit de fabrication de meth", "Gaz BZ", "Poudre à canon", "B-Magic", "Acide sulfurique",
  "Feuilles de salvia", "Branche de cannabis", "Pavot", "Feuilles de coca", "Phosphore rouge", "Pseudoéphédrine", "Ammoniaque anhydre",
  "Éther", "Lithium", "Prométhazine", "Xylazine", "Belladone", "Datura", "Salvia", "Mexicana", "Blacktrip", "Spore X", "Oyster rouge",
  "Oyster bleu", "Amanita rouge", "Amanita vert", "Psilocybe vert", "Psilocybe rouge", "Psilocybe violet", "Moisissures spectrales",
  "Spores de veloceps", "Red fang", "Ma-huang", "Ladanum", "Acide acétylsalicylique",
].map(n => I(n, "🧪", "composant"));
export const ALL_SUGG: Sugg[] = [...ILLEGAL_ITEMS, ...DRUG_COMPONENTS].sort((a, b) => a.nom.localeCompare(b.nom));
