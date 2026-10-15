import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection } from "@/lib/direction";
import { sendDiscordAlert, ARMURERIE_CATEGORIES } from "@/lib/discordAlert";

// Mouvement de stock ATOMIQUE : tout (verrou, controle, historique, stock, compta) se fait dans la fonction SQL
// obsidian_mouvement_stock (lot 52). Plus de risque de sortie en double ni d'historique desynchronise.
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, user, error } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { stock_id, type, quantite, motif, membre, created_by, prix_unitaire: prixBody, type_argent } = await req.json();
    if (/^\s*ajustement/i.test(String(motif || "")) && !estDirection((user as any)?.site_role)) return NextResponse.json({ error: "Ajustement réservé au CEO et au COO" }, { status: 403 });
    const qte = Number(quantite);
    if (!stock_id || !Number.isFinite(qte) || qte <= 0) {
      return NextResponse.json({ error: "stock_id et quantite (> 0) sont requis" }, { status: 400 });
    }
    const isEntree = type === "entrée" || type === "entree";
    if (!isEntree && type !== "sortie") return NextResponse.json({ error: "Type de mouvement invalide" }, { status: 400 });
    const prix = isEntree && prixBody !== undefined && prixBody !== null && prixBody !== "" && Number(prixBody) >= 0 ? Number(prixBody) : null;

    const { data, error: rpcErr } = await supabaseAdmin.rpc("obsidian_mouvement_stock", {
      p_stock_id: stock_id,
      p_type: isEntree ? "entrée" : "sortie",
      p_quantite: qte,
      p_motif: motif || "",
      p_membre: membre || created_by || "",
      p_user: created_by || membre || "",
      p_prix: prix,
      p_type_argent: isEntree ? (type_argent || "sale") : "sale",
    });

    if (rpcErr) {
      const msg = rpcErr.message || "Erreur";
      if (/insuffisant/i.test(msg)) {
        const { data: st } = await supabaseAdmin.from("obsidian_stocks").select("nom,categorie").eq("id", stock_id).maybeSingle();
        const k = st && ARMURERIE_CATEGORIES.includes(st.categorie) ? "armurerie" : "stocks";
        await sendDiscordAlert(k, `⚠️ **Sortie refusée** sur **${st?.nom || "?"}** : ${qte} demandé(s) (${membre || created_by || "inconnu"})\n${msg}`, { title: "📦 Stock insuffisant", color: 0xef4444 });
      }
      return NextResponse.json({ error: msg }, { status: msg.includes("introuvable") ? 404 : 400 });
    }

    const stock = (data as any)?.stock;
    if (!stock) return NextResponse.json({ error: "Réponse inattendue du serveur" }, { status: 500 });

    // Alerte Discord à chaque mouvement, sur le webhook du bon module (armurerie vs stocks).
    // await obligatoire : sinon Vercel peut couper la fonction avant l'envoi.
    const kind = ARMURERIE_CATEGORIES.includes(stock.categorie) ? "armurerie" : "stocks";
    const seuil = Number(stock.seuil_alerte) || 0;
    const bas = seuil > 0 && Number(stock.quantite) <= seuil;
    await sendDiscordAlert(
      kind,
      `**${isEntree ? "➕ Entrée" : "➖ Sortie"}** sur **${stock.nom}** : ${qte} ${stock.unite || ""} (${membre || created_by || "inconnu"})\nNouvelle quantité : ${stock.quantite} ${stock.unite || ""}${bas ? ` - ⚠️ **sous le seuil d'alerte (${seuil})**` : ""}`,
      { title: kind === "armurerie" ? "🔫 Mouvement armurerie" : "📦 Mouvement stock", color: bas ? 0xef4444 : 0xa48fff }
    );

    return NextResponse.json({ stock });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
