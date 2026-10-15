import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estDirection, RAISONS_INVENTAIRE } from "@/lib/direction";
import { sendDiscordAlert } from "@/lib/discordAlert";

// Inventaire rapide : plusieurs ajustements d'un coup. Reserve CEO / COO.
// Body : { lines: [{ stock_id, compte, raison, note? }] }
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, user, error } = await requireAnyPermission(["obsidian_stocks", "obsidian_armurerie"]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    if (!estDirection((user as any)?.site_role)) return NextResponse.json({ error: "Inventaire réservé au CEO et au COO" }, { status: 403 });

    const { lines } = await req.json();
    if (!Array.isArray(lines) || lines.length === 0) return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });
    if (lines.length > 300) return NextResponse.json({ error: "Trop de lignes (300 max)" }, { status: 400 });
    const who = (user as any)?.nom_perso || (user as any)?.discord_name || "?";

    const stocks: Record<string, any> = {};
    const results: any[] = [];
    const resume: string[] = [];
    for (const l of lines) {
      const compte = Number(l.compte);
      const raison = RAISONS_INVENTAIRE.includes(l.raison) ? l.raison : "Erreur de comptage";
      if (!l.stock_id || l.compte === "" || l.compte === null || !Number.isFinite(compte) || compte < 0) { results.push({ stock_id: l.stock_id, ok: false, error: "Quantité invalide" }); continue; }
      const { data: st } = await supabaseAdmin.from("obsidian_stocks").select("id,nom,quantite,unite").eq("id", l.stock_id).maybeSingle();
      if (!st) { results.push({ stock_id: l.stock_id, ok: false, error: "Stock introuvable" }); continue; }
      const diff = compte - Number(st.quantite);
      if (diff === 0) { results.push({ stock_id: st.id, ok: true, diff: 0, stock: st }); continue; }
      const { data, error: rpcErr } = await supabaseAdmin.rpc("obsidian_mouvement_stock", {
        p_stock_id: st.id, p_type: diff > 0 ? "entrée" : "sortie", p_quantite: Math.abs(diff),
        p_motif: "Ajustement - " + raison + (l.note ? " (" + String(l.note).slice(0, 80) + ")" : ""),
        p_membre: who, p_user: who, p_prix: null, p_type_argent: "sale",
      });
      if (rpcErr) { results.push({ stock_id: st.id, ok: false, error: rpcErr.message }); continue; }
      const ns = (data as any)?.stock;
      stocks[st.id] = ns;
      results.push({ stock_id: st.id, ok: true, diff, stock: ns });
      resume.push(`${diff > 0 ? "➕" : "➖"} **${st.nom}** : ${st.quantite} -> ${ns?.quantite} (${diff > 0 ? "+" : ""}${diff}) · ${raison}`);
    }
    if (resume.length) {
      await sendDiscordAlert("stocks", `Par **${who}**\n${resume.slice(0, 25).join("\n")}${resume.length > 25 ? `\n... (+${resume.length - 25})` : ""}`, { title: `⚖️ Inventaire : ${resume.length} ajustement(s)`, color: 0xeab308 });
    }
    return NextResponse.json({ results, stocks: Object.values(stocks) });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
