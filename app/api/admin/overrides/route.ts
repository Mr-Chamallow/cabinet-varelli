import { NextResponse } from "next/server";
import { requirePermission, supabaseAdmin } from "@/lib/serverAuth";

// Force un rôle donné pour un discord_id donné, indépendamment du calcul automatique via Discord.
export async function POST(req: Request) {
  const { authorized } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  if (!body.discord_id || !body.role) {
    return NextResponse.json({ error: "discord_id et role sont requis" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin
    .from("role_overrides")
    .upsert([body], { onConflict: "discord_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { authorized } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { discord_id } = await req.json();
  if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });
  const { error } = await supabaseAdmin.from("role_overrides").delete().eq("discord_id", discord_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
