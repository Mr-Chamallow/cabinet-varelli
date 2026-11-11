// Montants du cabinet : dollars, sans décimales (ex : 70 000 $)
export function montant(n: number | string | null | undefined): string {
  const v = Math.round(Number(n) || 0);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " $";
}

// Extrait le montant d'un tarif écrit en texte ("70 000 $" -> 70000). null si pas de chiffre ("Sur devis").
export function prixDepuisTexte(texte: string | null | undefined): number | null {
  if (!texte) return null;
  const m = String(texte).replace(/\s/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}
