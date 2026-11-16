import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

// Enregistre un réglage du site (couleur, textes...). Réservé aux admins.
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const { authorized, supabaseAdmin: db, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { cle, valeur } = await req.json();
    if (!cle || typeof cle !== "string") return NextResponse.json({ error: "cle requise" }, { status: 400 });

    const { error: e } = await db.from("app_settings").upsert({ cle, valeur: String(valeur ?? "") }, { onConflict: "cle" });
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
