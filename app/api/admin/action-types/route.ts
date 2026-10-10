import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

// Crée ou met à jour un type d'action illégale (nom = identifiant, non modifiable).
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const b = await req.json();
    const nom = String(b.nom || "").trim();
    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const row = {
      nom,
      icon: String(b.icon || "🕶️").slice(0, 8),
      delai_minutes: Math.max(0, Math.round(Number(b.delai_minutes) || 0)),
      ordre: Math.round(Number(b.ordre) || 0),
      actif: b.actif !== false,
    };
    const { error: dbError } = await supabaseAdmin.from("actions_illegales_types").upsert(row);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { nom } = await req.json();
    if (!nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const { error: dbError } = await supabaseAdmin.from("actions_illegales_types").delete().eq("nom", nom);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
