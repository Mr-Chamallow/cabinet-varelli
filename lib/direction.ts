// Inventaire (ajustements de stock) reserve a la Direction : CEO et COO.
export const estDirection = (role?: string | null) => /^(CEO|COO|Associé \/ Patron)/i.test(role || "");
export const RAISONS_INVENTAIRE = ["Erreur de comptage", "Perte", "Saisie", "Casse", "Vol"];
