import { NextResponse } from "next/server";
import { estBilan } from "@/lib/cabinetAcces";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { nomAffiche } from "@/lib/cabinetServer";
import { genererFactureGouvernement } from "@/lib/factureGouvernement";
import { semaineCourante } from "@/lib/compta";

// Liste des factures au gouvernement (patron et secrétaire juridique)
export async function GET() {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estBilan(r.user)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_factures_gouvernement").select("id,numero,semaine,nb_comparutions,total,statut,payee_at,created_at,cree_par").order("semaine", { ascending: false }).order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Création manuelle pour une semaine (?semaine=AAAA-MM-JJ, lundi). Défaut : semaine courante.
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estBilan(r.user)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
    const b = await req.json().catch(() => ({}));
    const lundi = /^\d{4}-\d{2}-\d{2}$/.test(b.semaine || "") ? b.semaine : semaineCourante();
    const facture = await genererFactureGouvernement(r.supabaseAdmin, lundi, nomAffiche(r.user));
    if (!facture) return NextResponse.json({ ok: false, message: "Aucune comparution prise en charge à facturer pour cette semaine." });
    return NextResponse.json({ ok: true, facture });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Marquer payée (?id=...)
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(PERMS_BUREAU);
    if (!r.authorized || !estBilan(r.user)) return NextResponse.json({ error: "Réservé au bureau" }, { status: 403 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_factures_gouvernement").update({ statut: "payee", payee_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

