import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { diffuser, estDirection, estStaff } from "@/lib/cabinetAcces";

// Fermer ou rouvrir une plainte : l'auteur ou la direction
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const { data: p } = await r.supabaseAdmin.from("cabinet_plaintes").select("auteur_discord_id").eq("id", id).maybeSingle();
    if (!p) return NextResponse.json({ error: "Plainte introuvable" }, { status: 404 });
    if (p.auteur_discord_id !== user.discord_id && !estDirection(user)) {
      return NextResponse.json({ error: "Plainte non accessible" }, { status: 403 });
    }
    const b = await req.json();
    const statut = b.statut === "ferme" ? "ferme" : "ouvert";
    const { data, error } = await r.supabaseAdmin.from("cabinet_plaintes").update({ statut }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await diffuser("liste:plaintes", { id });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
