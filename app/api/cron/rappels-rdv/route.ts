import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { notifyDiscord } from "@/lib/cabinetServer";

// Rappel quotidien des rendez-vous de demain, envoyé sur Discord (Vercel Cron). Protégé par CRON_SECRET.
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const maintenant = Date.now();
    const { data, error } = await supabaseAdmin.from("cabinet_rdv")
      .select("client_nom,motif,date_rdv,avocat_nom,statut")
      .in("statut", ["attribue", "confirme"])
      .gte("date_rdv", new Date(maintenant + 12 * 3600_000).toISOString())
      .lte("date_rdv", new Date(maintenant + 36 * 3600_000).toISOString())
      .order("date_rdv", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (data && data.length) {
      const lignes = data.map((r: any) => `${new Date(r.date_rdv).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} : ${r.client_nom || "Client"}${r.avocat_nom ? `, avec ${r.avocat_nom}` : ""}${r.motif ? ` (${r.motif})` : ""}`);
      await notifyDiscord(`**Rendez-vous de demain** (${data.length})\n${lignes.join("\n")}`);
    }
    return NextResponse.json({ ok: true, rappels: (data || []).length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
