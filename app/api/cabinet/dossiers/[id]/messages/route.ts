import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche, notifyDiscord } from "@/lib/cabinetServer";
import { accesDossier, diffuser, topicPour } from "@/lib/cabinetAcces";

const uuidOk = (s: unknown) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

// Messagerie client <-> cabinet d'un dossier, en temps réel
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const a = await accesDossier(r.supabaseAdmin, r.user, id);
    if (!a.peutVoir) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_messages").select("*").eq("dossier_id", id).order("created_at", { ascending: true }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [], topic: topicPour(`dossier:${id}`) });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const a = await accesDossier(r.supabaseAdmin, user, id);
    if (!a.peutVoir) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (a.dossier.statut !== "ouvert") {
      return NextResponse.json({ error: "Dossier fermé ou archivé : la messagerie est désactivée" }, { status: 403 });
    }
    const b = await req.json();
    const contenu = String(b.contenu || "").trim().slice(0, 4000);
    const image_url = b.image_url ? String(b.image_url) : null;
    const fichier_url = b.fichier_url ? String(b.fichier_url) : null;
    const fichier_nom = b.fichier_nom ? String(b.fichier_nom).slice(0, 120) : null;
    if (!contenu && !image_url && !fichier_url) return NextResponse.json({ error: "Message vide" }, { status: 400 });

    const est_staff = !a.client;
    const { data, error } = await r.supabaseAdmin.from("cabinet_messages").insert([{
      dossier_id: id,
      auteur_discord_id: user.discord_id,
      auteur_nom: nomAffiche(user),
      est_staff,
      contenu: contenu || null,
      image_url,
      fichier_url,
      fichier_nom,
      reponse_a: uuidOk(b.reponse_a) ? b.reponse_a : null,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await diffuser(`dossier:${id}`, data);
    if (!est_staff) {
      await notifyDiscord(`**Message client** : ${a.dossier.client_nom || "Client"}, dossier ${a.dossier.titre}\n${contenu ? contenu.slice(0, 300) : "image envoyée"}`);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Épingler / désépingler un message du dossier (employés uniquement)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const a = await accesDossier(r.supabaseAdmin, r.user, id);
    if (!a.peutVoir || a.client) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const b = await req.json();
    if (!uuidOk(b.id)) return NextResponse.json({ error: "Message inconnu" }, { status: 400 });
    const epingle = !!b.epingle;
    const db = r.supabaseAdmin;
    if (epingle) {
      const { data: anciens } = await db.from("cabinet_messages").update({ epingle: false }).eq("dossier_id", id).eq("epingle", true).select();
      for (const x of anciens || []) await diffuser(`dossier:${id}`, x);
    }
    const { data, error } = await db.from("cabinet_messages").update({ epingle }).eq("id", b.id).eq("dossier_id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await diffuser(`dossier:${id}`, data);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
