import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { sendDiscordAlert, ARMURERIE_CATEGORIES } from "@/lib/discordAlert";

// Enregistre un mouvement de stock ET met à jour la quantité de l'article lié, en un
// seul appel serveur (les deux vont toujours ensemble côté UI — évite d'exposer deux
// écritures séparées à une clé anonyme, et garantit que la quantité stockée reste
// cohérente avec l'historique des mouvements).
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { stock_id, type, quantite, motif, membre, created_by } = await req.json();
    if (!stock_id || !quantite || quantite <= 0) {
      return NextResponse.json({ error: "stock_id et quantite (> 0) sont requis" }, { status: 400 });
    }

    const { data: stock, error: stockErr } = await supabaseAdmin.from("obsidian_stocks").select("*").eq("id", stock_id).single();
    if (stockErr || !stock) return NextResponse.json({ error: stockErr?.message || "Stock introuvable" }, { status: 404 });

    const isEntree = type === "entrée" || type === "entree";
    const newQty = isEntree ? stock.quantite + quantite : Math.max(0, stock.quantite - quantite);

    const { error: mvtErr } = await supabaseAdmin.from("obsidian_mouvements").insert([{
      stock_id: stock.id, stock_nom: stock.nom, type, quantite, motif: motif || "",
      membre: membre || created_by || "", prix_unitaire: stock.prix_unitaire || 0,
      total: quantite * (stock.prix_unitaire || 0), created_by: created_by || membre || "",
    }]);
    if (mvtErr) return NextResponse.json({ error: mvtErr.message }, { status: 400 });

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("obsidian_stocks")
      .update({ quantite: newQty, updated_at: new Date().toISOString() })
      .eq("id", stock.id)
      .select()
      .single();
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    // Alerte Discord à chaque mouvement, sur le webhook du bon module (armurerie vs stocks).
    const kind = ARMURERIE_CATEGORIES.includes(stock.categorie) ? "armurerie" : "stocks";
    const seuil = stock.seuil_alerte || 0;
    const bas = seuil > 0 && newQty <= seuil;
    sendDiscordAlert(
      kind,
      `**${isEntree ? "➕ Entrée" : "➖ Sortie"}** sur **${stock.nom}** : ${quantite} ${stock.unite || ""} (${membre || created_by || "inconnu"})\nNouvelle quantité : ${newQty} ${stock.unite || ""}${bas ? ` — ⚠️ **sous le seuil d'alerte (${seuil})**` : ""}`,
      { title: kind === "armurerie" ? "🔫 Mouvement armurerie" : "📦 Mouvement stock", color: bas ? 0xef4444 : 0xa48fff }
    );

    return NextResponse.json({ stock: updated });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
