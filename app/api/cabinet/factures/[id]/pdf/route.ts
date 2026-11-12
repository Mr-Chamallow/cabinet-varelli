import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estCompta } from "@/lib/cabinetAcces";
import { facturePdf } from "@/lib/facturePdf";

// PDF d'une facture : employés, ou le client à qui elle appartient
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const { data: facture } = await db.from("cabinet_factures").select("*").eq("id", id).maybeSingle();
    if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    if (!estCompta(user) && facture.client_discord_id !== user.discord_id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    let dossier_titre = "";
    if (facture.dossier_id) {
      const { data: d } = await db.from("cabinet_dossiers").select("titre").eq("id", facture.dossier_id).maybeSingle();
      dossier_titre = d?.titre || "";
    }
    const pdf = facturePdf({ ...facture, dossier_titre });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${facture.numero || "facture"}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
