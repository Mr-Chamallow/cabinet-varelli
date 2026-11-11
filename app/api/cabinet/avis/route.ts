import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche, notifyDiscord } from "@/lib/cabinetServer";

// Avis publiés (visibles de tous les clients)
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_avis")
      .select("id,auteur_nom,note,contenu,created_at")
      .eq("statut", "publie").order("created_at", { ascending: false }).limit(30);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Nouvel avis d'un client : publié seulement après validation par le cabinet
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const b = await req.json();
    const note = Math.round(Number(b.note));
    const contenu = String(b.contenu || "").trim().slice(0, 800);
    if (!(note >= 1 && note <= 5)) return NextResponse.json({ error: "Note entre 1 et 5" }, { status: 400 });
    if (contenu.length < 5) return NextResponse.json({ error: "Ton avis est trop court" }, { status: 400 });
    const { error } = await r.supabaseAdmin.from("cabinet_avis").insert([{
      auteur_discord_id: user.discord_id, auteur_nom: nomAffiche(user), note, contenu, statut: "en_attente",
    }]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await notifyDiscord(`**Nouvel avis client** (${note}/5) à valider dans l'admin : ${contenu.slice(0, 300)}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
