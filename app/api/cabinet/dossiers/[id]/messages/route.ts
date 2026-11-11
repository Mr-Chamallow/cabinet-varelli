import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canRead, nomAffiche, notifyDiscord } from "@/lib/cabinetServer";

// Vérifie que l'utilisateur a le droit de voir ce dossier (staff ou client propriétaire)
async function accesDossier(id: string) {
  const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
  if (!r.authorized) return { err: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) } as any;
  const user = r.user as any;
  const db = r.supabaseAdmin;
  const { data: dossier } = await db.from("cabinet_dossiers").select("*").eq("id", id).maybeSingle();
  if (!dossier) return { err: NextResponse.json({ error: "Dossier introuvable" }, { status: 404 }) } as any;
  const staff = canRead(user, ["cabinet_dossiers"]);
  if (!staff && dossier.client_discord_id !== user.discord_id) return { err: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) } as any;
  return { db, user, dossier, staff };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const a = await accesDossier(id); if (a.err) return a.err;
    const { data, error } = await a.db.from("cabinet_messages").select("*").eq("dossier_id", id).order("created_at", { ascending: true }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const a = await accesDossier(id); if (a.err) return a.err;
    if (a.dossier.statut !== "ouvert") {
      return NextResponse.json({ error: "Dossier fermé ou archivé : la messagerie est désactivée" }, { status: 403 });
    }
    const b = await req.json();
    const contenu = String(b.contenu || "").trim().slice(0, 4000);
    const image_url = b.image_url ? String(b.image_url) : null;
    if (!contenu && !image_url) return NextResponse.json({ error: "Message vide" }, { status: 400 });

    const { data, error } = await a.db.from("cabinet_messages").insert([{
      dossier_id: id,
      auteur_discord_id: a.user.discord_id,
      auteur_nom: nomAffiche(a.user),
      est_staff: a.staff,
      contenu: contenu || null,
      image_url,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (!a.staff) {
      await notifyDiscord(`**${a.dossier.client_nom || "Client"}** : dossier « ${a.dossier.titre} »\n${contenu ? contenu.slice(0, 300) : "image envoyée"}`);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
