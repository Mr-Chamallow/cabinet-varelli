import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { postAlert, logAudit, GOLD, GREY } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("admin");
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
    await logAudit(supabaseAdmin, (user as any)?.discord_name, "Rôle forcé", body.nom || body.discord_id, body.role);
    await postAlert("membres", "🎭 Rôle forcé", `**${body.nom || body.discord_id}** → **${body.role}**\nPar : ${(user as any)?.discord_name || "?"}`, GOLD);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { discord_id } = await req.json();
    if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });
    const { error: dbError } = await supabaseAdmin.from("role_overrides").delete().eq("discord_id", discord_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await logAudit(supabaseAdmin, (user as any)?.discord_name, "Rôle forcé retiré", discord_id);
    await postAlert("membres", "🎭 Rôle forcé retiré", `\`${discord_id}\`\nPar : ${(user as any)?.discord_name || "?"}`, GREY);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
