"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { exportXlsx } from "@/lib/exportXlsx";

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const d2 = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

function weekRange(offset: number) {
  const start = new Date(); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - offset * 7); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return { start, end };
}

// Rapport hebdomadaire prêt à copier (ex: pour Discord) + export Excel.
export function WeeklyReport() {
  const [offset, setOffset] = useState(0);
  const [compta, setCompta] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [arrests, setArrests] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    if (!supabase) return;
    const [{ data: c }, { data: a }, { data: r }] = await Promise.all([
      supabase.from("obsidian_comptabilite").select("type,montant,categorie,created_at").limit(5000),
      supabase.from("actions_illegales").select("membre,action,montant,created_at").limit(5000),
      supabase.from("arrestations").select("membre,amende,argent_perdu,created_at").limit(5000),
    ]);
    setCompta(c || []); setActions(a || []); setArrests(r || []);
  }

  const { start, end } = weekRange(offset);
  const report = useMemo(() => {
    const inW = (d: string) => { const t = new Date(d).getTime(); return t >= start.getTime() && t < end.getTime(); };
    const c = compta.filter(e => inW(e.created_at));
    const rec = c.filter(e => e.type === "recette").reduce((s, e) => s + e.montant, 0);
    const dep = c.filter(e => e.type === "dépense").reduce((s, e) => s + e.montant, 0);
    const a = actions.filter(e => inW(e.created_at));
    const byAction: Record<string, { n: number; net: number }> = {};
    a.forEach(e => { const r = (byAction[e.action] ??= { n: 0, net: 0 }); r.n++; r.net += Number(e.montant) || 0; });
    const byMembre: Record<string, number> = {};
    a.forEach(e => { byMembre[e.membre] = (byMembre[e.membre] || 0) + (Number(e.montant) || 0); });
    const top = Object.entries(byMembre).sort((x, y) => y[1] - x[1]).slice(0, 5);
    const ar = arrests.filter(e => inW(e.created_at));
    const amendes = ar.reduce((s, e) => s + (Number(e.amende) || 0), 0);
    const perdu = ar.reduce((s, e) => s + (Number(e.argent_perdu) || 0), 0);
    const lines = [
      `📊 RAPPORT HEBDO - ${d2(start)} -> ${d2(new Date(end.getTime() - 1))}`,
      ``,
      `💰 Recettes : ${fmt(rec)} · Dépenses : ${fmt(dep)} · Solde : ${fmt(rec - dep)}`,
      ``,
      `🕶️ Actions illégales : ${a.length} · net ${fmt(a.reduce((s, e) => s + (Number(e.montant) || 0), 0))}`,
      ...Object.entries(byAction).map(([k, v]) => `  · ${k} : ${v.n}x · ${fmt(v.net)}`),
      ``,
      `🚔 Arrestations : ${ar.length} · Amendes : ${fmt(amendes)} (hors solde) · Argent perdu : ${fmt(perdu)}`,
      ``,
      `🏆 Top employés (net actions)`,
      ...(top.length ? top.map(([n, v], i) => `  ${i + 1}. ${n} - ${fmt(v)}`) : ["   - "]),
    ];
    return { text: lines.join("\n"), byAction, top, rec, dep, a, ar, amendes, perdu };
  }, [compta, actions, arrests, offset]);

  async function copy() {
    try { await navigator.clipboard.writeText(report.text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* presse-papier indisponible */ }
  }

  return (
    <div className="card" style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
        <div className="section-title" style={{ marginBottom: 0 }}>🗒️ Rapport hebdomadaire</div>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
          <select value={offset} onChange={e => setOffset(Number(e.target.value))} style={{ width: "auto" }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const r = weekRange(i); return <option key={i} value={i}>{i === 0 ? "Cette semaine" : `Semaine du ${d2(r.start)}`}</option>; })}
          </select>
          <button className="btn btn-gold btn-sm" onClick={copy}>{copied ? "✅ Copié" : "📋 Copier"}</button>
          <button className="btn btn-outline btn-sm" onClick={() => exportXlsx("rapport-hebdo", {
            Résumé: [{ Recettes: report.rec, Dépenses: report.dep, Solde: report.rec - report.dep, "Amendes (hors solde)": report.amendes, "Argent perdu (arrestations)": report.perdu }],
            Actions: report.a.map(e => ({ Date: new Date(e.created_at).toLocaleString("fr-FR"), Employé: e.membre, Action: e.action, "Montant ($)": e.montant })),
            Arrestations: report.ar.map(e => ({ Date: new Date(e.created_at).toLocaleString("fr-FR"), Employé: e.membre, "Amende ($)": e.amende, "Argent perdu ($)": e.argent_perdu })),
          })}>⬇️ Excel</button>
        </div>
      </div>
      <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: "0.78rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.875rem", margin: 0, color: "var(--text-muted)" }}>{report.text}</pre>
    </div>
  );
}
