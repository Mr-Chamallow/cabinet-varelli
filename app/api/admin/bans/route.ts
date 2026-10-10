import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { postAlert, logAudit, RED, GREEN } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { discord_id, nom, motif } = await req.json();
    if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });

    const { error: dbError } = await supabaseAdmin.from("site_bans").upsert({
      discord_id, nom: nom || "", motif: motif || "", banned_by: (user as any)?.discord_name || "", banned_at: new Date().toISOString(),
    });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await logAudit(supabaseAdmin, (user as any)?.discord_name, "Bannissement", nom || discord_id, motif || "");
    await postAlert("admin", "🔨 Membre banni du site", `**${nom || discord_id}** (\`${discord_id}\`)\nMotif : ${motif || "—"}\nPar : ${(user as any)?.discord_name || "?"}`, RED);
    return NextResponse.json({ ok: true });
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

    const { error: dbError } = await supabaseAdmin.from("site_bans").delete().eq("discord_id", discord_id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await logAudit(supabaseAdmin, (user as any)?.discord_name, "Débannissement", discord_id);
    await postAlert("admin", "✅ Membre débanni", `\`${discord_id}\`\nPar : ${(user as any)?.discord_name || "?"}`, GREEN);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
