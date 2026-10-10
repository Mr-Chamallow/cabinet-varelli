import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { logAudit } from "@/lib/alerts";

// Renommer un groupe : le référentiel (carte_gangs) fait foi, les noms copiés ailleurs suivent (via groupe_id).
const TABLES: [string, string][] = [
  ["tribunal_dossiers", "organisation"], ["gm_pactes", "organisation"], ["gm_audits", "organisation"],
  ["gm_reputation_log", "organisation"], ["gm_evenements", "partenaire"], ["obsidian_fiches", "organisation"],
];

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin: db, error, user } = await requirePermission("base_donnees");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id, nom } = await req.json();
    const n = String(nom || "").trim();
    if (!id || !n) return NextResponse.json({ error: "id et nom requis" }, { status: 400 });
    const { data: old } = await db.from("carte_gangs").select("nom").eq("id", id).maybeSingle();
    if (!old) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
    const { error: e } = await db.from("carte_gangs").update({ nom: n }).eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    for (const [t, c] of TABLES) await db.from(t).update({ [c]: n }).eq("groupe_id", id);
    await logAudit(db, ((user as any)?.nom_perso || (user as any)?.discord_name), "Groupe renommé", old.nom, `-> ${n}`);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
