import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

// Journal des actions sensibles — lecture réservée à l'admin (la table n'est pas lisible côté navigateur).
export const dynamic = "force-dynamic";
export async function GET() {
  const { authorized, supabaseAdmin, error } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
  const { data, error: e } = await supabaseAdmin.from("journal_audit").select("*").order("created_at", { ascending: false }).limit(500);
  if (e) return NextResponse.json({ error: e.message }, { status: 400 });
  return NextResponse.json(data || []);
}
