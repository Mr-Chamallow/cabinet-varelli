import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { DiscordWebhookKind, sendDiscordMessage } from "@/lib/discordAlert";
import { usd, GOLD } from "@/lib/alerts";

// Test d'un webhook : envoie un message construit avec les VRAIES données les plus récentes de l'app (pas un texte type).
const kinds: DiscordWebhookKind[] = ["stocks", "armurerie", "rdv", "contrats", "fiches", "base_donnees", "arrestations", "actions", "compta", "delais", "membres", "admin", "rapport", "gm"];
const sd = (d?: string) => (d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "-");

export async function POST(req: Request) {
  const { authorized, error, supabaseAdmin: db } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
  const { kind } = await req.json();
  if (!kinds.includes(kind)) return NextResponse.json({ error: "kind invalide" }, { status: 400 });

  const last = async (table: string, order = "created_at", filter?: (q: any) => any) => {
    let q = db.from(table).select("*"); if (filter) q = filter(q);
    const { data } = await q.order(order, { ascending: false }).limit(1);
    return data?.[0] as any;
  };
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  let title = `🔔 Test ${kind}`, desc = "", fields: { name: string; value: string; inline?: boolean }[] = [];
  const none = () => { desc = "Aucune donnée réelle à afficher pour l'instant (rien d'enregistré)."; };

  try {
    if (kind === "stocks" || kind === "armurerie") {
      const arm = ["arme", "munition", "accessoire", "explosif", "kev", "gilet"];
      const { data: mv } = await db.from("obsidian_mouvements").select("*").order("created_at", { ascending: false }).limit(60);
      const { data: st } = await db.from("obsidian_stocks").select("id,categorie");
      const cat = new Map((st || []).map((x: any) => [x.id, x.categorie]));
      const m = (mv || []).find((x: any) => arm.includes(cat.get(x.stock_id) as string) === (kind === "armurerie"));
      if (!m) none(); else {
        title = `🔔 Test ${kind} - dernier mouvement réel`;
        desc = `${m.type === "sortie" ? "📤 Sortie" : "📥 Entrée"} de **${m.quantite} x ${m.stock_nom || "?"}**${m.prix_unitaire ? ` à ${usd(m.prix_unitaire)}` : ""}`;
        fields = [{ name: "Par", value: String(m.created_by || m.membre || "-"), inline: true }, { name: "Date", value: sd(m.created_at), inline: true }, { name: "Motif", value: String(m.motif || m.notes || "-") }];
      }
    } else if (kind === "rdv") {
      const r = await last("obsidian_rdv");
      if (!r) none(); else { title = `🔔 Test rdv - ${r.titre}`; desc = `📅 ${r.date || "-"} ${r.heure || ""}`; fields = [{ name: "Lieu", value: String(r.lieu || "-"), inline: true }, { name: "Employé", value: String(r.employe || r.created_by || "-"), inline: true }, { name: "Statut", value: String(r.statut || "-"), inline: true }]; }
    } else if (kind === "contrats") {
      const c = await last("obsidian_contrats");
      if (!c) none(); else { title = `🔔 Test contrats - ${c.titre}`; desc = `${c.type || ""} · ${c.statut || ""}`; fields = [{ name: "Récompense", value: usd(c.recompense || 0), inline: true }, { name: "Affectés", value: (c.membres_affectes || []).join(", ") || "-", inline: true }]; }
    } else if (kind === "fiches" || kind === "base_donnees") {
      const f = await last("obsidian_fiches");
      if (!f) none(); else { title = `🔔 Test ${kind} - ${f.nom}`; desc = `${f.type || ""} · ${f.statut || ""} · priorité ${f.priorite || "-"}`; fields = [{ name: "Organisation", value: String(f.organisation || "-"), inline: true }, { name: "Créée le", value: sd(f.created_at), inline: true }]; }
    } else if (kind === "arrestations") {
      const a = await last("arrestations");
      if (!a) none(); else { title = `🔔 Test arrestations - ${a.membre}`; desc = `Amende **${usd(a.amende || 0)}** · argent perdu **${usd(a.argent_perdu || 0)}**`; fields = [{ name: "Date", value: sd(a.created_at), inline: true }]; }
    } else if (kind === "actions" || kind === "delais") {
      const a = await last("actions_illegales");
      if (!a) none(); else { title = `🔔 Test ${kind} - ${a.action}`; desc = `**${a.membre}** · ${Number(a.montant) >= 0 ? "gain" : "perte"} **${usd(Math.abs(Number(a.montant) || 0))}**`; fields = [{ name: "Date", value: sd(a.created_at), inline: true }]; }
    } else if (kind === "compta") {
      const { data } = await db.from("obsidian_comptabilite").select("type,montant,type_argent").gte("created_at", week);
      const rows = data || []; const rec = rows.filter((r: any) => r.type === "recette").reduce((s: number, r: any) => s + (r.montant || 0), 0), dep = rows.filter((r: any) => r.type !== "recette").reduce((s: number, r: any) => s + (r.montant || 0), 0);
      title = "🔔 Test compta - 7 derniers jours"; desc = `${rows.length} écritures`; fields = [{ name: "Recettes", value: usd(rec), inline: true }, { name: "Dépenses", value: usd(dep), inline: true }, { name: "Net", value: usd(rec - dep), inline: true }];
    } else if (kind === "membres") {
      const { data, count } = await db.from("site_logins").select("discord_name,nom_perso,site_role", { count: "exact" }).limit(5);
      title = "🔔 Test membres"; desc = `${count ?? (data || []).length} membres inscrits`; fields = (data || []).map((m: any) => ({ name: m.nom_perso || m.discord_name || "?", value: String(m.site_role || "aucun rôle"), inline: true }));
    } else if (kind === "admin") {
      const j = await last("journal_audit");
      if (!j) none(); else { title = "🔔 Test admin - dernière action journalisée"; desc = `**${j.acteur}** · ${j.action} · ${j.cible || ""}`; fields = [{ name: "Date", value: sd(j.created_at), inline: true }]; }
    } else if (kind === "rapport") {
      const [c, a, ar] = await Promise.all([
        db.from("obsidian_comptabilite").select("type,montant").gte("created_at", week),
        db.from("actions_illegales").select("montant").gte("created_at", week),
        db.from("arrestations").select("amende").gte("created_at", week),
      ]);
      const net = (c.data || []).reduce((s: number, r: any) => s + (r.type === "recette" ? 1 : -1) * (r.montant || 0), 0);
      title = "🔔 Test rapport - 7 derniers jours"; desc = "Aperçu avec les chiffres réels de la semaine.";
      fields = [{ name: "Net compta", value: usd(net), inline: true }, { name: "Actions", value: String((a.data || []).length), inline: true }, { name: "Arrestations", value: String((ar.data || []).length), inline: true }];
    } else if (kind === "gm") {
      const g = await last("gm_reputation_log");
      if (!g) none(); else { title = `🔔 Test gm - ${g.organisation}`; desc = `Réputation ${g.delta > 0 ? "+" : ""}${g.delta} · ${g.motif || ""}`; fields = [{ name: "Date", value: sd(g.created_at), inline: true }]; }
    }
  } catch (e: any) { desc = `Données indisponibles (${e?.message || e}).`; }

  const r = await sendDiscordMessage(kind, { title, description: desc, color: GOLD, fields: fields.length ? fields : undefined });
  if (!r.ok) return NextResponse.json({ error: r.error || "Envoi échoué" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
