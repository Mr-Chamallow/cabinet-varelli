// Calculs de comptabilité : commissions par employé, relevés, résumé mensuel
export const moisCourant = () => new Date().toISOString().slice(0, 7);

// Bornes d'un mois "AAAA-MM" en dates ISO (UTC)
export function fenetreMois(mois: string) {
  const [a, m] = mois.split("-").map(Number);
  const debut = new Date(Date.UTC(a, m - 1, 1));
  const fin = new Date(Date.UTC(a, m, 1));
  return { debut: debut.toISOString(), fin: fin.toISOString(), debutJour: debut.toISOString().slice(0, 10), finJour: fin.toISOString().slice(0, 10) };
}

export const ligneTotal = (l: any) => Math.round((Number(l?.quantite) || 0) * (Number(l?.prix) || 0));
export const commissionLigne = (l: any) => Math.round((ligneTotal(l) * (Number(l?.commission_pct) || 0)) / 100);

const somme = (liste: any[], f: (x: any) => number) => liste.reduce((s, x) => s + f(x), 0);

// Prestations d'une liste de factures soldées, groupées par employé
export function relevesDepuisFactures(factures: any[]) {
  const par: Record<string, { employe_discord_id: string; employe_nom: string; prestations: any[]; commission: number }> = {};
  for (const f of factures) {
    for (const l of (Array.isArray(f.lignes) ? f.lignes : [])) {
      if (!l?.employe_discord_id) continue;
      const id = l.employe_discord_id;
      par[id] = par[id] || { employe_discord_id: id, employe_nom: l.employe_nom || id, prestations: [], commission: 0 };
      const com = commissionLigne(l);
      par[id].prestations.push({ facture: f.numero, client: f.client_nom || "", description: l.description, total: ligneTotal(l), pct: Number(l.commission_pct) || 0, commission: com });
      par[id].commission += com;
    }
  }
  return par;
}

export function calculerResume(mois: string, d: { paiements: any[]; facturesMois: any[]; facturesToutes: any[]; depenses: any[]; versements: any[]; avoirs: any[] }) {
  const encaisse = somme(d.paiements, p => Number(p.montant) || 0);
  const parMode: Record<string, number> = {};
  for (const p of d.paiements) parMode[p.mode || "non précisé"] = (parMode[p.mode || "non précisé"] || 0) + (Number(p.montant) || 0);
  const depenses = somme(d.depenses, x => Number(x.montant) || 0);
  const tva = somme(d.facturesMois, f => (Number(f.montant) || 0) - (Number(f.sous_total) || 0));
  const relevesMois = relevesDepuisFactures(d.facturesMois);
  const relevesCumul = relevesDepuisFactures(d.facturesToutes);
  const commissions = somme(Object.values(relevesMois), r => r.commission);

  const ids = new Set<string>([...Object.keys(relevesMois), ...Object.keys(relevesCumul), ...d.versements.map((v: any) => v.employe_discord_id)]);
  const releves = [...ids].map(id => {
    const m = relevesMois[id];
    const c = relevesCumul[id];
    const versementsMois = somme(d.versements.filter((v: any) => v.employe_discord_id === id && String(v.date_versement).slice(0, 7) === mois), v => Number(v.montant) || 0);
    const versementsCumul = somme(d.versements.filter((v: any) => v.employe_discord_id === id), v => Number(v.montant) || 0);
    const nom = m?.employe_nom || c?.employe_nom || d.versements.find((v: any) => v.employe_discord_id === id)?.employe_nom || id;
    return {
      employe_discord_id: id,
      employe_nom: nom,
      prestations: m?.prestations || [],
      commissionMois: m?.commission || 0,
      versementsMois,
      commissionCumul: c?.commission || 0,
      versementsCumul,
      solde: (c?.commission || 0) - versementsCumul,
    };
  }).sort((a, b) => a.employe_nom.localeCompare(b.employe_nom));

  return {
    mois,
    encaisse,
    parMode,
    depenses,
    commissions,
    tva,
    resultatNet: encaisse - depenses - commissions,
    releves,
    avoirs: d.avoirs,
    depensesListe: d.depenses,
  };
}
