import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { notifyDiscord } from "@/lib/cabinetServer";
import { calculerBilan, resumeBilan } from "@/lib/bilan";

// Bilan hebdomadaire envoyé sur Discord chaque lundi (Vercel Cron). Protégé par CRON_SECRET.
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const maintenant = new Date();
    const depuis = new Date(maintenant.getTime() - 7 * 86400_000);
    const b = await calculerBilan(supabaseAdmin, depuis.toISOString(), maintenant.toISOString());
    await notifyDiscord(resumeBilan(b, `de la semaine au ${maintenant.toLocaleDateString("fr-FR")}`));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
