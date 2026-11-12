import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { estResumeCompta } from "@/lib/cabinetAcces";
import { calculerResume, fenetreSemaine, semaineCourante, tauxParId } from "@/lib/compta";

const cellule = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Bilan hebdomadaire et relevés des commissions. ?semaine=AAAA-MM-JJ (lundi de la semaine, défaut : semaine courante). ?format=csv pour le relevé des prestations.
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estResumeCompta(r.user)) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const db = r.supabaseAdmin;
    const params = new URL(req.url).searchParams;
    const semaine = /^\d{4}-\d{2}-\d{2}$/.test(params.get("semaine") || "") ? params.get("semaine")! : semaineCourante();
    const { debut, fin, debutJour, finJour } = fenetreSemaine(semaine);

    const [paiements, facturesMois, facturesToutes, depenses, versements, avoirs, comparutions] = await Promise.all([
      db.from("cabinet_paiements").select("montant,mode,created_at").gte("created_at", debut).lt("created_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,montant,sous_total,lignes,payee_at").eq("statut", "payee").gte("payee_at", debut).lt("payee_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,lignes").eq("statut", "payee"),
      db.from("cabinet_depenses").select("*").gte("date_depense", debutJour).lt("date_depense", finJour).order("date_depense", { ascending: false }),
      db.from("cabinet_versements").select("*").order("date_versement", { ascending: false }),
      db.from("cabinet_avoirs").select("*").gte("created_at", debut).lt("created_at", fin).order("created_at", { ascending: false }),
      db.from("cabinet_comparutions").select("date_audience,heure,tribunal,client_nom,chefs,juge_proc,matricules_officiers,avocat_discord_id,avocat_nom,statut,montant,taux_pct,part_avocat").eq("statut", "prise_en_charge"),
    ]);
    const err = [paiements, facturesMois, facturesToutes, depenses, versements, avoirs, comparutions].find((x: any) => x.error);
    if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 400 });

    const [gradesRes, avocatGradesRes] = await Promise.all([db.from("cabinet_grades").select("grade,taux_pct"), db.from("cabinet_avocat_grades").select("avocat_discord_id,grade")]);
    const taux = tauxParId(gradesRes.data || [], avocatGradesRes.data || []);

    const resume = calculerResume(semaine, {
      paiements: paiements.data || [],
      facturesMois: facturesMois.data || [],
      facturesToutes: facturesToutes.data || [],
      depenses: depenses.data || [],
      versements: versements.data || [],
      avoirs: avoirs.data || [],
      comparutions: comparutions.data || [],
      taux,
    });

    // Détail des comparutions immédiates, à transmettre au gouvernement pour paiement
    if (params.get("format") === "ci-csv") {
      const entete = ["Date", "Heure", "Tribunal", "Client", "Chef(s) d'accusation", "Juge / proc", "Matricule(s) officiers", "Avocat", "Honoraire ($)", "Taux (%)", "Part avocat ($)"];
      const lignes = resume.ciSemaineListe.map((c: any) => [c.date_audience, c.heure, c.tribunal, c.client_nom, c.chefs, c.juge_proc, c.matricules_officiers, c.avocat_nom, c.montant, c.taux_pct, c.part_avocat]);
      const csv = "\uFEFF" + [entete, ...lignes].map(l => l.map(cellule).join(";")).join("\r\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="comparutions-immediates-${semaine}.csv"` } });
    }

    if (params.get("format") === "csv") {
      const entete = ["Employé", "Facture", "Client", "Prestation", "Total ($)", "Commission (%)", "Commission ($)"];
      const lignes: any[][] = [];
      for (const rel of resume.releves) for (const p of rel.prestations) {
        lignes.push([rel.employe_nom, p.facture, p.client, p.description, p.total, p.pct, p.commission]);
      }
      const csv = "﻿" + [entete, ...lignes].map(l => l.map(cellule).join(";")).join("\r\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="releve-commissions-${semaine}.csv"` } });
    }

    return NextResponse.json(resume);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
