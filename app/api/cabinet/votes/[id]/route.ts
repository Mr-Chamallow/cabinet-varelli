import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { CABINET_STAFF_ROLES, diffuser, estDirection, estStaff } from "@/lib/cabinetAcces";

// Majorité = plus de la moitié des employés du cabinet. Dès qu'elle est atteinte, le vote se clôt.
async function verifierMajorite(db: any, id: string): Promise<"adopte" | "rejete" | null> {
  const { data: reps } = await db.from("cabinet_votes_reponses").select("choix").eq("vote_id", id);
  const { count } = await db.from("site_logins").select("discord_id", { count: "exact", head: true }).in("site_role", CABINET_STAFF_ROLES);
  const seuil = Math.floor((count || 0) / 2) + 1;
  const pour = (reps || []).filter((x: any) => x.choix === "pour").length;
  const contre = (reps || []).filter((x: any) => x.choix === "contre").length;
  if (pour >= seuil) return "adopte";
  if (contre >= seuil) return "rejete";
  return null;
}

// action "voter" : pour / contre / abstention (modifiable tant que le vote est ouvert)
// action "fermer" ou "rouvrir" : auteur du vote ou direction
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const { data: v } = await db.from("cabinet_votes").select("*").eq("id", id).maybeSingle();
    if (!v) return NextResponse.json({ error: "Vote introuvable" }, { status: 404 });
    const b = await req.json();

    if (b.action === "voter") {
      if (v.statut !== "ouvert") return NextResponse.json({ error: "Vote clos" }, { status: 400 });
      const choix = String(b.choix || "");
      if (!["pour", "contre", "abstention"].includes(choix)) return NextResponse.json({ error: "Choix invalide" }, { status: 400 });
      const { error } = await db.from("cabinet_votes_reponses").upsert([{
        vote_id: id, voter_discord_id: user.discord_id, voter_nom: nomAffiche(user), choix,
      }], { onConflict: "vote_id,voter_discord_id" });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      const resultat = await verifierMajorite(db, id);
      if (resultat) await db.from("cabinet_votes").update({ statut: "ferme", resultat }).eq("id", id);
      await diffuser("liste:votes", { id });
      return NextResponse.json({ ok: true, resultat });
    }

    if (b.action === "fermer" || b.action === "rouvrir") {
      if (v.auteur_discord_id !== user.discord_id && !estDirection(user)) {
        return NextResponse.json({ error: "Réservé à l'auteur et à la direction" }, { status: 403 });
      }
      const patch = b.action === "fermer"
        ? { statut: "ferme", resultat: v.resultat || "clos" }
        : { statut: "ouvert", resultat: null };
      const { error } = await db.from("cabinet_votes").update(patch).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await diffuser("liste:votes", { id });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
