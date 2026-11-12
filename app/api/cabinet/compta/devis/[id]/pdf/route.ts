import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { estFacturation } from "@/lib/cabinetAcces";
import { facturePdf } from "@/lib/facturePdf";

// PDF d'un devis : réservé à la comptabilité
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estFacturation(r.user)) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const db = r.supabaseAdmin;
    const { data: devis } = await db.from("cabinet_devis").select("*").eq("id", id).maybeSingle();
    if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    let dossier_titre = "";
    if (devis.dossier_id) {
      const { data: d } = await db.from("cabinet_dossiers").select("titre").eq("id", devis.dossier_id).maybeSingle();
      dossier_titre = d?.titre || "";
    }
    const pdf = facturePdf({ ...devis, dossier_titre }, "DEVIS");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${devis.numero || "devis"}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
