import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { diffuser, estDirection, estStaff, topicPour } from "@/lib/cabinetAcces";

// Plaintes internes : visibles uniquement par la direction et par l'auteur du ticket
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const direction = estDirection(user);
    let q = r.supabaseAdmin.from("cabinet_plaintes").select("*").order("created_at", { ascending: false }).limit(200);
    if (!direction) q = q.eq("auteur_discord_id", user.discord_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [], direction, moiId: user.discord_id, topic: topicPour("liste:plaintes") });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const b = await req.json();
    const sujet = String(b.sujet || "").trim().slice(0, 150);
    if (sujet.length < 3) return NextResponse.json({ error: "Sujet trop court" }, { status: 400 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_plaintes").insert([{
      auteur_discord_id: user.discord_id, auteur_nom: nomAffiche(user), sujet, statut: "ouvert",
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await diffuser("liste:plaintes", { id: data.id });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
