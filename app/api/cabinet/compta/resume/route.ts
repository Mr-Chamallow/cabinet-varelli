import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estCompta } from "@/lib/cabinetAcces";
import { calculerResume, fenetreMois, moisCourant, relevesDepuisFactures } from "@/lib/compta";

const cellule = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Bilan mensuel et relevés des commissions. ?mois=AAAA-MM (défaut : mois courant). ?format=csv pour le relevé des prestations.
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_compta"]);
    if (!r.authorized || !estCompta(r.user)) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const db = r.supabaseAdmin;
    const params = new URL(req.url).searchParams;
    const mois = /^\d{4}-\d{2}$/.test(params.get("mois") || "") ? params.get("mois")! : moisCourant();
    const { debut, fin, debutJour, finJour } = fenetreMois(mois);

    const [paiements, facturesMois, facturesToutes, depenses, versements, avoirs] = await Promise.all([
      db.from("cabinet_paiements").select("montant,mode,created_at").gte("created_at", debut).lt("created_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,montant,sous_total,lignes,payee_at").eq("statut", "payee").gte("payee_at", debut).lt("payee_at", fin),
      db.from("cabinet_factures").select("numero,client_nom,lignes").eq("statut", "payee"),
      db.from("cabinet_depenses").select("*").gte("date_depense", debutJour).lt("date_depense", finJour).order("date_depense", { ascending: false }),
      db.from("cabinet_versements").select("*").order("date_versement", { ascending: false }),
      db.from("cabinet_avoirs").select("*").gte("created_at", debut).lt("created_at", fin).order("created_at", { ascending: false }),
    ]);
    const err = [paiements, facturesMois, facturesToutes, depenses, versements, avoirs].find((x: any) => x.error);
    if (err?.error) return NextResponse.json({ error: err.error.message }, { status: 400 });

    const resume = calculerResume(mois, {
      paiements: paiements.data || [],
      facturesMois: facturesMois.data || [],
      facturesToutes: facturesToutes.data || [],
      depenses: depenses.data || [],
      versements: versements.data || [],
      avoirs: avoirs.data || [],
    });

    if (params.get("format") === "csv") {
      const entete = ["Employé", "Facture", "Client", "Prestation", "Total ($)", "Commission (%)", "Commission ($)"];
      const lignes: any[][] = [];
      for (const rel of resume.releves) for (const p of rel.prestations) {
        lignes.push([rel.employe_nom, p.facture, p.client, p.description, p.total, p.pct, p.commission]);
      }
      const csv = "﻿" + [entete, ...lignes].map(l => l.map(cellule).join(";")).join("\r\n");
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="releve-commissions-${mois}.csv"` } });
    }

    return NextResponse.json(resume);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
