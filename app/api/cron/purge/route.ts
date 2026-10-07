import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";

// Purge quotidienne (Vercel Cron, voir vercel.json) : supprime les journaux de
// connexion de plus de 90 jours. Protégée par CRON_SECRET (envoyé par Vercel).
export const dynamic = "force-dynamic";
const RETENTION_DAYS = 90;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const limit = new Date(Date.now() - RETENTION_DAYS * 86400_000).toISOString();
    const result: Record<string, string> = {};
    for (const table of ["site_session_log", "site_login_failures"]) {
      const { error } = await supabaseAdmin.from(table).delete().lt("created_at", limit);
      result[table] = error ? `erreur: ${error.message}` : "ok";
    }
    return NextResponse.json({ ok: true, avant: limit, result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
