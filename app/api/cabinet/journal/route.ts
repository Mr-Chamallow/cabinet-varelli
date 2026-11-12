import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estPatron } from "@/lib/cabinetAcces";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";

// Journal d'activité : direction uniquement
export async function GET() {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estPatron(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_journal").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
