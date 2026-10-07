import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

// Demande une resynchro des rôles Discord pour un membre : appliquée dès sa
// prochaine action sur le site (le flag est lu par le callback jwt).
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { discord_id } = await req.json();
    if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });

    const { error: dbError } = await supabaseAdmin.from("site_logins").update({ force_resync: true }).eq("discord_id", discord_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
