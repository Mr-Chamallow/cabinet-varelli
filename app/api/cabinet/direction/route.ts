import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { estTableauBord, topicPour } from "@/lib/cabinetAcces";

// Tableau de bord direction : chiffres du jour, dossiers, votes, plaintes, facturation
const jourParis = (d: string | Date) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

export async function GET() {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estTableauBord(r.user)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
    const db = r.supabaseAdmin;
    const maintenant = Date.now();
    const aujourdHui = jourParis(new Date());

    const [dossiers, rdv, votes, plaintes, factures] = await Promise.all([
      db.from("cabinet_dossiers").select("statut"),
      db.from("cabinet_rdv").select("id,client_nom,motif,date_rdv,statut,avocat_nom")
        .gte("date_rdv", new Date(maintenant - 86400000).toISOString())
        .lte("date_rdv", new Date(maintenant + 2 * 86400000).toISOString())
        .order("date_rdv", { ascending: true }),
      db.from("cabinet_votes").select("id,titre,created_at,cabinet_votes_reponses(choix)").eq("statut", "ouvert").order("created_at", { ascending: false }),
      db.from("cabinet_plaintes").select("id", { count: "exact", head: true }).eq("statut", "ouvert"),
      db.from("cabinet_factures").select("montant,statut,date_echeance"),
    ]);

    const lignesDossiers = dossiers.data || [];
    const lignesFactures = factures.data || [];
    const rdvJour = (rdv.data || []).filter((x: any) => jourParis(x.date_rdv) === aujourdHui && x.statut !== "annule");
    const votesOuverts = (votes.data || []).map((v: any) => {
      const reps = v.cabinet_votes_reponses || [];
      return { id: v.id, titre: v.titre, pour: reps.filter((x: any) => x.choix === "pour").length, contre: reps.filter((x: any) => x.choix === "contre").length };
    });

    return NextResponse.json({
      dossiers: {
        ouvert: lignesDossiers.filter((d: any) => d.statut === "ouvert").length,
        ferme: lignesDossiers.filter((d: any) => d.statut === "ferme").length,
        archive: lignesDossiers.filter((d: any) => d.statut === "archive").length,
      },
      rdvJour,
      votesOuverts,
      plaintesOuvertes: plaintes.count || 0,
      factures: {
        encaisse: lignesFactures.filter((f: any) => f.statut === "payee").reduce((s: number, f: any) => s + Number(f.montant || 0), 0),
        attente: lignesFactures.filter((f: any) => f.statut === "en_attente").reduce((s: number, f: any) => s + Number(f.montant || 0), 0),
        retard: lignesFactures.filter((f: any) => f.statut === "en_attente" && f.date_echeance && f.date_echeance < aujourdHui).length,
      },
      topics: { votes: topicPour("liste:votes"), plaintes: topicPour("liste:plaintes") },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
