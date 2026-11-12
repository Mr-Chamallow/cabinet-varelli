import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { fenetreSemaine, semaineCourante, relevesDepuisFactures, tauxParId } from "@/lib/compta";

// Espace employé : uniquement ses propres prestations, commissions et versements (pas de données compta).
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const moi = (r.user as any).discord_id;
    const params = new URL(req.url).searchParams;
    const semaine = /^\d{4}-\d{2}-\d{2}$/.test(params.get("semaine") || "") ? params.get("semaine")! : semaineCourante();
    const { debut, fin, debutJour, finJour } = fenetreSemaine(semaine);

    const [facturesMois, facturesToutes, versements, comparutions] = await Promise.all([
      db.from("cabinet_factures").select("numero,client_nom,lignes,payee_at").eq("statut", "payee").gte("payee_at", debut).lt("payee_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,lignes").eq("statut", "payee"),
      db.from("cabinet_versements").select("montant,moyen,date_versement").eq("employe_discord_id", moi).order("date_versement", { ascending: false }),
      db.from("cabinet_comparutions").select("date_audience,client_nom,tribunal,chefs,montant,taux_pct,part_avocat").eq("statut", "prise_en_charge").eq("avocat_discord_id", moi).order("date_audience", { ascending: false }),
    ]);
    const err = [facturesMois, facturesToutes, versements, comparutions].find((x: any) => x.error);
    if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 400 });

    const [gradesRes, avocatGradesRes] = await Promise.all([db.from("cabinet_grades").select("grade,taux_pct"), db.from("cabinet_avocat_grades").select("avocat_discord_id,grade")]);
    const taux = tauxParId(gradesRes.data || [], avocatGradesRes.data || []);
    const relevesMois = relevesDepuisFactures(facturesMois.data || [], taux)[moi];
    const relevesCumul = relevesDepuisFactures(facturesToutes.data || [], taux)[moi];
    const commissionCumul = relevesCumul?.commission || 0;
    const versementsCumul = (versements.data || []).reduce((s: number, v: any) => s + Number(v.montant || 0), 0);
    const ci = comparutions.data || [];
    const ciSemaine = ci.filter((c: any) => String(c.date_audience).slice(0, 10) >= debutJour && String(c.date_audience).slice(0, 10) < finJour);
    const ciSemaineMontant = ciSemaine.reduce((s: number, c: any) => s + Number(c.part_avocat || 0), 0);
    const ciCumulMontant = ci.reduce((s: number, c: any) => s + Number(c.part_avocat || 0), 0);

    return NextResponse.json({
      semaine,
      commission_semaine: relevesMois?.commission || 0,
      prestations_semaine: relevesMois?.prestations || [],
      commission_cumul: commissionCumul,
      versements_cumul: versementsCumul,
      comparutions_semaine: ciSemaine,
      comparutions_semaine_total: ciSemaineMontant,
      comparutions_cumul_total: ciCumulMontant,
      solde: commissionCumul + ciCumulMontant - versementsCumul,
      versements: versements.data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
