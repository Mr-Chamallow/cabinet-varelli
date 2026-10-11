import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { hasWriteAccess } from "@/lib/auth";

// Types d'actions illegales gerables depuis la page Actions illegales (droit d'ecriture requis).
async function guard() {
  const r = await requirePermission("obsidian_actions");
  if (!r.authorized) return { err: NextResponse.json({ error: r.error || "Non autorisé" }, { status: 403 }) } as any;
  const u: any = r.user;
  if (!hasWriteAccess({ id: u.discord_id, nom: u.discord_name, role: u.site_role, permissions: u.permissions } as any, "obsidian_actions"))
    return { err: NextResponse.json({ error: "Écriture non autorisée" }, { status: 403 }) } as any;
  return { db: r.supabaseAdmin };
}

export async function POST(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const b = await req.json();
    const nom = String(b.nom || "").trim();
    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const row: any = {
      nom,
      icon: String(b.icon || "🕶️").slice(0, 8),
      delai_minutes: Math.max(0, Math.round(Number(b.delai_minutes) || 0)),
      ordre: Math.round(Number(b.ordre) || 0),
      actif: b.actif !== false,
      portee: b.portee === "groupe" ? "groupe" : "personne",
    };
    const { error } = await g.db.from("actions_illegales_types").upsert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const { nom } = await req.json();
    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const { error } = await g.db.from("actions_illegales_types").delete().eq("nom", nom);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
