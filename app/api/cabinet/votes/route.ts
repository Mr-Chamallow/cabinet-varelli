import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche, notifyDiscord } from "@/lib/cabinetServer";
import { estStaff } from "@/lib/cabinetAcces";

// Votes internes : tous les employés voient les propositions et leurs résultats
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_votes")
      .select("*, cabinet_votes_reponses(voter_discord_id, voter_nom, choix)")
      .order("created_at", { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [], moiId: (r.user as any).discord_id });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Nouvelle proposition de vote (titre + motif libre)
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    if (!estStaff(user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const b = await req.json();
    const titre = String(b.titre || "").trim().slice(0, 150);
    const motif = String(b.motif || "").trim().slice(0, 2000);
    if (titre.length < 3) return NextResponse.json({ error: "Titre trop court" }, { status: 400 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_votes").insert([{
      auteur_discord_id: user.discord_id, auteur_nom: nomAffiche(user), titre, motif: motif || null, statut: "ouvert",
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await notifyDiscord(`**Nouveau vote interne** : ${titre}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
