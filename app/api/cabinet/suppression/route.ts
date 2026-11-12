import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";
import { supprimerDossiers, supprimerFacture } from "@/lib/purge";

// Suppression définitive : direction uniquement, et seulement si l'utilisateur tape SUPPRIMER
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_attribution"]);
    if (!r.authorized) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    if (!estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const b = await req.json();
    if (b.confirmation !== "SUPPRIMER") return NextResponse.json({ error: "Confirmation requise : tape SUPPRIMER" }, { status: 400 });
    const db = r.supabaseAdmin;

    let error: any = null;
    let nombre = 0;
    if (b.type === "dossier" && b.id) {
      error = await supprimerDossiers(db, [b.id]); nombre = 1;
    } else if (b.type === "facture" && b.id) {
      error = await supprimerFacture(db, b.id); nombre = 1;
    } else if (b.type === "tous_dossiers") {
      const { data } = await db.from("cabinet_dossiers").select("id");
      const ids = (data || []).map((d: any) => d.id);
      error = await supprimerDossiers(db, ids); nombre = ids.length;
    } else if (b.type === "toutes_factures") {
      await db.from("cabinet_messages").delete().like("fichier_url", "/api/cabinet/factures/%");
      const { data } = await db.from("cabinet_factures").select("id");
      nombre = (data || []).length;
      const res = await db.from("cabinet_factures").delete().not("id", "is", null);
      error = res.error;
    } else {
      return NextResponse.json({ error: "Type de suppression inconnu" }, { status: 400 });
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, nomAffiche(r.user), "Suppression définitive", b.type, `${nombre} élément(s)`);
    return NextResponse.json({ ok: true, supprimes: nombre });    return NextResponse.json({ ok: true, supprimes: nombre });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
