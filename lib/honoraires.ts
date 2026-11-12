// Barème des honoraires d'une comparution immédiate, selon la catégorie de l'infraction (Livret des peines)
export const HONORAIRES: Record<string, number> = {
  "0": 3000,  // Infraction non pénale
  "1": 7000,  // Infraction mineure
  "2": 10000, // Délit mineur
  "3": 15000, // Délit
  "4": 20000, // Crime
  "5": 25000, // Crime majeur
};

// categorie_id du Livret commence par son numéro, ex : "3 - Délit"
export const honorairePour = (categorieId: string) => HONORAIRES[(categorieId || "").trim().charAt(0)] ?? 0;
