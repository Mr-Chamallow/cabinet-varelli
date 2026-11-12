import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estCompta } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Dépenses du cabinet (fournitures, loyers, abonnements...). Réservé à la comptabilité.
async function controle() {
  const r = await requireAnyPermission(["cabinet_compta"]);
  if (!r.authorized || !estCompta(r.user)) return null;
  return r;
}

export async function GET() {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_depenses").select("*").order("date_depense", { ascending: false }).limit(300);
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
    const libelle = String(b.libelle || "").trim().slice(0, 200);
    if (!libelle) return NextResponse.json({ error: "Libellé requis" }, { status: 400 });
    if (!(montant > 0)) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date_depense || "") ? b.date_depense : new Date().toISOString().slice(0, 10);
    const auteur = nomAffiche(r.user);
    const { data, error } = await r.supabaseAdmin.from("cabinet_depenses").insert([{
      date_depense: date, categorie: String(b.categorie || "Autre").slice(0, 60), libelle, montant, auteur_nom: auteur,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(r.supabaseAdmin, auteur, "Dépense ajoutée", libelle, `${montant} $`);
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
    const { error } = await r.supabaseAdmin.from("cabinet_depenses").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(r.supabaseAdmin, nomAffiche(r.user), "Dépense supprimée", id, null);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
