import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { hasWriteAccess } from "@/lib/auth";
import { weekStartOf } from "@/lib/weekStart";
import { postAlert, logAudit, usd, GREEN, GREY } from "@/lib/alerts";

// Enregistre un paiement de taxe ET la recette correspondante en compta (source = taxe).
async function guard() {
  const r = await requirePermission("obsidian_taxes");
  if (!r.authorized) return { err: NextResponse.json({ error: r.error || "Non autorisé" }, { status: 403 }) } as any;
  const u: any = r.user;
  if (!hasWriteAccess({ id: u.discord_id, nom: u.discord_name, role: u.site_role, permissions: u.permissions } as any, "obsidian_taxes"))
    return { err: NextResponse.json({ error: "Écriture non autorisée" }, { status: 403 }) } as any;
  return { db: r.supabaseAdmin, who: String(u.nom_perso || u.discord_name || "") };
}

export async function POST(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const b = await req.json();
    const montant = Math.abs(Number(b.montant) || 0);
    const argent = b.type_argent === "sale" ? "sale" : "propre";
    if (!b.taxe_id || !montant) return NextResponse.json({ error: "taxe_id et montant requis" }, { status: 400 });
    const { data: taxe } = await g.db.from("obsidian_taxes").select("*").eq("id", b.taxe_id).maybeSingle();
    if (!taxe) return NextResponse.json({ error: "Taxe introuvable" }, { status: 404 });
    const createdAt = b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString();
    const { data: row, error: e1 } = await g.db.from("obsidian_taxes_paiements").insert([{
      taxe_id: taxe.id, montant, type_argent: argent, note: b.note || null, created_by: g.who, created_at: createdAt,
    }]).select().single();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });
    const { error: e2 } = await g.db.from("obsidian_comptabilite").insert([{
      type: "recette", categorie: "Taxe", montant, type_argent: argent,
      motif: `Taxe - ${taxe.groupe}${taxe.raison ? " - " + taxe.raison : ""}`,
      membre: g.who, semaine: weekStartOf(createdAt), created_by: g.who, created_at: createdAt,
      source: "taxe", source_id: row.id,
    }]);
    if (e2) { await g.db.from("obsidian_taxes_paiements").delete().eq("id", row.id); return NextResponse.json({ error: `Compta : ${e2.message}` }, { status: 400 }); }
    await logAudit(g.db, g.who, "Taxe encaissée", taxe.groupe, usd(montant));
    await postAlert("compta", `💸 Taxe encaissée - ${usd(montant)}`, `**${taxe.groupe}**${taxe.raison ? ` · ${taxe.raison}` : ""}\nPar **${g.who || "?"}**`, GREEN);
    return NextResponse.json({ data: row });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  try {
    const g = await guard(); if (g.err) return g.err;
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { data: old } = await g.db.from("obsidian_taxes_paiements").select("*, obsidian_taxes(groupe)").eq("id", id).maybeSingle();
    await g.db.from("obsidian_comptabilite").delete().eq("source", "taxe").eq("source_id", id);
    const { error } = await g.db.from("obsidian_taxes_paiements").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (old) {
      await logAudit(g.db, g.who, "Paiement de taxe supprimé", (old as any).obsidian_taxes?.groupe || "", usd(Number(old.montant) || 0));
      await postAlert("compta", "🗑️ Paiement de taxe supprimé", `**${(old as any).obsidian_taxes?.groupe || "?"}** · ${usd(Number(old.montant) || 0)}`, GREY);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
