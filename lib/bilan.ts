// Bilan d'une période : chiffres du cabinet (factures, dossiers, rendez-vous, votes, plaintes, retards)
import { montant } from "@/lib/montant";

const somme = (liste: any[], champ = "montant") => Math.round(liste.reduce((s, x) => s + Number(x[champ] || 0), 0));

export async function calculerBilan(db: any, depuis: string, jusque: string) {
  const [fac, paye, dos, rdv, votes, plaintes, enAttente] = await Promise.all([
    db.from("cabinet_factures").select("montant,created_at").gte("created_at", depuis).lt("created_at", jusque),
    db.from("cabinet_factures").select("montant,payee_at").eq("statut", "payee").gte("payee_at", depuis).lt("payee_at", jusque),
    db.from("cabinet_dossiers").select("statut,created_at").gte("created_at", depuis).lt("created_at", jusque),
    db.from("cabinet_rdv").select("statut,date_rdv").gte("date_rdv", depuis).lt("date_rdv", jusque),
    db.from("cabinet_votes").select("statut,resultat,created_at").gte("created_at", depuis).lt("created_at", jusque),
    db.from("cabinet_plaintes").select("id", { count: "exact", head: true }).gte("created_at", depuis).lt("created_at", jusque),
    db.from("cabinet_factures").select("montant,date_echeance").eq("statut", "en_attente"),
  ]);
  const F = fac.data || [], P = paye.data || [], D = dos.data || [], R = rdv.data || [], V = votes.data || [], A = enAttente.data || [];
  const aujourdHui = new Date().toISOString().slice(0, 10);
  return {
    factures: { emises: F.length, montantEmis: somme(F), encaissees: P.length, encaisse: somme(P), enAttente: A.length, montantEnAttente: somme(A) },
    retards: { nombre: A.filter((f: any) => f.date_echeance && f.date_echeance < aujourdHui).length },
    dossiers: { ouverts: D.filter((d: any) => d.statut === "ouvert").length, crees: D.length },
    rdv: { total: R.length, confirmes: R.filter((r: any) => r.statut === "confirme" || r.statut === "termine").length, annules: R.filter((r: any) => r.statut === "annule").length },
    votes: { lances: V.length, adoptes: V.filter((v: any) => v.resultat === "adopte").length, rejetes: V.filter((v: any) => v.resultat === "rejete").length },
    plaintes: { nouvelles: plaintes.count || 0 },
  };
}

// Résumé texte pour Discord (sans emoji, sans tiret cadratin)
export function resumeBilan(b: any, libelle: string) {
  return [
    `**Bilan ${libelle}**`,
    `Factures émises : ${b.factures.emises} (${montant(b.factures.montantEmis)})`,
    `Encaissé : ${montant(b.factures.encaisse)} sur ${b.factures.encaissees} facture(s) réglée(s)`,
    `En attente : ${b.factures.enAttente} facture(s), ${montant(b.factures.montantEnAttente)}, dont ${b.retards.nombre} en retard`,
    `Dossiers ouverts sur la période : ${b.dossiers.crees} (${b.dossiers.ouverts} encore ouverts)`,
    `Rendez-vous : ${b.rdv.total} (${b.rdv.confirmes} confirmés, ${b.rdv.annules} annulés)`,
    `Votes : ${b.votes.lances} lancé(s), ${b.votes.adoptes} adopté(s), ${b.votes.rejetes} rejeté(s)`,
    `Plaintes internes : ${b.plaintes.nouvelles}`,
  ].join("\n");
}
