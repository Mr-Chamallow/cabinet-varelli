import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { accesDossier } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Clients supplémentaires d'un dossier. Lecture : toutes les personnes qui voient le dossier.
// Ajout et retrait : direction et avocats assignés.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const acces = await accesDossier(r.supabaseAdmin, r.user, id);
    if (!acces.peutVoir) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_dossier_clients").select("*").eq("dossier_id", id).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const acces = await accesDossier(db, r.user, id);
    if (!acces.peutGerer) return NextResponse.json({ error: "Réservé à la direction et aux avocats assignés" }, { status: 403 });
    const b = await req.json();
    const cid = String(b.client_discord_id || "").trim();
    if (!cid) return NextResponse.json({ error: "Client requis" }, { status: 400 });
    if (cid === acces.dossier.client_discord_id) return NextResponse.json({ error: "C'est déjà le client principal du dossier" }, { status: 400 });
    const { data: client } = await db.from("avocat_clients").select("discord_id,discord_name,nom_rp").eq("discord_id", cid).maybeSingle();
    if (!client) return NextResponse.json({ error: "Client introuvable : il doit d'abord créer son compte client" }, { status: 404 });
    const nom = client.nom_rp || client.discord_name;
    const { error } = await db.from("cabinet_dossier_clients").upsert([{
      dossier_id: id, client_discord_id: cid, client_nom: nom, ajoute_par: nomAffiche(r.user),
    }], { onConflict: "dossier_id,client_discord_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, nomAffiche(r.user), "Client ajouté au dossier", acces.dossier.titre, nom);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const acces = await accesDossier(db, r.user, id);
    if (!acces.peutGerer) return NextResponse.json({ error: "Réservé à la direction et aux avocats assignés" }, { status: 403 });
    const cid = new URL(req.url).searchParams.get("client_discord_id");
    if (!cid) return NextResponse.json({ error: "Client requis" }, { status: 400 });
    const { error } = await db.from("cabinet_dossier_clients").delete().eq("dossier_id", id).eq("client_discord_id", cid);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, nomAffiche(r.user), "Client retiré du dossier", acces.dossier.titre, cid);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
