// Calculs de comptabilité : commissions par employé, relevés, résumé hebdomadaire
import { weekStartOf } from "@/lib/weekStart";

// Semaine courante : date du LUNDI au format AAAA-MM-JJ (heure de Paris)
export const semaineCourante = () => weekStartOf(new Date());

// Bornes d'une semaine à partir de son lundi "AAAA-MM-JJ" (du lundi inclus au lundi suivant exclu)
export function fenetreSemaine(lundi: string) {
  const debut = new Date(lundi + "T00:00:00Z");
  const fin = new Date(debut.getTime() + 7 * 86400000);
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

// Comparutions immédiates : payées par le gouvernement, donc HORS encaissements clients et hors résultat net.
// Leur montant est ajouté au salaire (solde) de l'avocat qui les a prises en charge.
export function calculerResume(semaine: string, d: { paiements: any[]; facturesMois: any[]; facturesToutes: any[]; depenses: any[]; versements: any[]; avoirs: any[]; comparutions?: any[] }) {
  const { debutJour, finJour } = fenetreSemaine(semaine);
  const encaisse = somme(d.paiements, p => Number(p.montant) || 0);
  const parMode: Record<string, number> = {};
  for (const p of d.paiements) parMode[p.mode || "non précisé"] = (parMode[p.mode || "non précisé"] || 0) + (Number(p.montant) || 0);
  const depenses = somme(d.depenses, x => Number(x.montant) || 0);
  const tva = somme(d.facturesMois, f => (Number(f.montant) || 0) - (Number(f.sous_total) || 0));
  const relevesMois = relevesDepuisFactures(d.facturesMois);
  const relevesCumul = relevesDepuisFactures(d.facturesToutes);
  const commissions = somme(Object.values(relevesMois), r => r.commission);

  const ci = (d.comparutions || []).filter((c: any) => c.statut === "prise_en_charge");
  const ciSemaineListe = ci.filter((c: any) => String(c.date_audience).slice(0, 10) >= debutJour && String(c.date_audience).slice(0, 10) < finJour);
  const ciSemaine = somme(ciSemaineListe, c => Number(c.montant) || 0);

  const dansSemaine = (v: any) => String(v.date_versement).slice(0, 10) >= debutJour && String(v.date_versement).slice(0, 10) < finJour;

  const ids = new Set<string>([...Object.keys(relevesMois), ...Object.keys(relevesCumul), ...d.versements.map((v: any) => v.employe_discord_id), ...ci.map((c: any) => c.avocat_discord_id).filter(Boolean)]);
  const releves = [...ids].map(id => {
    const m = relevesMois[id];
    const c = relevesCumul[id];
    const versementsSemaine = somme(d.versements.filter((v: any) => v.employe_discord_id === id && dansSemaine(v)), v => Number(v.montant) || 0);
    const versementsCumul = somme(d.versements.filter((v: any) => v.employe_discord_id === id), v => Number(v.montant) || 0);
    // Part de l'avocat (pourcentage selon son grade), pas le montant total payé par le gouvernement
    const ciSemaineAv = somme(ciSemaineListe.filter((x: any) => x.avocat_discord_id === id), x => Number(x.part_avocat) || 0);
    const ciCumulAv = somme(ci.filter((x: any) => x.avocat_discord_id === id), x => Number(x.part_avocat) || 0);
    const nom = m?.employe_nom || c?.employe_nom || d.versements.find((v: any) => v.employe_discord_id === id)?.employe_nom || ci.find((x: any) => x.avocat_discord_id === id)?.avocat_nom || id;
    return {
      employe_discord_id: id,
      employe_nom: nom,
      prestations: m?.prestations || [],
      commissionSemaine: m?.commission || 0,
      versementsSemaine,
      commissionCumul: c?.commission || 0,
      versementsCumul,
      ciSemaine: ciSemaineAv,
      ciCumul: ciCumulAv,
      solde: (c?.commission || 0) + ciCumulAv - versementsCumul,
    };
  }).sort((a, b) => a.employe_nom.localeCompare(b.employe_nom));

  return {
    semaine,
    encaisse,
    parMode,
    depenses,
    commissions,
    tva,
    resultatNet: encaisse - depenses - commissions,
    ciSemaine,
    ciSemaineListe,
    releves,
    avoirs: d.avoirs,
    depensesListe: d.depenses,
  };
}
