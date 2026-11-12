import { requireAnyPermission } from "@/lib/serverAuth";
import { estBilan } from "@/lib/cabinetAcces";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";

const echap = (s: any) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const montantTxt = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR")} $`;
const dateFr = (s?: string | null) => (s ? new Date(s + (s.length === 10 ? "T12:00:00" : "")).toLocaleDateString("fr-FR") : "—");

// Facture imprimable (Ctrl+P → Enregistrer en PDF)
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await requireAnyPermission(PERMS_BUREAU);
  if (!r.authorized || !estBilan(r.user)) return new Response("Réservé au bureau", { status: 403 });
  const { data: f } = await r.supabaseAdmin.from("cabinet_factures_gouvernement").select("*").eq("id", id).maybeSingle();
  if (!f) return new Response("Facture introuvable", { status: 404 });
  const lignes = (f.detail || []).map((l: any) => `<tr><td>${echap(dateFr(l.date))} ${echap(l.heure || "")}</td><td>${echap(l.tribunal || "")}</td><td>${echap(l.client)}</td><td>${echap(l.chefs || "")}</td><td>${echap(l.avocat || "")}</td><td class="r">${montantTxt(l.honoraire)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${echap(f.numero)}</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:40px;font-size:13px}
h1{font-size:22px;margin:0 0 4px} .muted{color:#555}
.haut{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #b08a3e;padding-bottom:12px}
table{width:100%;border-collapse:collapse;margin-top:20px} th,td{border-bottom:1px solid #ddd;padding:7px;text-align:left;vertical-align:top}
th{background:#f4efe3} .r{text-align:right} .total{font-size:16px;font-weight:bold;text-align:right;margin-top:14px}
.statut{display:inline-block;padding:3px 10px;border-radius:4px;background:${f.statut === "payee" ? "#dff3e4" : "#fff3d6"}}
.bouton{margin:20px 0} @media print{.bouton{display:none} body{margin:20px}}
</style></head><body>
<div class="bouton"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>
<div class="haut">
  <div><h1>FACTURE ${echap(f.numero)}</h1><div class="muted">Émise le ${dateFr(f.created_at)} · Semaine du ${dateFr(f.semaine)}</div></div>
  <div style="text-align:right"><strong>Cabinet Varelli &amp; Associés</strong><br><span class="muted">Comparutions immédiates</span></div>
</div>
<p><strong>Destinataire :</strong> Gouvernement de San Andreas</p>
<p><span class="statut">${f.statut === "payee" ? `Payée le ${dateFr(f.payee_at)}` : "À régler"}</span></p>
<table><thead><tr><th>Date</th><th>Tribunal</th><th>Client</th><th>Chef(s) d'accusation</th><th>Avocat</th><th class="r">Honoraire</th></tr></thead>
<tbody>${lignes || '<tr><td colspan="6">Aucune comparution</td></tr>'}</tbody></table>
<div class="total">Total (${f.nb_comparutions} comparution(s)) : ${montantTxt(f.total)}</div>
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
