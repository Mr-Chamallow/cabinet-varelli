import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estFacturation, estStaff } from "@/lib/cabinetAcces";

// Tableau de bord d'accueil (employés) : RDV du jour, mes dossiers ouverts, factures et devis à suivre
const jourParis = (decalage = 0) => {
  const d = new Date(Date.now() + decalage * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(d); // YYYY-MM-DD
};

export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const aujourdhui = jourParis();
    const demain = jourParis(1);

    const [rdv, acces] = await Promise.all([
      db.from("cabinet_rdv").select("id,date_rdv,statut,client_nom,prestation,avocat_nom")
        .gte("date_rdv", `${aujourdhui}T00:00:00`).lt("date_rdv", `${demain}T00:00:00`)
        .not("statut", "in", "(annule,termine)").order("date_rdv", { ascending: true }),
      db.from("cabinet_dossier_acces").select("dossier_id").eq("avocat_discord_id", user.discord_id),
    ]);

    const ids = (acces.data || []).map((a: any) => a.dossier_id);
    const { data: dossiers } = ids.length
      ? await db.from("cabinet_dossiers").select("id,titre,client_nom").in("id", ids).eq("statut", "ouvert").order("created_at", { ascending: false }).limit(8)
      : { data: [] as any[] };

    let facturesRetard: any[] = [];
    let devisEnAttente = 0;
    if (estFacturation(user)) {
      const { data: retard } = await db.from("cabinet_factures").select("id,numero,client_nom,montant,date_echeance")
        .eq("statut", "en_attente").lt("date_echeance", aujourdhui).order("date_echeance", { ascending: true }).limit(8);
      facturesRetard = retard || [];
      const { count } = await db.from("cabinet_devis").select("id", { count: "exact", head: true }).eq("statut", "envoye");
      devisEnAttente = count || 0;
    }

    return NextResponse.json({ rdv: rdv.data || [], dossiers: dossiers || [], facturesRetard, devisEnAttente, date: aujourdhui });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
