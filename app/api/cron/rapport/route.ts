import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { postAlert, usd, GOLD } from "@/lib/alerts";

// Rapport hebdo automatique (Vercel Cron, lundi matin) : résumé de la semaine écoulée (lun -> dim).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const db = supabaseAdmin;
    const d = new Date(); d.setUTCHours(0, 0, 0, 0);
    const day = (d.getUTCDay() + 6) % 7; // lundi = 0
    const end = new Date(d.getTime() - day * 86400_000);        // lundi courant 00:00
    const start = new Date(end.getTime() - 7 * 86400_000);      // lundi précédent
    const s = start.toISOString(), e = end.toISOString();
    const [{ data: mvts }, { data: budget }, { data: stocksAll }] = await Promise.all([
      db.from("obsidian_mouvements").select("stock_nom,type,quantite,total,motif").gte("created_at", s).lt("created_at", e),
      db.rpc("obsidian_budget"),
      db.from("obsidian_stocks").select("nom,quantite,prix_unitaire,seuil_alerte"),
    ]);
    const ajust = (mvts || []).filter((m: any) => /^ajustement/i.test(m.motif || ""));
    const parRaison: Record<string, { n: number; val: number }> = {};
    ajust.forEach((m: any) => {
      const raison = (String(m.motif).replace(/^ajustement\s*-?\s*/i, "").split(" (")[0]) || "Autre";
      const v = (["entrée", "entree"].includes(m.type) ? 1 : -1) * (Number(m.total) || 0);
      (parRaison[raison] ??= { n: 0, val: 0 }).n++; parRaison[raison].val += v;
    });
    const ecartNet = Object.values(parRaison).reduce((a, x) => a + x.val, 0);
    const basSeuil = (stocksAll || []).filter((x: any) => Number(x.seuil_alerte) > 0 && Number(x.quantite) <= Number(x.seuil_alerte));
    const valStock = (stocksAll || []).reduce((a: number, x: any) => a + (Number(x.quantite) || 0) * (Number(x.prix_unitaire) || 0), 0);
    const caissePropre = (Number((budget as any)?.capital) || 0) + (Number((budget as any)?.propre) || 0);
    const seuilTreso = Number((budget as any)?.seuil) || 0;
    const [{ data: compta }, { data: actions }, { data: arr }, { data: dos }, { data: pac }, { data: aud }, { data: evt }] = await Promise.all([
      db.from("obsidian_comptabilite").select("type,montant,source").gte("created_at", s).lt("created_at", e),
      db.from("actions_illegales").select("membre,action,montant").gte("created_at", s).lt("created_at", e),
      db.from("arrestations").select("membre,amende,argent_perdu,type_argent").gte("created_at", s).lt("created_at", e),
      db.from("tribunal_dossiers").select("verdict,created_at").gte("created_at", s).lt("created_at", e),
      db.from("gm_pactes").select("statut,created_at").gte("created_at", s).lt("created_at", e),
      db.from("gm_audits").select("note").gte("created_at", s).lt("created_at", e),
      db.from("gm_evenements").select("type,statut,montant").gte("created_at", s).lt("created_at", e),
    ]);
    const rec = (compta || []).filter((x: any) => x.type === "recette").reduce((a: number, x: any) => a + Number(x.montant), 0);
    const dep = (compta || []).filter((x: any) => x.type !== "recette").reduce((a: number, x: any) => a + Number(x.montant), 0);
    const perAction: Record<string, { n: number; net: number }> = {};
    const perMembre: Record<string, number> = {};
    (actions || []).forEach((a: any) => {
      const m = Number(a.montant) || 0;
      (perAction[a.action] ??= { n: 0, net: 0 }).n++; perAction[a.action].net += m;
      perMembre[a.membre] = (perMembre[a.membre] || 0) + m;
    });
    const amendes = (arr || []).reduce((a: number, x: any) => a + Number(x.amende || 0), 0);
    const perdu = (arr || []).reduce((a: number, x: any) => a + Number(x.argent_perdu || 0), 0);
    const primeSale = (arr || []).filter((x: any) => (x.type_argent || "sale") === "sale").reduce((a: number, x: any) => a + Number(x.argent_perdu || 0), 0);
    const primePropre = perdu - primeSale;
    const top = Object.entries(perMembre).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const fr = (x: Date) => x.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
    await postAlert("rapport", `📊 Rapport hebdo - ${fr(start)} -> ${fr(new Date(end.getTime() - 86400_000))}`,
      `**Solde : ${usd(rec - dep)}**`, GOLD, [
        { name: "Recettes", value: usd(rec), inline: true },
        { name: "Dépenses", value: usd(dep), inline: true },
        { name: "Amendes (hors solde)", value: usd(amendes), inline: true },
        { name: `Actions (${(actions || []).length})`, value: Object.entries(perAction).map(([k, v]) => `${k} · ${v.n}x · ${usd(v.net)}`).join("\n") || " - ", inline: false },
        { name: `Arrestations (${(arr || []).length})`, value: `Primes de paie : ${usd(perdu)} (sale ${usd(primeSale)} · propre ${usd(primePropre)})`, inline: false },
        { name: "🏛️ Consortium", value: [`⚖️ ${(dos || []).length} dossier(s) · ${(dos || []).filter((x: any) => x.verdict === "coupable").length} coupable(s)`, `🤝 ${(pac || []).length} pacte(s) créé(s)`, `🔎 ${(aud || []).length} audit(s)${(aud || []).length ? ` · moyenne ${((aud || []).reduce((a: number, x: any) => a + Number(x.note), 0) / (aud || []).length).toFixed(1)}/10` : ""}`, `🚚 ${(evt || []).length} événement(s) · ${(evt || []).filter((x: any) => x.type === "convoi" && x.statut === "livre").length} convoi(s) livré(s)`].join("\n"), inline: false },
        { name: "💰 Trésorerie actuelle", value: [`Caisse propre : ${usd(caissePropre)}${seuilTreso > 0 ? (caissePropre < seuilTreso ? ` ⚠️ sous le seuil (${usd(seuilTreso)})` : ` (seuil ${usd(seuilTreso)})`) : ""}`, `Caisse sale : ${usd(Number((budget as any)?.sale) || 0)}`, `Valeur du stock : ${usd(valStock)}`].join("\n"), inline: false },
        { name: `⚖️ Inventaire (${ajust.length} ajustement(s))`, value: ajust.length ? Object.entries(parRaison).map(([k, v]) => `${k} · ${v.n}x · ${v.val >= 0 ? "+" : ""}${usd(v.val)}`).join("\n") + `\nÉcart net : ${ecartNet >= 0 ? "+" : ""}${usd(ecartNet)}` : "Aucun écart cette semaine", inline: false },
        { name: `📦 Stocks sous le seuil (${basSeuil.length})`, value: basSeuil.length ? basSeuil.slice(0, 10).map((x: any) => `${x.nom} : ${x.quantite}/${x.seuil_alerte}`).join("\n") : "Aucun", inline: false },
        { name: "🏆 Top employés (net actions)", value: top.map(([k, v], i) => `${i + 1}. ${k} - ${usd(v)}`).join("\n") || " - ", inline: false },
      ], ["RESP"]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
