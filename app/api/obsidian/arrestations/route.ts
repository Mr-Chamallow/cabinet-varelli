import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { weekStartOf } from "@/lib/weekStart";
import { postAlert, logAudit, usd, ORANGE, RED, GREY } from "@/lib/alerts";

function arrestFields(row: any) {
  const items = (row.items || []).map((i: any) => `${i.emoji || ""} ${i.nom} × ${i.quantite}`).join("\n");
  return [
    { name: "Amende", value: usd(Number(row.amende) || 0), inline: true },
    { name: "Prime paie (argent perdu)", value: `${usd(Number(row.argent_perdu) || 0)} · argent ${row.type_argent || "sale"}`, inline: true },
    { name: "Objets perdus", value: items || "—", inline: false },
  ];
}

// Une arrestation :
//  - les objets perdus SORTENT du stock (mouvement "sortie" tracé),
//  - l'argent perdu (sale / propre) n'est PAS déduit de la compta : il devient une PRIME sur la paie de la semaine,
//  - l'amende est seulement enregistrée (jamais déduite du solde).

type Parsed = { membre: string; amende: number; argent: number; typeArgent: string; createdBy: string; createdAt: string; notes: string | null; wanted: { stock_id: string; quantite: number }[] };

function parse(b: any): Parsed | { error: string } {
  const membre = String(b.membre || "").trim();
  if (!membre) return { error: "Employé requis" };
  return {
    membre,
    amende: Math.max(0, Number(b.amende) || 0),
    argent: Math.max(0, Number(b.argent_perdu) || 0),
    typeArgent: ["sale", "propre", "mixte"].includes(b.type_argent) ? b.type_argent : "sale",
    createdBy: b.created_by || "",
    createdAt: b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString(),
    notes: b.notes || null,
    wanted: (Array.isArray(b.items) ? b.items : [])
      .map((i: any) => ({ stock_id: String(i.stock_id || ""), quantite: Math.floor(Number(i.quantite) || 0) }))
      .filter((i: any) => i.stock_id && i.quantite > 0),
  };
}

async function createArrest(db: any, p: Parsed): Promise<{ row?: any; error?: string }> {
  const items: any[] = [];
  for (const w of p.wanted) {
    const { data: st } = await db.from("obsidian_stocks").select("*").eq("id", w.stock_id).single();
    if (!st) return { error: "Objet de stock introuvable" };
    items.push({ stock_id: st.id, nom: st.nom, emoji: st.emoji, categorie: st.categorie, unite: st.unite, quantite: w.quantite, retire: Math.min(st.quantite, w.quantite) });
  }
  const { data: row, error: e1 } = await db.from("arrestations").insert([{
    membre: p.membre, amende: p.amende, argent_perdu: p.argent, type_argent: p.typeArgent, items, notes: p.notes, created_by: p.createdBy, created_at: p.createdAt,
  }]).select().single();
  if (e1) return { error: e1.message };

  for (const it of items) {
    if (it.retire <= 0) continue;
    const { data: st } = await db.from("obsidian_stocks").select("*").eq("id", it.stock_id).single();
    if (!st) continue;
    await db.from("obsidian_stocks").update({ quantite: Math.max(0, st.quantite - it.retire), updated_at: new Date().toISOString() }).eq("id", st.id);
    await db.from("obsidian_mouvements").insert([{
      stock_id: st.id, stock_nom: st.nom, type: "sortie", quantite: it.retire, motif: `Arrestation — ${p.membre}`,
      membre: p.membre, prix_unitaire: st.prix_unitaire || 0, total: it.retire * (st.prix_unitaire || 0), created_by: p.createdBy || p.membre,
    }]);
  }
  return { row };
}

async function revertArrest(db: any, row: any, by: string) {
  for (const it of (row.items || [])) {
    if (!it.retire || it.retire <= 0) continue;
    const { data: st } = await db.from("obsidian_stocks").select("*").eq("id", it.stock_id).single();
    if (!st) continue; // l'objet n'existe plus en stock : rien à restaurer
    await db.from("obsidian_stocks").update({ quantite: st.quantite + it.retire, updated_at: new Date().toISOString() }).eq("id", st.id);
    await db.from("obsidian_mouvements").insert([{
      stock_id: st.id, stock_nom: st.nom, type: "entrée", quantite: it.retire, motif: `Annulation arrestation — ${row.membre}`,
      membre: row.membre, prix_unitaire: st.prix_unitaire || 0, total: it.retire * (st.prix_unitaire || 0), created_by: by,
    }]);
  }
  await db.from("obsidian_comptabilite").delete().eq("source", "arrestation").eq("source_id", row.id);
  return db.from("arrestations").delete().eq("id", row.id);
}

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_arrestations");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const p = parse(await req.json());
    if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });
    const r = await createArrest(supabaseAdmin, p);
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    await postAlert("arrestations", `🚔 Arrestation — ${r.row.membre}`, r.row.notes || "Nouvelle arrestation enregistrée.", RED, arrestFields(r.row), ["RS"]);
    return NextResponse.json(r.row);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Modifier = annuler l'ancienne (stock remis, compta retirée) puis recréer avec les nouvelles valeurs.
export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_arrestations");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const p = parse(body);
    if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });

    const { data: old } = await supabaseAdmin.from("arrestations").select("*").eq("id", body.id).single();
    if (!old) return NextResponse.json({ error: "Arrestation introuvable" }, { status: 404 });

    p.createdBy = old.created_by || p.createdBy; // on garde l'auteur de la saisie d'origine
    await revertArrest(supabaseAdmin, old, (user as any)?.discord_name || "");
    const r = await createArrest(supabaseAdmin, p);
    if (!r.row) {
      // Échec : on restaure l'ancienne version pour ne rien perdre.
      await createArrest(supabaseAdmin, {
        membre: old.membre, amende: Number(old.amende) || 0, argent: Number(old.argent_perdu) || 0, typeArgent: old.type_argent || "sale",
        createdBy: old.created_by || "", createdAt: old.created_at, notes: old.notes || null,
        wanted: (old.items || []).map((i: any) => ({ stock_id: i.stock_id, quantite: i.quantite })),
      });
      return NextResponse.json({ error: r.error || "Échec de la modification" }, { status: 400 });
    }
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    await postAlert("arrestations", `✏️ Arrestation modifiée — ${r.row.membre}`, r.row.notes || "Saisie corrigée (stock et prime recalculés).", ORANGE, arrestFields(r.row));
    return NextResponse.json(r.row);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_arrestations");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { data: row } = await supabaseAdmin.from("arrestations").select("*").eq("id", id).single();
    if (!row) return NextResponse.json({ error: "Arrestation introuvable" }, { status: 404 });
    const { error: e } = await revertArrest(supabaseAdmin, row, (user as any)?.discord_name || "");
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    await logAudit(supabaseAdmin, (user as any)?.discord_name, "Arrestation annulée", row.membre, `amende ${row.amende} $ · argent perdu ${row.argent_perdu} $`);
    await postAlert("arrestations", `🗑️ Arrestation annulée — ${row.membre}`, "Stock remis, prime de paie retirée.", GREY, arrestFields(row));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
