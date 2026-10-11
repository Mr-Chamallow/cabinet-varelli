import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { postAlert, logAudit, GREEN, GREY } from "@/lib/alerts";

// Vote d'un membre (approuve / refuse) sur une fiche de recrutement.
// Il suffit d'avoir acces a la page Recrutement (lecture) pour voter.
// Regle : majorite des membres (> 50 %) pour valider, 50 % ou plus de refus pour refuser.
async function guard() {
  const r = await requirePermission("obsidian_recrutement");
  if (!r.authorized) return { err: NextResponse.json({ error: r.error || "Non autorisé" }, { status: 403 }) } as any;
  const u: any = r.user;
  return { db: r.supabaseAdmin, id: String(u.discord_id || ""), nom: String(u.nom_perso || u.discord_name || "") };
}

async function resolve(db: any, recId: string, nom: string, auteur: string) {
  const [{ data: rec }, { data: votes }, { count }] = await Promise.all([
    db.from("obsidian_recrutement").select("id,nom_rp,statut").eq("id", recId).maybeSingle(),
    db.from("obsidian_recrutement_votes").select("vote").eq("recrutement_id", recId),
    db.from("obsidian_employes").select("id", { count: "exact", head: true }),
  ]);
  if (!rec || rec.statut !== "candidat") return null;
  const total = Math.max(1, count || 1);
  const ok = (votes || []).filter((v: any) => v.vote === "approuve").length;
  const ko = (votes || []).filter((v: any) => v.vote === "refuse").length;
  let statut: string | null = null;
  if (ok > total / 2) statut = "valide"; else if (ko >= total / 2) statut = "refuse";
  if (!statut) return null;
  await db.from("obsidian_recrutement").update({ statut, updated_at: new Date().toISOString() }).eq("id", recId);
  await logAudit(db, auteur, statut === "valide" ? "Recrutement validé (vote)" : "Recrutement refusé (vote)", rec.nom_rp, `${ok} pour / ${ko} contre`);
  await postAlert("gm", statut === "valide" ? `✅ Candidat validé par vote : ${rec.nom_rp}` : `❌ Candidat refusé par vote : ${rec.nom_rp}`, `${ok} approuvé(s) · ${ko} refus · ${total} membres`, statut === "valide" ? GREEN : GREY);
  return statut;
}

export async function POST(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const b = await req.json();
    if (!b.recrutement_id || !["approuve", "refuse"].includes(b.vote)) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    if (!g.id) return NextResponse.json({ error: "Identité introuvable" }, { status: 400 });
    const { error } = await g.db.from("obsidian_recrutement_votes").upsert([{ recrutement_id: b.recrutement_id, voter_id: g.id, voter_nom: g.nom, vote: b.vote, created_at: new Date().toISOString() }], { onConflict: "recrutement_id,voter_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const statut = await resolve(g.db, b.recrutement_id, g.nom, g.nom);
    return NextResponse.json({ ok: true, statut });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const id = new URL(req.url).searchParams.get("recrutement_id");
    if (!id) return NextResponse.json({ error: "recrutement_id requis" }, { status: 400 });
    const { error } = await g.db.from("obsidian_recrutement_votes").delete().eq("recrutement_id", id).eq("voter_id", g.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Erreur" }, { status: 500 }); }
}
