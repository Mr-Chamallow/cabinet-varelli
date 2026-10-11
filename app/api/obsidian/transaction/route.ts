import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { sendDiscordAlert, ARMURERIE_CATEGORIES } from "@/lib/discordAlert";
import { postAlert, bigMoveAlert, logAudit, GREEN, RED } from "@/lib/alerts";
import { money } from "@/lib/money";

// Vente / achat : transaction + stock + mouvement + compta en UN seul bloc SQL (tout passe ou rien).
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("cahier_vente");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const b = await req.json();
    const vente = b.type === "entrée" || b.type === "entree";
    const who = String(b.created_by || (user as any)?.nom_perso || (user as any)?.discord_name || "");
    const quantite = Math.floor(Number(b.quantite) || 0);
    const montant = Number(b.montant) || 0;
    const motif = String(b.motif || "").trim() || `${vente ? "Vente" : "Achat"} ${quantite} x ${b.produit_nom}`;

    const { data, error: dbError } = await supabaseAdmin.rpc("obsidian_vente_achat", {
      p_type: vente ? "entrée" : "sortie",
      p_stock_id: b.stock_id || null,
      p_produit_nom: String(b.produit_nom || ""),
      p_categorie: String(b.categorie || ""),
      p_quantite: quantite,
      p_montant: montant,
      p_type_argent: ["propre", "sale", "mixte"].includes(b.type_argent) ? b.type_argent : "propre",
      p_motif: motif,
      p_user: who,
      p_user_id: String((user as any)?.discord_id || ""),
    });
    if (dbError) {
      if (/Stock insuffisant/i.test(dbError.message)) {
        await sendDiscordAlert("stocks", `⚠️ **Sortie refusée** : ${dbError.message}\nDemandée par ${who || "inconnu"} (${quantite} x ${b.produit_nom})`, { title: "📦 Stock insuffisant", color: 0xef4444 });
      }
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    const stock = (data as any)?.stock;
    const tx = (data as any)?.transaction;
    if (stock) {
      const seuil = Number(stock.seuil_alerte) || 0;
      const bas = seuil > 0 && Number(stock.quantite) <= seuil;
      const kind = ARMURERIE_CATEGORIES.includes(stock.categorie) ? "armurerie" : "stocks";
      await sendDiscordAlert(kind, `**${vente ? "➖ Vente" : "➕ Achat"}** de **${stock.nom}** : ${quantite} ${stock.unite || ""} (${who || "inconnu"})\nNouvelle quantité : ${stock.quantite} ${stock.unite || ""}${bas ? ` - ⚠️ **sous le seuil d'alerte (${seuil})**` : ""}`, { title: kind === "armurerie" ? "🔫 Mouvement armurerie" : "📦 Mouvement stock", color: bas ? 0xef4444 : 0xa48fff });
    }
    await postAlert("compta", `${vente ? "↑ Recette" : "↓ Dépense"} - ${money(montant)}`, motif, vente ? GREEN : RED, [
      { name: "Catégorie", value: `${vente ? "Vente" : "Achat"} ${b.categorie || ""}`, inline: true },
      { name: "Argent", value: b.type_argent || "-", inline: true },
      { name: "Saisi par", value: who || "-", inline: true },
    ]);
    await bigMoveAlert(supabaseAdmin, vente ? montant : -montant, `${vente ? "Vente" : "Achat"} ${b.categorie || ""} - ${motif}`, who);
    return NextResponse.json({ transaction: tx, stock });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// DELETE : annule complètement une transaction (stock remis, historique et compta retirés).
export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("cahier_vente");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const who = String((user as any)?.nom_perso || (user as any)?.discord_name || "");
    const { data: old } = await supabaseAdmin.from("cahier_transactions").select("type,montant,produit_nom,quantite").eq("id", id).maybeSingle();
    const { data, error: dbError } = await supabaseAdmin.rpc("obsidian_transaction_annuler", { p_id: id, p_user: who });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    if (old) await logAudit(supabaseAdmin, who, "Transaction annulée", `${old.quantite} x ${old.produit_nom}`, `${old.type} ${money(old.montant)}`);
    return NextResponse.json({ stock: (data as any)?.stock || null });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
