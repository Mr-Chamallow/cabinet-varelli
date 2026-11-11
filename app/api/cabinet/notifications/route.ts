import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection, estStaff, topicPour } from "@/lib/cabinetAcces";

// Pastilles : plaintes ouvertes arrivées depuis ta dernière visite (direction)
// et votes ouverts auxquels tu n'as pas encore répondu
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const topics = { plaintes: topicPour("liste:plaintes"), votes: topicPour("liste:votes") };
    if (!estStaff(user)) return NextResponse.json({ plaintes: 0, votes: 0, topics });

    let plaintes = 0;
    if (estDirection(user)) {
      const { data: vu } = await db.from("cabinet_vus").select("vu_at").eq("discord_id", user.discord_id).eq("section", "plaintes").maybeSingle();
      const depuis = vu?.vu_at || "1970-01-01T00:00:00Z";
      const { count } = await db.from("cabinet_plaintes").select("id", { count: "exact", head: true })
        .eq("statut", "ouvert").gt("created_at", depuis).neq("auteur_discord_id", user.discord_id);
      plaintes = count || 0;
    }

    const { data: votes } = await db.from("cabinet_votes").select("id, cabinet_votes_reponses(voter_discord_id)").eq("statut", "ouvert");
    const aVoter = (votes || []).filter((v: any) => !(v.cabinet_votes_reponses || []).some((x: any) => x.voter_discord_id === user.discord_id)).length;

    return NextResponse.json({ plaintes, votes: aVoter, topics });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Marque une section comme vue (ex. la direction ouvre les plaintes)
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const b = await req.json();
    if (b.section !== "plaintes") return NextResponse.json({ error: "Section inconnue" }, { status: 400 });
    await r.supabaseAdmin.from("cabinet_vus").upsert([{ discord_id: user.discord_id, section: "plaintes", vu_at: new Date().toISOString() }], { onConflict: "discord_id,section" });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
