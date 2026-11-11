import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { estDirection, estStaff } from "@/lib/cabinetAcces";

// action "voter" : choix pour / contre / abstention (on peut changer son vote tant que le vote est ouvert)
// action "fermer" ou "rouvrir" : auteur du vote ou direction
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const { data: v } = await r.supabaseAdmin.from("cabinet_votes").select("*").eq("id", id).maybeSingle();
    if (!v) return NextResponse.json({ error: "Vote introuvable" }, { status: 404 });
    const b = await req.json();

    if (b.action === "voter") {
      if (v.statut !== "ouvert") return NextResponse.json({ error: "Vote fermé" }, { status: 400 });
      const choix = String(b.choix || "");
      if (!["pour", "contre", "abstention"].includes(choix)) return NextResponse.json({ error: "Choix invalide" }, { status: 400 });
      const { error } = await r.supabaseAdmin.from("cabinet_votes_reponses").upsert([{
        vote_id: id, voter_discord_id: user.discord_id, voter_nom: nomAffiche(user), choix,
      }], { onConflict: "vote_id,voter_discord_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (b.action === "fermer" || b.action === "rouvrir") {
      if (v.auteur_discord_id !== user.discord_id && !estDirection(user)) {
        return NextResponse.json({ error: "Réservé à l'auteur et à la direction" }, { status: 403 });
      }
      const statut = b.action === "fermer" ? "ferme" : "ouvert";
      const { error } = await r.supabaseAdmin.from("cabinet_votes").update({ statut }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
