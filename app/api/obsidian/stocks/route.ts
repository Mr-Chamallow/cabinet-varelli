import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { logAudit } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { restore, ...body } = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_stocks").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    // Restauration (bouton "Annuler" apres suppression) : meme id, l'historique des mouvements existe deja
    // -> aucun nouveau mouvement, donc aucune depense en double en compta.
    if (!restore && Number(data.quantite) > 0) {
      // Stock initial = entrée valorisée (le trigger compta en fait une dépense « Achat stock »).
      await supabaseAdmin.from("obsidian_mouvements").insert([{ stock_id: data.id, stock_nom: data.nom, type: "entrée", quantite: data.quantite, motif: "Stock initial", membre: data.created_by || "", prix_unitaire: data.prix_unitaire || 0, total: Number(data.quantite) * (Number(data.prix_unitaire) || 0), created_by: data.created_by || "" }]);
    }
    await logAudit(supabaseAdmin, (user as any)?.nom_perso || (user as any)?.discord_name || data.created_by || "?", "Stock créé", data.nom, `${data.quantite} ${data.unite || ""} · tag ${data.categorie || "-"}`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id, ...patch } = await req.json();
    // La quantité ne se modifie QUE par un mouvement (sinon l'historique et la compta ne suivent plus).
    if ("quantite" in patch) return NextResponse.json({ error: "La quantité se modifie par une entrée ou une sortie, pas directement." }, { status: 400 });
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_stocks").update(patch).eq("id", id).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id } = await req.json();
    const { error: dbError } = await supabaseAdmin.from("obsidian_stocks").delete().eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
