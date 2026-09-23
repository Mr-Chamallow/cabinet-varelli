import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    if (!body.discord_id || !body.role) {
      return NextResponse.json({ error: "discord_id et role sont requis" }, { status: 400 });
    }
    const { data, error: dbError } = await supabaseAdmin
      .from("role_overrides")
      .upsert([body], { onConflict: "discord_id" })
      .select()
      .single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { discord_id } = await req.json();
    if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });
    const { error: dbError } = await supabaseAdmin.from("role_overrides").delete().eq("discord_id", discord_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
