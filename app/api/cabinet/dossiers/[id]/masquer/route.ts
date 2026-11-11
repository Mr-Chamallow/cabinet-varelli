import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { accesDossier } from "@/lib/cabinetAcces";

// Retire un dossier archivé de SA propre liste : les autres participants le gardent
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const a = await accesDossier(db, user, id);
    if (!a.peutVoir) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    if (a.dossier.statut !== "archive") return NextResponse.json({ error: "Seuls les dossiers archivés peuvent être retirés de ta liste" }, { status: 400 });
    const { error } = await db.from("cabinet_dossier_masques").upsert([{ dossier_id: id, discord_id: user.discord_id }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
