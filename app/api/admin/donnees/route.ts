import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

// Données sensibles de la page Admin (membres, bans, overrides, journaux).
// Lues côté serveur uniquement : la clé publique n'y a plus accès.
// ?partie=logins -> seulement la liste des membres (utilisé pour le rafraîchissement automatique)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { authorized, supabaseAdmin: db, error } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

  const partie = new URL(req.url).searchParams.get("partie");

  if (partie === "logins") {
    const { data, error: e } = await db.from("site_logins").select("*").order("last_login", { ascending: false });
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ logins: data || [] });
  }

  const [overrides, logins, bans, sessionLog, loginFailures] = await Promise.all([
    db.from("role_overrides").select("*").order("updated_at", { ascending: false }),
    db.from("site_logins").select("*").order("last_login", { ascending: false }),
    db.from("site_bans").select("*").order("banned_at", { ascending: false }),
    db.from("site_session_log").select("*").order("created_at", { ascending: false }).limit(80),
    db.from("site_login_failures").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  const premiere = [overrides, logins, bans, sessionLog, loginFailures].find(r => r.error);
  if (premiere?.error) return NextResponse.json({ error: premiere.error.message }, { status: 400 });

  return NextResponse.json({
    overrides: overrides.data || [],
    logins: logins.data || [],
    bans: bans.data || [],
    sessionLog: sessionLog.data || [],
    loginFailures: loginFailures.data || [],
  });
}
