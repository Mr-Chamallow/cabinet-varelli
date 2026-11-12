import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU, estBureauUser } from "@/lib/cabinetRoles";
import { calculerBilan } from "@/lib/bilan";
import { bilanPdf } from "@/lib/bilanPdf";

// Bilan hebdomadaire PDF (7 derniers jours), réservé à la direction
export async function GET() {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estBureauUser(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const maintenant = new Date();
    const depuis = new Date(maintenant.getTime() - 7 * 86400_000);
    const b = await calculerBilan(r.supabaseAdmin, depuis.toISOString(), maintenant.toISOString());
    const libelle = `du ${depuis.toLocaleDateString("fr-FR")} au ${maintenant.toLocaleDateString("fr-FR")}`;
    return new NextResponse(new Uint8Array(bilanPdf(b, libelle)), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="bilan-${maintenant.toISOString().slice(0, 10)}.pdf"` },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
