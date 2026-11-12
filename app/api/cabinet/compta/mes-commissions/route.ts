import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { fenetreMois, moisCourant, relevesDepuisFactures } from "@/lib/compta";

// Espace employé : uniquement ses propres prestations, commissions et versements (pas de données compta).
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const moi = (r.user as any).discord_id;
    const params = new URL(req.url).searchParams;
    const mois = /^\d{4}-\d{2}$/.test(params.get("mois") || "") ? params.get("mois")! : moisCourant();
    const { debut, fin } = fenetreMois(mois);

    const [facturesMois, facturesToutes, versements] = await Promise.all([
      db.from("cabinet_factures").select("numero,client_nom,lignes,payee_at").eq("statut", "payee").gte("payee_at", debut).lt("payee_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,lignes").eq("statut", "payee"),
      db.from("cabinet_versements").select("montant,moyen,date_versement").eq("employe_discord_id", moi).order("date_versement", { ascending: false }),
    ]);
    const err = [facturesMois, facturesToutes, versements].find((x: any) => x.error);
    if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 400 });

    const relevesMois = relevesDepuisFactures(facturesMois.data || [])[moi];
    const relevesCumul = relevesDepuisFactures(facturesToutes.data || [])[moi];
    const commissionCumul = relevesCumul?.commission || 0;
    const versementsCumul = (versements.data || []).reduce((s: number, v: any) => s + Number(v.montant || 0), 0);

    return NextResponse.json({
      mois,
      commission_mois: relevesMois?.commission || 0,
      prestations_mois: relevesMois?.prestations || [],
      commission_cumul: commissionCumul,
      versements_cumul: versementsCumul,
      solde: commissionCumul - versementsCumul,
      versements: versements.data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
