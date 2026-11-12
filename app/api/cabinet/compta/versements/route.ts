import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { estCommissions, nomStaff } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Versements de commissions aux employés. Réservé à la comptabilité.
async function controle() {
  const r = await requireAnyPermission(PERMS_BUREAU);
  if (!r.authorized || !estCommissions(r.user)) return null;
  return r;
}

export async function GET() {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_versements").select("*").order("date_versement", { ascending: false }).limit(300);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const b = await req.json();
    const montant = Math.round(Number(b.montant));
    if (!b.employe_discord_id) return NextResponse.json({ error: "Employé requis" }, { status: 400 });
    if (!(montant > 0)) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    const db = r.supabaseAdmin;
    const nom = (await nomStaff(db, b.employe_discord_id)) || b.employe_nom || b.employe_discord_id;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date_versement || "") ? b.date_versement : new Date().toISOString().slice(0, 10);
    const auteur = nomAffiche(r.user);
    const { data, error } = await db.from("cabinet_versements").insert([{
      employe_discord_id: b.employe_discord_id, employe_nom: nom, montant, moyen: String(b.moyen || "Virement").slice(0, 40),
      date_versement: date, auteur_nom: auteur,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, auteur, "Commission versée", nom, `${montant} $`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { error } = await r.supabaseAdmin.from("cabinet_versements").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(r.supabaseAdmin, nomAffiche(r.user), "Versement supprimé", id, null);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
