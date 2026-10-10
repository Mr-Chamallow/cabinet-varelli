import { NextResponse } from "next/server";
import { requirePermission, requirePatron } from "@/lib/serverAuth";

// POST : clôture toutes les semaines terminées (idempotent). DELETE (Patron) : rouvre une semaine.
export async function POST() {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_comptabilite");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { data, error: e } = await supabaseAdmin.rpc("obsidian_cloturer_semaines", { p_par: "auto" });
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ closed: data });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Réservé au CEO" }, { status: 403 });
    const { semaine } = await req.json();
    const { error: e } = await supabaseAdmin.from("obsidian_semaines").delete().eq("semaine", semaine);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
