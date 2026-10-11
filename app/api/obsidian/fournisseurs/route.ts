import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

const CATS = ["drogue", "arme", "accessoire"];
const clean = (b: any) => ({
  ...(b.categorie !== undefined ? { categorie: String(b.categorie) } : {}),
  ...(b.produit !== undefined ? { produit: String(b.produit).trim().slice(0, 120) } : {}),
  ...(b.qui !== undefined ? { qui: String(b.qui).trim().slice(0, 80) } : {}),
  ...(b.groupe !== undefined ? { groupe: String(b.groupe).trim().slice(0, 80) } : {}),
  ...(b.telephone !== undefined ? { telephone: String(b.telephone).trim().slice(0, 30) } : {}),
  ...(b.notes !== undefined ? { notes: String(b.notes).slice(0, 300) } : {}),
  ...(b.prix_achat !== undefined ? { prix_achat: Math.round((Number(b.prix_achat) || 0) * 100) / 100 } : {}),
});
const normSql = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

// Un seul "préféré" par produit
async function unsetOthers(db: any, categorie: string, produit: string, exceptId: string) {
  const { data } = await db.from("obsidian_fournisseurs").select("id,produit").eq("categorie", categorie).eq("prefere", true).neq("id", exceptId);
  const ids = (data || []).filter((x: any) => normSql(x.produit) === normSql(produit)).map((x: any) => x.id);
  if (ids.length) await db.from("obsidian_fournisseurs").update({ prefere: false }).in("id", ids);
}

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_prix");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const b = await req.json();
    const row: any = clean(b);
    if (!CATS.includes(row.categorie)) return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
    if (!row.produit || !row.qui) return NextResponse.json({ error: "Produit et nom du vendeur requis" }, { status: 400 });
    if (!(row.prix_achat > 0)) return NextResponse.json({ error: "Prix d'achat invalide" }, { status: 400 });
    row.prefere = !!b.prefere;
    row.created_by = String((user as any)?.nom_perso || (user as any)?.discord_name || "");
    const { data, error: e } = await supabaseAdmin.from("obsidian_fournisseurs").insert([row]).select().single();
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    if (row.prefere) await unsetOthers(supabaseAdmin, row.categorie, row.produit, data.id);
    return NextResponse.json({ fournisseur: data });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_prix");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const row: any = clean(b);
    if (row.prix_achat !== undefined && !(row.prix_achat > 0)) return NextResponse.json({ error: "Prix d'achat invalide" }, { status: 400 });
    if (b.prefere !== undefined) row.prefere = !!b.prefere;
    const { data, error: e } = await supabaseAdmin.from("obsidian_fournisseurs").update(row).eq("id", b.id).select().single();
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    if (row.prefere) await unsetOthers(supabaseAdmin, data.categorie, data.produit, data.id);
    return NextResponse.json({ fournisseur: data });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_prix");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { error: e } = await supabaseAdmin.from("obsidian_fournisseurs").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
