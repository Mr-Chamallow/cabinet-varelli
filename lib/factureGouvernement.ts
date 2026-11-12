import { fenetreSemaine } from "@/lib/compta";

// Ajoute n jours à une date "AAAA-MM-JJ"
export const addJours = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Numéro : FG-AAAA-MM-JJ (lundi de la semaine), puis FG-AAAA-MM-JJ-2, -3… si plusieurs factures la même semaine
async function numeroFactureGouv(db: any, lundi: string) {
  let numero = `FG-${lundi}`;
  let n = 1;
  while (true) {
    const { data } = await db.from("cabinet_factures_gouvernement").select("id").eq("numero", numero).maybeSingle();
    if (!data) return numero;
    n++;
    numero = `FG-${lundi}-${n}`;
  }
}

// Crée la facture de la semaine avec toutes les comparutions prises en charge pas encore facturées.
// Retourne null s'il n'y a rien à facturer.
export async function genererFactureGouvernement(db: any, lundi: string, auteur: string) {
  const { debutJour, finJour } = fenetreSemaine(lundi);
  const { data: ci, error } = await db.from("cabinet_comparutions")
    .select("id,date_audience,heure,tribunal,client_nom,chefs,avocat_nom,montant")
    .eq("statut", "prise_en_charge").is("facture_gouv_id", null)
    .gte("date_audience", debutJour).lt("date_audience", finJour)
    .order("date_audience");
  if (error) throw new Error(error.message);
  if (!ci?.length) return null;

  const total = ci.reduce((s: number, c: any) => s + (Number(c.montant) || 0), 0);
  const numero = await numeroFactureGouv(db, lundi);
  const detail = ci.map((c: any) => ({
    id: c.id, date: c.date_audience, heure: c.heure, tribunal: c.tribunal, client: c.client_nom,
    chefs: c.chefs, avocat: c.avocat_nom, honoraire: Number(c.montant) || 0,
  }));
  const { data: facture, error: e2 } = await db.from("cabinet_factures_gouvernement")
    .insert([{ numero, semaine: lundi, nb_comparutions: ci.length, total, detail, cree_par: auteur }]).select("*").single();
  if (e2) throw new Error(e2.message);
  await db.from("cabinet_comparutions").update({ facture_gouv_id: facture.id }).in("id", ci.map((c: any) => c.id));
  return facture;
}
