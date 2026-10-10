import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { syncEmployes } from "@/lib/syncEmployes";

// Appelé à l'ouverture de la page Employés : importe les membres du site qui ne sont pas encore employés.
export async function POST() {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_employes");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    return NextResponse.json({ ok: true, ...(await syncEmployes(supabaseAdmin)) });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
