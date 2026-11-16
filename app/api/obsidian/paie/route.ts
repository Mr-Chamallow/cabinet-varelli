import type { Row } from "@/lib/types";
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
    await logAudit(supabaseAdmin, String((user as Row)?.nom_perso || (user as Row)?.discord_name || ""), "Paie versee", String((data as Row)?.employe || ""), `${(data as Row)?.montant ?? ""}$ · semaine ${(data as Row)?.semaine ?? ""}`);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: `Erreur serveur : ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
