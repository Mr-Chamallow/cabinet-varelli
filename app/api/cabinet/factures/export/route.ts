import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estStaff } from "@/lib/cabinetAcces";

// Export comptable mensuel en CSV (séparateur ;, compatible Excel français). Montants en $ entiers.
const STATUT: Record<string, string> = { en_attente: "En attente", payee: "Payée", annulee: "Annulée" };
const dateCsv = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "");
const cellule = (v: any) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;

    const demande = new URL(req.url).searchParams.get("mois") || "";
    const mois = /^\d{4}-\d{2}$/.test(demande) ? demande : new Date().toISOString().slice(0, 7);
    const [annee, num] = mois.split("-").map(Number);
    const debut = `${mois}-01`;
    const fin = new Date(Date.UTC(annee, num, 1)).toISOString().slice(0, 10);

    const { data: factures, error } = await db.from("cabinet_factures").select("*")
      .gte("created_at", debut).lt("created_at", fin).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const rows = factures || [];

    const ids = [...new Set(rows.map((f: any) => f.dossier_id).filter(Boolean))];
    const titres: Record<string, string> = {};
    if (ids.length) {
      const { data: dossiers } = await db.from("cabinet_dossiers").select("id,titre").in("id", ids);
      (dossiers || []).forEach((d: any) => { titres[d.id] = d.titre; });
    }

    const entete = ["Numéro", "Date d'émission", "Échéance", "Client", "Dossier", "Sous-total ($)", "TVA (%)", "TVA ($)", "Total ($)", "Statut", "Date de paiement"];
    const lignes = rows.map((f: any) => {
      const sous = Math.round(Number(f.sous_total) || 0);
      const total = Math.round(Number(f.montant) || 0);
      return [
        f.numero, dateCsv(f.created_at), dateCsv(f.date_echeance), f.client_nom, titres[f.dossier_id] || "",
        sous, f.tva_taux || 0, total - sous, total, STATUT[f.statut] || f.statut, dateCsv(f.payee_at),
      ];
    });
    const totalMois = rows.reduce((s: number, f: any) => s + Math.round(Number(f.montant) || 0), 0);
    const totalPaye = rows.filter((f: any) => f.statut === "payee").reduce((s: number, f: any) => s + Math.round(Number(f.montant) || 0), 0);
    lignes.push(["TOTAL DU MOIS", "", "", "", "", "", "", "", totalMois, `Encaissé : ${totalPaye}`, ""]);

    const csv = "﻿" + [entete, ...lignes].map(l => l.map(cellule).join(";")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="factures-${mois}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
