import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estStaffUser } from "@/lib/cabinetRoles";

// Devis et factures en LECTURE SEULE pour le personnel. Pas de comptabilité, pas de commissions :
// les % de commission des lignes sont retirés.
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized || !estStaffUser(r.user)) return NextResponse.json({ error: "Réservé au personnel du cabinet" }, { status: 403 });
    const db = r.supabaseAdmin;
    const [{ data: devis, error: e1 }, { data: factures, error: e2 }] = await Promise.all([
      db.from("cabinet_devis").select("id,numero,client_nom,lignes,montant,statut,created_at").order("created_at", { ascending: false }).limit(200),
      db.from("cabinet_factures").select("id,numero,client_nom,libelle,montant,statut,lignes,date_echeance,payee_at,created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    if (e1 || e2) return NextResponse.json({ error: (e1 || e2)?.message }, { status: 400 });
    const lignes = (ls: any[]) => (ls || []).map((l: any) => ({ description: l.description, quantite: l.quantite, prix: l.prix }));
    return NextResponse.json({
      devis: (devis || []).map(d => ({ ...d, lignes: lignes(d.lignes) })),
      factures: (factures || []).map(f => ({ ...f, lignes: lignes(f.lignes) })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
