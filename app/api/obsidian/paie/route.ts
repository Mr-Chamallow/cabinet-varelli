import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_paie");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_paiements").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
