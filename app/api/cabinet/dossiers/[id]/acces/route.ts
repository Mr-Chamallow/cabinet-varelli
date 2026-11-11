import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection, nomStaff } from "@/lib/cabinetAcces";
import { nomAffiche, notifyDiscord } from "@/lib/cabinetServer";

// Attribution d'un dossier à un avocat : réservé à la direction (Associé Gérant, Secrétaire juridique)
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const b = await req.json();
    if (!b.avocat_discord_id) return NextResponse.json({ error: "Avocat requis" }, { status: 400 });
    const db = r.supabaseAdmin;
    const nom = (await nomStaff(db, b.avocat_discord_id)) || b.avocat_nom || b.avocat_discord_id;
    const { error } = await db.from("cabinet_dossier_acces").upsert([{
      dossier_id: id, avocat_discord_id: b.avocat_discord_id, avocat_nom: nom, attribue_par: nomAffiche(r.user),
    }], { onConflict: "dossier_id,avocat_discord_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data: dossier } = await db.from("cabinet_dossiers").select("titre").eq("id", id).maybeSingle();
    await notifyDiscord(`**Attribution** : le dossier ${dossier?.titre || ""} est attribué à ${nom} (par ${nomAffiche(r.user)})`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_attribution"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const b = await req.json();
    if (!b.avocat_discord_id) return NextResponse.json({ error: "Avocat requis" }, { status: 400 });
    const { error } = await r.supabaseAdmin.from("cabinet_dossier_acces").delete().eq("dossier_id", id).eq("avocat_discord_id", b.avocat_discord_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
