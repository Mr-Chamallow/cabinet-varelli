"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { exportXlsx } from "@/lib/exportXlsx";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Kpi, Delta, Panel, Tabs, LineChart, BarChart, HBars, Donut, Heat, DataTable, fmt, fmtK, pct, sum, mean, median, stdev, weekKey, lastWeeks, shortWeek, linReg } from "@/components/hub/Charts";

type Tab = "synthese" | "flux" | "categories" | "employes" | "sources" | "marges" | "semaines" | "journal" | "expert";
const TABS: { k: Tab; label: string }[] = [
  { k: "synthese", label: "📊 Synthèse" }, { k: "flux", label: "📈 Flux & trésorerie" }, { k: "categories", label: "🗂️ Catégories" },
  { k: "employes", label: "👥 Employés" }, { k: "sources", label: "🧬 Sources & argent" }, { k: "marges", label: "🏷️ Marges produits" }, { k: "semaines", label: "🔒 Semaines" }, { k: "journal", label: "📜 Journal" }, { k: "expert", label: "🧠 Indicateurs experts" },
];
const PERIODS = [{ k: 1, label: "Semaine" }, { k: 4, label: "4 sem." }, { k: 12, label: "12 sem." }, { k: 0, label: "Tout" }];
const SRC: Record<string, string> = { action: "🕶️ Action illégale", arrestation: "🚔 Arrestation", transaction: "🧮 Transaction", stock: "📦 Achat de stock", paie: "💵 Paie & commissions", contrat: "📋 Contrat", "blanchiment-frais": "🧼 Frais de blanchiment", manuel: "✍️ Saisie historique" };
const COL = { rec: "var(--success)", dep: "var(--danger)", gold: "var(--gold)", info: "var(--info)", warn: "var(--warning)" };
const MONEY_COL: Record<string, string> = { sale: "var(--danger)", propre: "var(--success)", mixte: "var(--warning)" };

export default function ComptaHubPage() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_comptabilite"))) window.location.href = "/"; }, [user, userLoading]);
  const [entries, setEntries] = useState<any[]>([]);
  const [arrests, setArrests] = useState<any[]>([]);
  const [raw, setRaw] = useState<any[]>([]);
  const [mvts, setMvts] = useState<any[]>([]);
  const [trans, setTrans] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [semaines, setSemaines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("synthese");
  const [weeks, setWeeks] = useState(4);
  const [q, setQ] = useState(""); const [fType, setFType] = useState(""); const [fCat, setFCat] = useState(""); const [fMembre, setFMembre] = useState(""); const [fSrc, setFSrc] = useState("");
  const [limit, setLimit] = useState(100);

  useEffect(() => { load(); }, []);
  useRealtimeTable(["obsidian_comptabilite", "arrestations", "obsidian_semaines"], load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    // Clôture automatique des semaines terminées (en plus du cron de la base) - silencieux.
    await fetch("/api/obsidian/cloture", { method: "POST" }).catch(() => {});
    const [{ data }, { data: ar }, { data: mv }, { data: tr }, { data: st }, { data: sw }] = await Promise.all([
      supabase.from("obsidian_comptabilite").select("*").order("created_at", { ascending: false }).limit(10000),
      supabase.from("arrestations").select("id,membre,amende,argent_perdu,created_at").limit(5000),
      supabase.from("obsidian_mouvements").select("stock_nom,type,quantite,total,motif,created_at").limit(10000),
      supabase.from("cahier_transactions").select("type,montant,quantite,produit_nom,categorie,created_at").limit(10000),
      supabase.from("obsidian_stocks").select("nom,categorie,quantite,prix_unitaire").limit(2000),
      supabase.from("obsidian_semaines").select("*").order("semaine", { ascending: false }).limit(200),
    ]);
    const rows = (data || []).map((e: any) => ({ ...e, montant: Number(e.montant) || 0, source: e.source || "manuel" }));
    setRaw(rows);
    // Blanchiment = TRANSFERT sale -> propre : seule la perte (frais) est une vraie dépense.
    const by: Record<string, any[]> = {}; rows.filter(e => e.source === "blanchiment").forEach(e => (by[e.source_id || e.id] ??= []).push(e));
    const frais = Object.values(by).map(g => { const out = g.find(x => x.type !== "recette"), inn = g.find(x => x.type === "recette"); const f = (out?.montant || 0) - (inn?.montant || 0); return { ...(out || g[0]), id: "bl-" + (out || g[0]).id, type: "dépense", categorie: "Frais de blanchiment", montant: Math.max(0, f), type_argent: "sale", source: "blanchiment-frais" }; });
    setEntries([...rows.filter(e => e.source !== "blanchiment"), ...frais].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")));
    setArrests(ar || []); setMvts(mv || []); setTrans(tr || []); setStocks(st || []); setSemaines(sw || []); setLoading(false);
  }

  const t0 = useMemo(() => { if (!weeks) return 0; const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - (weeks - 1) * 7); return d.getTime(); }, [weeks]);
  const tPrev = useMemo(() => (weeks ? t0 - weeks * 7 * 864e5 : 0), [t0, weeks]);
  const cur = useMemo(() => entries.filter(e => new Date(e.created_at).getTime() >= t0), [entries, t0]);
  const prev = useMemo(() => (weeks ? entries.filter(e => { const t = new Date(e.created_at).getTime(); return t >= tPrev && t < t0; }) : []), [entries, tPrev, t0, weeks]);
  const rec = (l: any[]) => sum(l.filter(e => e.type === "recette").map(e => e.montant));
  const dep = (l: any[]) => sum(l.filter(e => e.type !== "recette").map(e => e.montant));
  const R = rec(cur), D = dep(cur), N = R - D;
  const curArr = arrests.filter(a => new Date(a.created_at).getTime() >= t0);
  const amendes = sum(curArr.map(a => Number(a.amende) || 0));

  const nW = weeks ? Math.max(weeks, 4) : 16;
  const wks = useMemo(() => lastWeeks(Math.min(nW, 26)), [nW]);
  const byWeek = useMemo(() => wks.map(w => { const l = entries.filter(e => weekKey(e.created_at) === w); return { w, r: rec(l), d: dep(l) }; }), [entries, wks]);
  const solde = useMemo(() => { const base = sum(entries.filter(e => weekKey(e.created_at) < wks[0]).map(e => (e.type === "recette" ? 1 : -1) * e.montant)); let a = base; return byWeek.map(x => (a += x.r - x.d)); }, [byWeek, entries, wks]);
  const soldeTotal = sum(entries.map(e => (e.type === "recette" ? 1 : -1) * e.montant));

  const group = (l: any[], key: (e: any) => string) => { const m: Record<string, { r: number; d: number; n: number; max: number }> = {}; l.forEach(e => { const k = key(e) || "-"; const x = (m[k] ??= { r: 0, d: 0, n: 0, max: 0 }); if (e.type === "recette") x.r += e.montant; else x.d += e.montant; x.n++; x.max = Math.max(x.max, e.montant); }); return Object.entries(m).map(([k, v]) => ({ k, ...v, net: v.r - v.d })).sort((a, b) => b.r + b.d - (a.r + a.d)); };
  const cats = useMemo(() => group(cur, e => e.categorie), [cur]);
  const membres = useMemo(() => group(cur.filter(e => e.membre), e => e.membre), [cur]);
  const sources = useMemo(() => group(cur, e => e.source), [cur]);
  const argent = useMemo(() => group(cur, e => e.type_argent || "sale"), [cur]);

  const journal = useMemo(() => {
    const s = q.toLowerCase();
    return cur.filter(e => (!fType || e.type === fType) && (!fCat || e.categorie === fCat) && (!fMembre || e.membre === fMembre) && (!fSrc || e.source === fSrc) &&
      (!s || `${e.motif} ${e.categorie} ${e.membre} ${e.created_by}`.toLowerCase().includes(s)));
  }, [cur, q, fType, fCat, fMembre, fSrc]);

  // Indicateurs experts
  const ex = useMemo(() => {
    const wR = byWeek.map(x => x.r), wD = byWeek.map(x => x.d), wN = byWeek.map((x, i) => wR[i] - wD[i]);
    const amounts = cur.map(e => e.montant); const mu = mean(amounts), sd = stdev(amounts);
    const anomalies = cur.filter(e => sd > 0 && e.montant > mu + 2 * sd).slice(0, 8);
    const reg = linReg(wN); const proj = [1, 2, 3, 4].map(i => reg.a * (wN.length - 1 + i) + reg.b);
    const burn = mean(wD.slice(-4)); const runway = burn > 0 ? soldeTotal / burn : Infinity;
    const share = cats.filter(c => c.r > 0).map(c => c.r / (R || 1)); const hhi = sum(share.map(s => s * s)) * 10000;
    const bestI = wN.indexOf(Math.max(...wN)), worstI = wN.indexOf(Math.min(...wN));
    const grid = Array.from({ length: 7 }, () => Array(6).fill(0));
    cur.forEach(e => { const d = new Date(e.created_at); grid[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 4)]++; });
    return { wN, mu, sd, med: median(amounts), anomalies, proj, burn, runway, hhi, bestI, worstI, grid, top3: sum(cats.filter(c => c.r > 0).slice(0, 3).map(c => c.r)) / (R || 1) * 100, vol: stdev(wN), growth: wN.length > 1 ? (mean(wN.slice(-2)) - mean(wN.slice(0, 2))) : 0 };
  }, [byWeek, cur, cats, R, soldeTotal]);

  function exportAll() {
    exportXlsx("comptabilite", {
      Journal: entries.map(e => ({ Date: new Date(e.created_at).toLocaleString("fr-FR"), Type: e.type, Catégorie: e.categorie, Montant: e.montant, Argent: e.type_argent, Motif: e.motif || "", Employé: e.membre || "", Source: e.source, "Saisi par": e.created_by || "" })),
      Catégories: group(entries, e => e.categorie).map(c => ({ Catégorie: c.k, Recettes: c.r, Dépenses: c.d, Net: c.net, Opérations: c.n })),
      Employés: group(entries.filter(e => e.membre), e => e.membre).map(c => ({ Employé: c.k, Recettes: c.r, Pertes: c.d, Net: c.net, Opérations: c.n })),
      Semaines: byWeek.map((x, i) => ({ Semaine: x.w, Recettes: x.r, Dépenses: x.d, Net: x.r - x.d, Solde: solde[i] })),
    });
  }

  const cash = useMemo(() => { const m: Record<string, number> = { sale: 0, propre: 0, mixte: 0 }; raw.forEach(e => { m[e.type_argent || "sale"] = (m[e.type_argent || "sale"] || 0) + (e.type === "recette" ? 1 : -1) * e.montant; }); return m; }, [raw]);
  const transferts = useMemo(() => raw.filter(e => e.source === "blanchiment" && e.type !== "recette"), [raw]);
  const marges = useMemo(() => {
    const m: Record<string, { qIn: number; cost: number; qOut: number; rev: number }> = {};
    const g = (n: string) => (m[n] ??= { qIn: 0, cost: 0, qOut: 0, rev: 0 });
    mvts.filter(x => /^(entrée|entree)$/.test(x.type) && !/^annulation/i.test(x.motif || "")).forEach(x => { const o = g(x.stock_nom); o.qIn += Number(x.quantite) || 0; o.cost += Number(x.total) || 0; });
    trans.filter(x => x.type === "entrée" && x.produit_nom).forEach(x => { const o = g(x.produit_nom); o.qOut += Number(x.quantite) || 0; o.rev += Number(x.montant) || 0; });
    return Object.entries(m).filter(([, v]) => v.qIn || v.qOut).map(([nom, v]) => { const pc = v.qIn ? v.cost / v.qIn : 0, pv = v.qOut ? v.rev / v.qOut : 0; const stock = stocks.find(s => s.nom === nom); return { nom, ...v, pc, pv, mu: v.qOut && v.qIn ? pv - pc : 0, mt: v.rev - v.qOut * pc, pct: v.rev ? ((v.rev - v.qOut * pc) / v.rev) * 100 : 0, stock: stock ? Number(stock.quantite) : 0 }; }).sort((a, b) => b.mt - a.mt);
  }, [mvts, trans, stocks]);
  const weeksTable = useMemo(() => {
    const all = [...new Set([...raw.map(e => e.semaine), ...semaines.map(s => s.semaine)])].filter(Boolean).sort().reverse();
    return all.map(w => { const l = raw.filter(e => e.semaine === w); const net = sum(l.map(e => (e.type === "recette" ? 1 : -1) * e.montant)); const cl = semaines.find(s => s.semaine === w); return { w, cl, net, paies: sum(l.filter(e => e.source === "paie").map(e => e.montant)), nb: l.length }; });
  }, [raw, semaines]);
  const isCEO = /^(CEO|Associé)/.test((user as any)?.role || "");
  async function rouvrir(w: string) { if (!window.confirm(`Rouvrir la semaine du ${w} ? Elle redevient modifiable.`)) return; const r = await fetch("/api/obsidian/cloture", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ semaine: w }) }); if (!r.ok) alert("❌ " + (await r.json()).error); else load(); }
  const allCats = useMemo(() => [...new Set(entries.map(e => e.categorie))].filter(Boolean).sort(), [entries]);
  const allMembres = useMemo(() => [...new Set(entries.map(e => e.membre))].filter(Boolean).sort(), [entries]);
  const labels = byWeek.map(x => shortWeek(x.w));

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">Dashboard Obsidian</a>
      <div className="page-header">
        <div><h1 className="page-title">💰 Hub Comptabilité</h1><p className="page-subtitle">Lecture seule · alimenté automatiquement par les Actions illégales, Arrestations et Transactions</p><div className="gold-line" /></div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {PERIODS.map(p => <button key={p.k} className={`btn btn-sm ${weeks === p.k ? "btn-gold" : "btn-outline"}`} onClick={() => setWeeks(p.k)}>{p.label}</button>)}
          <button className="btn btn-outline btn-sm" onClick={exportAll}>📥 Export Excel</button>
        </div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={k => setTab(k as Tab)} />
      {loading ? <LoadingBlock /> : <>
        {tab === "synthese" && <>
          <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
            <Kpi icon="↑" label="Recettes" value={fmt(R)} color={COL.rec} sub={<>vs période préc. <Delta cur={R} prev={rec(prev)} /></>} />
            <Kpi icon="↓" label="Dépenses & pertes" value={fmt(D)} color={COL.dep} sub={<>vs période préc. <Delta cur={D} prev={dep(prev)} invert /></>} />
            <Kpi icon="⚖️" label="Résultat net" value={fmt(N)} color={N >= 0 ? COL.rec : COL.dep} sub={<>vs période préc. <Delta cur={N} prev={rec(prev) - dep(prev)} /></>} />
            <Kpi icon="🏦" label="Trésorerie cumulée" value={fmt(soldeTotal)} color={soldeTotal >= 0 ? COL.rec : COL.dep} sub="depuis le début" />
            <Kpi icon="📐" label="Marge" value={R ? pct((N / R) * 100) : "-"} sub="net / recettes" />
            <Kpi icon="🚔" label="Amendes (primes de paie)" value={fmt(amendes)} color={COL.warn} sub={`${curArr.filter(a => Number(a.amende) > 0).length} amende(s)`} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
            <Panel title="Recettes vs dépenses par semaine"><BarChart labels={labels} series={[{ nom: "Recettes", color: COL.rec, values: byWeek.map(x => x.r) }, { nom: "Dépenses", color: COL.dep, values: byWeek.map(x => x.d) }]} /></Panel>
            <Panel title="Trésorerie cumulée"><LineChart area labels={labels} series={[{ nom: "Solde", color: COL.gold, values: solde }]} /></Panel>
            <Panel title="Top catégories de recettes"><HBars color={COL.rec} rows={cats.filter(c => c.r > 0).sort((a, b) => b.r - a.r).slice(0, 6).map(c => ({ label: c.k, value: c.r, sub: `${c.n} op.` }))} /></Panel>
            <Panel title="Top employés (net)"><HBars rows={[...membres].sort((a, b) => b.net - a.net).slice(0, 6).map(m => ({ label: m.k, value: m.net, sub: `${m.n} op.` }))} /></Panel>
          </div>
        </>}

        {tab === "flux" && <div style={{ display: "grid", gap: "1.25rem" }}>
          <Panel title="Résultat net hebdomadaire + tendance"><LineChart labels={labels} series={[{ nom: "Net", color: COL.info, values: ex.wN }, { nom: "Recettes", color: COL.rec, values: byWeek.map(x => x.r) }, { nom: "Dépenses", color: COL.dep, values: byWeek.map(x => x.d) }]} /></Panel>
          <Panel title="Solde de trésorerie"><LineChart area labels={labels} series={[{ nom: "Solde", color: COL.gold, values: solde }]} /></Panel>
          <Panel title="Tableau hebdomadaire"><DataTable head={["Semaine", "Recettes", "Dépenses", "Net", "Solde"]} rows={[...byWeek].reverse().map((x, i) => [`Sem. du ${shortWeek(x.w)}`, <span style={{ color: COL.rec }}>{fmt(x.r)}</span>, <span style={{ color: COL.dep }}>{fmt(x.d)}</span>, <b style={{ color: x.r - x.d >= 0 ? COL.rec : COL.dep }}>{fmt(x.r - x.d)}</b>, fmt(solde[solde.length - 1 - i])])} /></Panel>
        </div>}

        {tab === "categories" && <Panel title="Détail par catégorie" right={<small style={{ color: "var(--text-dim)" }}>{cats.length} catégories</small>}>
          <DataTable head={["Catégorie", "Op.", "Recettes", "Dépenses", "Net", "Moyenne", "Max", "Part recettes"]} rows={cats.map(c => [c.k, c.n, fmt(c.r), fmt(c.d), <b style={{ color: c.net >= 0 ? COL.rec : COL.dep }}>{fmt(c.net)}</b>, fmt((c.r + c.d) / c.n), fmt(c.max), R ? pct((c.r / R) * 100) : "-"])} />
        </Panel>}

        {tab === "employes" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <Panel title="Classement net par employé"><HBars rows={[...membres].sort((a, b) => b.net - a.net).map(m => ({ label: m.k, value: m.net, sub: `${m.n} op.` }))} /></Panel>
          <Panel title="Détail"><DataTable head={["Employé", "Op.", "Recettes", "Pertes", "Net", "Moy./op."]} rows={membres.map(m => [m.k, m.n, fmt(m.r), fmt(m.d), <b style={{ color: m.net >= 0 ? COL.rec : COL.dep }}>{fmt(m.net)}</b>, fmt((m.r + m.d) / m.n)])} /></Panel>
        </div>}

        {tab === "sources" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <Panel title="Origine des écritures"><Donut parts={sources.map((s, i) => ({ nom: SRC[s.k] || s.k, value: s.r + s.d, color: ["var(--gold)", "var(--danger)", "var(--info)", "var(--text-dim)"][i % 4] }))} center={<>{cur.length}<br />écritures</>} />
            <div style={{ marginTop: "0.9rem" }}><DataTable head={["Source", "Recettes", "Dépenses", "Net"]} rows={sources.map(s => [SRC[s.k] || s.k, fmt(s.r), fmt(s.d), <b style={{ color: s.net >= 0 ? COL.rec : COL.dep }}>{fmt(s.net)}</b>])} /></div></Panel>
          <Panel title="Trésorerie par type d'argent (réelle)">
            <div className="stat-grid" style={{ marginBottom: 10 }}><Kpi label="Argent sale en caisse" value={fmt(cash.sale)} color={COL.dep} /><Kpi label="Argent propre en caisse" value={fmt(cash.propre)} color={COL.rec} /><Kpi label="Mixte" value={fmt(cash.mixte)} /></div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Blanchi au total : <b>{fmt(sum(transferts.map(t => t.montant)))}</b> · frais : <b>{fmt(sum(entries.filter(e => e.source === "blanchiment-frais").map(e => e.montant)))}</b> ({transferts.length} opération{transferts.length > 1 ? "s" : ""}). Le blanchiment est un transfert : seul le coût est une dépense.</p>
          </Panel>
          <Panel title="Argent sale / propre / mixte (flux)"><Donut parts={argent.map(a => ({ nom: a.k, value: a.r + a.d, color: MONEY_COL[a.k] || "var(--text-dim)" }))} />
            <div style={{ marginTop: "0.9rem" }}><DataTable head={["Type", "Recettes", "Dépenses", "Net"]} rows={argent.map(a => [a.k, fmt(a.r), fmt(a.d), fmt(a.net)])} /></div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 8 }}>Ratio argent sale en recettes : <b>{R ? pct((sum(cur.filter(e => e.type === "recette" && e.type_argent === "sale").map(e => e.montant)) / R) * 100) : "-"}</b> - à blanchir.</p></Panel>
        </div>}

        {tab === "marges" && <Panel title="Marge par produit" right={<small style={{ color: "var(--text-dim)" }}>coût = achats de stock · vente = Transactions</small>}>
          <DataTable empty="Aucun achat ni vente de produit." head={["Produit", "Acheté", "Coût moyen", "Vendu", "Prix vente moy.", "Marge unit.", "Marge totale", "Marge %", "En stock"]} rows={marges.map(m => [m.nom, m.qIn, m.qIn ? fmt(m.pc) : "-", m.qOut, m.qOut ? fmt(m.pv) : "-", m.qOut && m.qIn ? <b style={{ color: m.mu >= 0 ? COL.rec : COL.dep }}>{fmt(m.mu)}</b> : "-", <b style={{ color: m.mt >= 0 ? COL.rec : COL.dep }}>{fmt(m.mt)}</b>, m.rev ? pct(m.pct) : "-", m.stock])} />
          <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 8 }}>Marge totale = ventes - (quantité vendue x coût moyen d'achat). Saisis le « prix d'achat » lors d'une entrée de stock pour un coût fiable.</p>
        </Panel>}

        {tab === "semaines" && <Panel title="Clôtures hebdomadaires" right={<small style={{ color: "var(--text-dim)" }}>Clôture auto : chaque dimanche 23:59:59 (heure de Paris)</small>}>
          <DataTable head={["Semaine", "Statut", "Écritures", "Net clôturé", "Net actuel", "Régularisation", "Paies versées", ""]} rows={weeksTable.map(x => [`Sem. du ${x.w.split("-").reverse().slice(0, 2).join("/")}`, x.cl ? `🔒 clôturée ${new Date(x.cl.cloturee_at).toLocaleDateString("fr-FR")}` : "🟢 ouverte", x.nb, x.cl ? fmt(Number(x.cl.net)) : "-", fmt(x.net), x.cl ? <b style={{ color: Math.round(x.net - Number(x.cl.net)) === 0 ? "var(--text-dim)" : COL.warn }}>{fmt(x.net - Number(x.cl.net))}</b> : "-", fmt(x.paies), x.cl && isCEO ? <button className="btn btn-ghost btn-sm" onClick={() => rouvrir(x.w)}>Rouvrir</button> : ""])} />
          <p style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: 8 }}>Une semaine clôturée est figée : plus aucune écriture. Seules les paies versées après coup s'y ajoutent (régularisation), dans la semaine travaillée.</p>
        </Panel>}

        {tab === "journal" && <Panel title={`Journal des écritures (${journal.length})`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            <input placeholder="🔍 Rechercher..." value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 220 }} />
            <select value={fType} onChange={e => setFType(e.target.value)} style={{ width: "auto" }}><option value="">Tous types</option><option value="recette">Recettes</option><option value="dépense">Dépenses</option></select>
            <select value={fCat} onChange={e => setFCat(e.target.value)} style={{ width: "auto" }}><option value="">Toutes catégories</option>{allCats.map(c => <option key={c}>{c}</option>)}</select>
            <select value={fMembre} onChange={e => setFMembre(e.target.value)} style={{ width: "auto" }}><option value="">Tous employés</option>{allMembres.map(c => <option key={c}>{c}</option>)}</select>
            <select value={fSrc} onChange={e => setFSrc(e.target.value)} style={{ width: "auto" }}><option value="">Toutes sources</option>{Object.entries(SRC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </div>
          <DataTable head={["Date", "Catégorie / motif", "Employé", "Source", "Argent", "Montant"]} rows={journal.slice(0, limit).map(e => [new Date(e.created_at).toLocaleString("fr-FR"), <span><b>{e.categorie}</b><br /><small style={{ color: "var(--text-dim)" }}>{e.motif}</small></span>, e.membre || "-", SRC[e.source] || e.source, e.type_argent, <b style={{ color: e.type === "recette" ? COL.rec : COL.dep }}>{e.type === "recette" ? "+" : "-"}{fmt(e.montant)}</b>])} />
          {journal.length > limit && <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => setLimit(l => l + 200)}>Afficher plus</button>}
        </Panel>}

        {tab === "expert" && <>
          <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
            <Kpi label="Opération moyenne" value={fmt(ex.mu)} sub={`médiane ${fmt(ex.med)} · σ ${fmtK(ex.sd)}`} />
            <Kpi label="Burn rate (4 sem.)" value={fmt(ex.burn)} sub="dépenses moyennes / semaine" color={COL.dep} />
            <Kpi label="Autonomie (runway)" value={Number.isFinite(ex.runway) ? (ex.runway > 0 ? ex.runway.toFixed(1) + " sem." : "épuisée") : "∞"} sub="trésorerie / burn" />
            <Kpi label="Volatilité nette" value={fmtK(ex.vol)} sub="écart-type hebdo du net" />
            <Kpi label="Concentration (HHI)" value={ex.hhi.toFixed(0)} sub={ex.hhi > 2500 ? "très concentré ⚠️" : ex.hhi > 1500 ? "concentré" : "diversifié"} color={ex.hhi > 2500 ? COL.warn : "var(--text)"} />
            <Kpi label="Top 3 catégories" value={pct(ex.top3)} sub="part des recettes" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
            <Panel title="Projection du net - 4 prochaines semaines"><LineChart labels={[...labels.slice(-6), "+1", "+2", "+3", "+4"]} series={[{ nom: "Net réel", color: COL.info, values: [...ex.wN.slice(-6)] }, { nom: "Projection linéaire", color: COL.gold, values: [...Array(Math.max(0, Math.min(6, ex.wN.length) - 1)).fill(null), ex.wN[ex.wN.length - 1] ?? 0, ...ex.proj] }]} /></Panel>
            <Panel title="Activité par jour et tranche horaire"><Heat rows={["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]} cols={["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"]} grid={ex.grid} /></Panel>
            <Panel title="Records"><DataTable head={["Indicateur", "Valeur"]} rows={[["Meilleure semaine", ex.bestI >= 0 ? `${shortWeek(byWeek[ex.bestI].w)} · ${fmt(ex.wN[ex.bestI])}` : "-"], ["Pire semaine", ex.worstI >= 0 ? `${shortWeek(byWeek[ex.worstI].w)} · ${fmt(ex.wN[ex.worstI])}` : "-"], ["Plus grosse recette", fmt(Math.max(0, ...cur.filter(e => e.type === "recette").map(e => e.montant)))], ["Plus grosse perte", fmt(Math.max(0, ...cur.filter(e => e.type !== "recette").map(e => e.montant)))], ["Tendance du net", ex.growth >= 0 ? `▲ ${fmtK(ex.growth)}` : `▼ ${fmtK(ex.growth)}`]]} /></Panel>
            <Panel title="Anomalies (> moyenne + 2σ)"><DataTable empty="Aucune opération atypique." head={["Date", "Opération", "Montant"]} rows={ex.anomalies.map(e => [new Date(e.created_at).toLocaleDateString("fr-FR"), `${e.categorie} - ${e.membre || e.created_by || ""}`, <b style={{ color: e.type === "recette" ? COL.rec : COL.dep }}>{fmt(e.montant)}</b>])} /></Panel>
          </div>
        </>}
      </>}
    </div>
  );
}
