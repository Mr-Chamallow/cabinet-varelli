import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { postAlert, GREEN, ORANGE, BLUE } from "@/lib/alerts";
import { fmtDelai } from "@/lib/actionTypes";

// À appeler toutes les 5 min (cron-job.org) avec l'en-tête  Authorization: Bearer <CRON_SECRET>.
// 1) délais terminés (Go fast…)  2) stock bas  3) rappel d'opération (RDV) dans l'heure.
export const dynamic = "force-dynamic";

// "2026-10-10" + "21:30" (heure de Paris) -> timestamp UTC
function parisToUtc(date: string, heure: string): number {
  const base = new Date(`${date}T${heure.length === 5 ? heure : heure.slice(0, 5)}:00Z`).getTime();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(base));
  const g = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asParis = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return base - (asParis - base);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const db = supabaseAdmin;
  const out: Record<string, any> = {};
  const now = Date.now();

  // 1) Délais terminés
  try {
    const { data: types } = await db.from("actions_illegales_types").select("nom,icon,delai_minutes").eq("actif", true).gt("delai_minutes", 0);
    let n = 0;
    for (const t of types || []) {
      const limit = new Date(now - t.delai_minutes * 60_000).toISOString();
      const { data: rows } = await db.from("actions_illegales").select("id,membre,created_at").eq("action", t.nom).eq("delai_alerte", false).lte("created_at", limit);
      if (!rows || rows.length === 0) continue;
      const byMembre = new Map<string, any[]>();
      rows.forEach((r: any) => byMembre.set(r.membre, [...(byMembre.get(r.membre) || []), r]));
      for (const [membre, list] of byMembre) {
        // seulement si c'est bien la DERNIÈRE fois que la personne a fait cette action
        const { data: newer } = await db.from("actions_illegales").select("id").eq("action", t.nom).eq("membre", membre).gt("created_at", limit).limit(1);
        if (!newer || newer.length === 0) {
          await postAlert("delais", `⏳ ${t.icon || "🕶️"} ${t.nom} de nouveau disponible`, `**${membre}** peut refaire « ${t.nom} » (délai : ${fmtDelai(t.delai_minutes)}).`, GREEN);
          n++;
        }
      }
      await db.from("actions_illegales").update({ delai_alerte: true }).in("id", rows.map((r: any) => r.id));
    }
    out.delais = n;
  } catch (e: any) { out.delais = `erreur: ${e?.message || e}`; }

  // 2) Stock bas
  try {
    const { data: stocks } = await db.from("obsidian_stocks").select("id,nom,emoji,quantite,seuil_alerte,unite,alerte_envoyee").gt("seuil_alerte", 0);
    const nowLow = (stocks || []).filter((s: any) => s.quantite <= s.seuil_alerte && !s.alerte_envoyee);
    const recovered = (stocks || []).filter((s: any) => s.quantite > s.seuil_alerte && s.alerte_envoyee);
    if (nowLow.length) {
      await postAlert("stocks", "📦 Stock bas", nowLow.map((s: any) => `${s.emoji || "📦"} **${s.nom}** : ${s.quantite} ${s.unite || ""} (seuil ${s.seuil_alerte})`).join("\n"), ORANGE);
      await db.from("obsidian_stocks").update({ alerte_envoyee: true }).in("id", nowLow.map((s: any) => s.id));
    }
    if (recovered.length) await db.from("obsidian_stocks").update({ alerte_envoyee: false }).in("id", recovered.map((s: any) => s.id));
    out.stock_bas = nowLow.length;
  } catch (e: any) { out.stock_bas = `erreur: ${e?.message || e}`; }

  // 3) Rappel d'opération dans l'heure
  try {
    const today = new Date(now).toISOString().slice(0, 10);
    const tomorrow = new Date(now + 86400_000).toISOString().slice(0, 10);
    const { data: rdvs } = await db.from("obsidian_rdv").select("*").in("date", [today, tomorrow]).eq("rappel_envoye", false);
    let n = 0;
    for (const r of rdvs || []) {
      if (!r.heure) continue;
      const diff = parisToUtc(r.date, r.heure) - now;
      if (diff > 0 && diff <= 60 * 60_000) {
        await postAlert("rdv", `⏰ Rappel — ${r.titre}`, `Dans **${Math.max(1, Math.round(diff / 60000))} min** (${r.heure})`, BLUE, [
          { name: "Client", value: r.client || "—", inline: true }, { name: "Lieu", value: r.lieu || "—", inline: true },
        ]);
        await db.from("obsidian_rdv").update({ rappel_envoye: true }).eq("id", r.id);
        n++;
      }
    }
    out.rappels = n;
  } catch (e: any) { out.rappels = `erreur: ${e?.message || e}`; }

  // 4) Sanctions d'audit terminées
  try {
    const { data: aud } = await db.from("gm_audits").select("id,organisation,sanction,sanction_fin").eq("sanction_alerte", false).not("sanction_fin", "is", null).lte("sanction_fin", new Date(now).toISOString());
    for (const a of aud || []) {
      await postAlert("gm", `✅ Sanction levée — ${a.organisation}`, `« ${a.sanction || "Sanction"} » est terminée.`, GREEN);
      await db.from("gm_audits").update({ sanction_alerte: true }).eq("id", a.id);
    }
    out.sanctions = (aud || []).length;
  } catch (e: any) { out.sanctions = `erreur: ${e?.message || e}`; }

  return NextResponse.json({ ok: true, ...out });
}
