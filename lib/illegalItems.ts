// Listes de suggestions pour les stocks (saisie libre toujours possible : un nom inconnu crée un nouvel article).
export interface Sugg { nom: string; emoji: string }
export const ILLEGAL_ITEMS: Sugg[] = [
  { nom: "Boîtier de piratage", emoji: "📟" }, { nom: "Boîtier Darknet", emoji: "🕸️" }, { nom: "Carte Fleeca", emoji: "💳" },
  { nom: "Carte prépayée", emoji: "💳" }, { nom: "Encodeur", emoji: "🔌" }, { nom: "Disjoncteur modifié", emoji: "⚡" },
  { nom: "Fausse plaque d'immatriculation", emoji: "🪪" }, { nom: "Outil de crochetage", emoji: "🗝️" }, { nom: "Serflex", emoji: "🔗" },
  { nom: "Kevlar", emoji: "🦺" },
];
export const DRUG_COMPONENTS: Sugg[] = [
  "Graine de strawberry", "Fertilisant", "Kit de fabrication de meth", "Gaz BZ", "Poudre à canon", "B-Magic", "Acide sulfurique",
  "Feuilles de salvia", "Branche de cannabis", "Pavot", "Feuilles de coca", "Phosphore rouge", "Pseudoéphédrine", "Ammoniaque anhydre",
  "Éther", "Lithium", "Prométhazine", "Xylazine", "Belladone", "Datura", "Salvia", "Mexicana", "Blacktrip", "Spore X", "Oyster rouge",
  "Oyster bleu", "Amanita rouge", "Amanita vert", "Psilocybe vert", "Psilocybe rouge", "Psilocybe violet", "Moisissures spectrales",
  "Spores de veloceps", "Red fang", "Ma-huang", "Ladanum", "Acide acétylsalicylique",
].map(nom => ({ nom, emoji: "🧪" }));
export const SUGGESTIONS: Record<string, Sugg[]> = {
  objet_illegal: [...ILLEGAL_ITEMS, ...DRUG_COMPONENTS],
  composant: DRUG_COMPONENTS,
  gilet: [{ nom: "Kevlar", emoji: "🦺" }],
};
