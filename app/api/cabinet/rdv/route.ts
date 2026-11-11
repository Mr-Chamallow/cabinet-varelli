import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canRead, canWrite, nomAffiche, notifyDiscord } from "@/lib/cabinetServer";

const STATUTS = ["demande", "confirme", "annule"];

// Agenda des RDV : le staff (cabinet_rdv) voit tout, le client voit ses propres demandes
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    let q = r.supabaseAdmin.from("cabinet_rdv").select("*").order("date_rdv", { ascending: true });
    if (!canRead(r.user, ["cabinet_rdv"])) q = q.eq("discord_id", (r.user as any).discord_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!b.date_rdv) return NextResponse.json({ error: "Date requise" }, { status: 400 });
    const staff = canWrite(user, "cabinet_rdv");

    let discord_id: string | null = user.discord_id;
    let client_nom: string | null = null;
    if (staff && b.discord_id) {
      discord_id = String(b.discord_id).trim();
      client_nom = (b.client_nom || "").trim() || null;
    }
    if (!client_nom && discord_id) {
      const { data } = await db.from("avocat_clients").select("nom_rp,discord_name").eq("discord_id", discord_id).maybeSingle();
      client_nom = data ? (data.nom_rp || data.discord_name) : null;
    }
    if (!client_nom) return NextResponse.json({ error: "Client introuvable : il doit d'abord créer son compte client" }, { status: 400 });

    const { data, error } = await db.from("cabinet_rdv").insert([{
      discord_id,
      client_nom,
      motif: (b.motif || "").trim() || null,
      date_rdv: b.date_rdv,
      statut: staff ? "confirme" : "demande",
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const quand = new Date(b.date_rdv).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" });
    await notifyDiscord(`📅 ${staff ? "RDV ajouté" : "Nouvelle demande de RDV"} — **${client_nom}**\nDate : ${quand}${b.motif ? `\nMotif : ${b.motif}` : ""}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_rdv"]);
    if (!r.authorized || !canWrite(r.user, "cabinet_rdv")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    if (b.statut && !STATUTS.includes(b.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_rdv").update({ statut: b.statut }).eq("id", b.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await notifyDiscord(`📅 RDV **${data.client_nom}** → ${b.statut} (par ${nomAffiche(r.user)})`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
