import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

export async function GET() {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("avocat_clients");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { data, error: dbError } = await supabaseAdmin
      .from("avocat_clients")
      .select("discord_id,discord_name,nom_rp,tel_rp,id_perso,created_at,updated_at")
      .order("created_at", { ascending: false });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ clients: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
