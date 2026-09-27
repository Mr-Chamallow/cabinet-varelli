import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/serverAuth";

// Heartbeat de présence + journal de déconnexion. Ouvert à n'importe quel membre
// connecté (pas de permission spécifique requise) — juste une session valide.
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.discord_id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { action } = await req.json().catch(() => ({ action: "heartbeat" }));

    if (action === "logout") {
      try { await supabaseAdmin.from("site_session_log").insert([{ discord_id: user.discord_id, discord_name: user.discord_name, event: "disconnect" }]); } catch {}
      return NextResponse.json({ ok: true });
    }

    // heartbeat par défaut
    try { await supabaseAdmin.from("site_logins").update({ last_seen: new Date().toISOString() }).eq("discord_id", user.discord_id); } catch {}
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
