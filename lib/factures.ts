// Calculs, numérotation et historique des factures (côté serveur)
export type Ligne = { description: string; quantite: number; prix: number };

export function nettoyerLignes(brutes: any): Ligne[] {
  return (Array.isArray(brutes) ? brutes : [])
    .map((l: any) => ({
      description: String(l?.description || "").trim().slice(0, 200),
      quantite: Number(l?.quantite) || 0,
      prix: Number(l?.prix) || 0,
    }))
    .filter((l: Ligne) => l.description && l.quantite > 0 && l.prix >= 0)
    .slice(0, 50);
}

export function calculer(lignes: Ligne[], tvaTaux: number) {
  const sousTotal = Math.round(lignes.reduce((s, l) => s + l.quantite * l.prix, 0) * 100) / 100;
  const tva = Math.round((sousTotal * tvaTaux) / 100 * 100) / 100;
  const total = Math.round((sousTotal + tva) * 100) / 100;
  return { sousTotal, tva, total };
}

// Numéro unique du type FAC-AAAA-0001, remis à zéro chaque année
export async function numeroFacture(db: any): Promise<string> {
  const prefixe = `FAC-${new Date().getFullYear()}-`;
  const { data } = await db.from("cabinet_factures").select("numero").like("numero", `${prefixe}%`).order("numero", { ascending: false }).limit(1);
  const dernier = data?.[0]?.numero ? parseInt(String(data[0].numero).slice(prefixe.length), 10) : 0;
  return prefixe + String((isNaN(dernier) ? 0 : dernier) + 1).padStart(4, "0");
}

export async function historiser(db: any, factureId: string, action: string, details: string, auteur: string) {
  await db.from("cabinet_factures_historique").insert([{ facture_id: factureId, action, details, auteur_nom: auteur }]);
}
