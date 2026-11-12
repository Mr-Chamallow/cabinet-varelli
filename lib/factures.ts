// Calculs, numérotation et historique des factures (côté serveur)
export type Ligne = {
  description: string;
  quantite: number;
  prix: number;
  employe_discord_id?: string | null;   // avocat ou employé qui a réalisé la prestation
  employe_nom?: string | null;
  commission_pct?: number;              // % de commission pour cet employé sur cette ligne
};

export function nettoyerLignes(brutes: any): Ligne[] {
  return (Array.isArray(brutes) ? brutes : [])
    .map((l: any) => ({
      description: String(l?.description || "").trim().slice(0, 200),
      quantite: Math.round(Number(l?.quantite)) || 0,
      prix: Math.round(Number(l?.prix)) || 0,
      employe_discord_id: l?.employe_discord_id ? String(l.employe_discord_id).slice(0, 64) : null,
      employe_nom: l?.employe_nom ? String(l.employe_nom).slice(0, 80) : null,
      commission_pct: Math.min(Math.max(Number(l?.commission_pct) || 0, 0), 100),
    }))
    .filter((l: Ligne) => l.description && l.quantite > 0 && l.prix >= 0)
    .slice(0, 50);
}

export function calculer(lignes: Ligne[], tvaTaux: number) {
  // Dollars entiers : tout est arrondi à l'unité
  const sousTotal = Math.round(lignes.reduce((s, l) => s + l.quantite * l.prix, 0));
  const tva = Math.round((sousTotal * tvaTaux) / 100);
  const total = sousTotal + tva;
  return { sousTotal, tva, total };
}

// Numéro unique PREFIXE-AAAA-0001, remis à zéro chaque année
export async function numeroDoc(db: any, table: string, colonne: string, prefixeType: string): Promise<string> {
  const prefixe = `${prefixeType}-${new Date().getFullYear()}-`;
  const { data } = await db.from(table).select(colonne).like(colonne, `${prefixe}%`).order(colonne, { ascending: false }).limit(1);
  const dernier = data?.[0]?.[colonne] ? parseInt(String(data[0][colonne]).slice(prefixe.length), 10) : 0;
  return prefixe + String((isNaN(dernier) ? 0 : dernier) + 1).padStart(4, "0");
}

export const numeroFacture = (db: any) => numeroDoc(db, "cabinet_factures", "numero", "FAC");
export const numeroAvoir = (db: any) => numeroDoc(db, "cabinet_avoirs", "numero", "AV");
export const numeroDevis = (db: any) => numeroDoc(db, "cabinet_devis", "numero", "DE");

export async function historiser(db: any, factureId: string, action: string, details: string, auteur: string) {
  await db.from("cabinet_factures_historique").insert([{ facture_id: factureId, action, details, auteur_nom: auteur }]);
}
