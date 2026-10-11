import { NextResponse } from "next/server";
import { logAudit } from "@/lib/alerts";
import { requirePermission } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_paie");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_paiements").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await logAudit(supabaseAdmin, String((user as any)?.nom_perso || (user as any)?.discord_name || ""), "Paie versee", String((data as any)?.employe || ""), `${(data as any)?.montant ?? ""}$ · semaine ${(data as any)?.semaine ?? ""}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
