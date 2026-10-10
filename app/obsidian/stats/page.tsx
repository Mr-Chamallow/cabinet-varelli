"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { EmployeeRanking } from "@/components/stats/EmployeeRanking";
import { WeeklyReport } from "@/components/stats/WeeklyReport";
import { Kpi, Panel, Tabs, LineChart, BarChart, HBars, Donut, Heat, DataTable, fmt, fmtK, pct, sum, mean, weekKey, lastWeeks, shortWeek } from "@/components/hub/Charts";
import { roleKey, ROLE_STYLES } from "@/components/EmployeeCard";

type Tab = "global" | "actions" | "employes" | "arrests" | "stocks" | "contrats" | "flotte" | "rapport";
const TABS: { k: Tab; label: string }[] = [
  { k: "global", label: "🌐 Vue d'ensemble" }, { k: "actions", label: "🕶️ Actions illégales" }, { k: "employes", label: "👥 Employés" }, { k: "arrests", label: "🚔 Arrestations" },
  { k: "stocks", label: "📦 Stocks" }, { k: "contrats", label: "📋 Contrats" }, { k: "flotte", label: "🚗 Flotte & RDV" }, { k: "rapport", label: "📰 Rapport hebdo" },
];
const C = { ok: "var(--success)", ko: "var(--danger)", gold: "var(--gold)", info: "var(--info)", warn: "var(--warning)" };
const PAL = ["var(--gold)", "var(--info)", "var(--success)", "var(--danger)", "var(--warning)", "var(--text-dim)"];
const count = <T,>(l: T[], k: (x: T) => string) => { const m: Record<string, number> = {}; l.forEach(x => { const v = k(x) || "—"; m[v] = (m[v] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };

export default function StatsHubPage() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_stats"))) window.location.href = "/"; }, [user, userLoading]);
  const [d, setD] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("global");
  const [nW, setNW] = useState(8);
  useEffect(() => { load(); }, []);
  useRealtimeTable(["actions_illegales", "arrestations", "obsidian_contrats", "obsidian_stocks"], load);
  async function load() {
    if (!supabase) return;
    const q = (t: string, lim = 5000) => supabase!.from(t).select("*").limit(lim);
    const [a, ar, co, st, mv, ga, rd, em, fi, tr] = await Promise.all([q("actions_illegales"), q("arrestations"), q("obsidian_contrats"), q("obsidian_stocks"), q("obsidian_mouvements"), q("obsidian_garage"), q("obsidian_rdv"), q("obsidian_employes"), q("obsidian_fiches"), q("cahier_transactions")]);
    setD({ actions: a.data || [], arrests: ar.data || [], contrats: co.data || [], stocks: st.data || [], mouvements: mv.data || [], garage: ga.data || [], rdv: rd.data || [], employes: em.data || [], fiches: fi.data || [], trans: tr.data || [] });
  }
  const wks = useMemo(() => lastWeeks(nW), [nW]);
  const labels = wks.map(shortWeek);

  const k = useMemo(() => {
    if (!d) return null;
    const A = d.actions as any[], AR = d.arrests as any[], CO = d.contrats as any[], ST = d.stocks as any[], MV = d.mouvements as any[], GA = d.garage as any[], EM = (d.employes as any[]).filter(e => e.actif !== false);
    const gains = (l: any[]) => sum(l.filter(a => Number(a.montant) > 0).map(a => Number(a.montant))), pertes = (l: any[]) => sum(l.filter(a => Number(a.montant) < 0).map(a => -Number(a.montant)));
    const perWeek = wks.map(w => { const aw = A.filter(a => weekKey(a.created_at) === w); return { n: aw.length, g: gains(aw), p: pertes(aw), ar: AR.filter(x => weekKey(x.created_at) === w).length }; });
    const byType = (() => { const m: Record<string, { n: number; net: number; g: number }> = {}; A.forEach(a => { const x = (m[a.action] ??= { n: 0, net: 0, g: 0 }); x.n++; x.net += Number(a.montant) || 0; if (Number(a.montant) > 0) x.g += Number(a.montant); }); return Object.entries(m).map(([nom, v]) => ({ nom, ...v })).sort((a, b) => b.net - a.net); })();
    const byEmp = (() => { const m: Record<string, { n: number; net: number; ar: number; amende: number; perte: number }> = {}; const g = (n: string) => (m[n] ??= { n: 0, net: 0, ar: 0, amende: 0, perte: 0 }); A.forEach(a => { const x = g(a.membre); x.n++; x.net += Number(a.montant) || 0; }); AR.forEach(a => { const x = g(a.membre); x.ar++; x.amende += Number(a.amende) || 0; x.perte += Number(a.argent_perdu) || 0; }); return Object.entries(m).map(([nom, v]) => ({ nom, ...v })).sort((a, b) => b.net - a.net); })();
    const grid = Array.from({ length: 7 }, () => Array(6).fill(0)); A.forEach(a => { const t = new Date(a.created_at); grid[(t.getDay() + 6) % 7][Math.floor(t.getHours() / 4)]++; });
    const stockVal = sum(ST.map(s => (Number(s.quantite) || 0) * (Number(s.prix_unitaire) || 0)));
    const low = ST.filter(s => Number(s.seuil_alerte) > 0 && Number(s.quantite) <= Number(s.seuil_alerte));
    const catVal = (() => { const m: Record<string, number> = {}; ST.forEach(s => { m[s.categorie] = (m[s.categorie] || 0) + (Number(s.quantite) || 0) * (Number(s.prix_unitaire) || 0); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); })();
    const mvW = wks.map(w => { const l = MV.filter(m => weekKey(m.created_at) === w); return { e: sum(l.filter(m => m.type === "entrée").map(m => Number(m.quantite) || 0)), s: sum(l.filter(m => m.type === "sortie").map(m => Number(m.quantite) || 0)) }; });
    const done = CO.filter(c => c.statut === "Terminé"), fail = CO.filter(c => c.statut === "Échoué");
    const poles = (() => { const m: Record<string, number> = {}; EM.forEach(e => { const n = ROLE_STYLES[roleKey(e.role)]?.nom || "Autre"; m[n] = (m[n] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); })();
    return { A, AR, CO, ST, MV, GA, EM, perWeek, byType, byEmp, grid, stockVal, low, catVal, mvW, done, fail, poles, gains: gains(A), pertes: pertes(A), fleetVal: sum(GA.map(g => Number(g.valeur) || 0)), wanted: (d.fiches as any[]).filter(f => !f.deleted_at && (Number(f.prime) > 0 || /recherch/i.test(f.statut || ""))).length, rdvFut: (d.rdv as any[]).filter(r => r.date >= new Date().toISOString().slice(0, 10)).length };
  }, [d, wks]);

  const winRate = k && k.CO.length ? (k.done.length / Math.max(1, k.done.length + k.fail.length)) * 100 : 0;
  const arrestRate = k && k.A.length ? (k.AR.length / k.A.length) * 100 : 0;

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header">
        <div><h1 className="page-title">📊 Hub Statistiques</h1><p className="page-subtitle">Activité · Performance · Risques — lecture seule, calculé en direct</p><div className="gold-line" /></div>
        <div style={{ display: "flex", gap: "0.4rem" }}>{[4, 8, 12, 26].map(n => <button key={n} className={`btn btn-sm ${nW === n ? "btn-gold" : "btn-outline"}`} onClick={() => setNW(n)}>{n} sem.</button>)}</div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={x => setTab(x as Tab)} />
      {!k ? <LoadingBlock /> : <>
        {tab === "global" && <>
          <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
            <Kpi icon="🕶️" label="Actions illégales" value={k.A.length} sub={`gains ${fmtK(k.gains)} · pertes ${fmtK(k.pertes)}`} />
            <Kpi icon="⚖️" label="Net des actions" value={fmt(k.gains - k.pertes)} color={k.gains - k.pertes >= 0 ? C.ok : C.ko} />
            <Kpi icon="🚔" label="Arrestations" value={k.AR.length} sub={`taux ${pct(arrestRate)} des actions`} color={C.warn} />
            <Kpi icon="📦" label="Valeur des stocks" value={fmt(k.stockVal)} sub={`${k.low.length} article(s) sous le seuil`} color={k.low.length ? C.warn : C.gold} />
            <Kpi icon="📋" label="Contrats réussis" value={pct(winRate)} sub={`${k.done.length} ok · ${k.fail.length} échec`} color={C.ok} />
            <Kpi icon="🚗" label="Valeur de la flotte" value={fmt(k.fleetVal)} sub={`${k.GA.length} véhicule(s)`} />
            <Kpi icon="👥" label="Employés actifs" value={k.EM.length} />
            <Kpi icon="🚨" label="Personnes recherchées" value={k.wanted} color={C.ko} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
            <Panel title="Activité hebdomadaire"><BarChart labels={labels} series={[{ nom: "Gains", color: C.ok, values: k.perWeek.map(x => x.g) }, { nom: "Pertes", color: C.ko, values: k.perWeek.map(x => x.p) }]} /></Panel>
            <Panel title="Nombre d'actions / arrestations"><LineChart labels={labels} series={[{ nom: "Actions", color: C.gold, values: k.perWeek.map(x => x.n) }, { nom: "Arrestations", color: C.ko, values: k.perWeek.map(x => x.ar) }]} /></Panel>
            <Panel title="Effectif par pôle"><Donut parts={k.poles.map(([nom, value], i) => ({ nom, value, color: PAL[i % PAL.length] }))} center={<>{k.EM.length}<br />actifs</>} /></Panel>
            <Panel title="Top actions (net)"><HBars rows={k.byType.slice(0, 6).map(t => ({ label: t.nom, value: t.net, sub: `${t.n}×` }))} /></Panel>
          </div>
        </>}

        {tab === "actions" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <Panel title="Rentabilité par type d'action"><DataTable head={["Action", "Nb", "Gains", "Net", "Net moyen"]} rows={k.byType.map(t => [t.nom, t.n, fmt(t.g), <b style={{ color: t.net >= 0 ? C.ok : C.ko }}>{fmt(t.net)}</b>, fmt(t.net / t.n)])} /></Panel>
          <Panel title="Répartition par type (nombre)"><Donut parts={count(k.A, (a: any) => a.action).slice(0, 6).map(([nom, value], i) => ({ nom, value, color: PAL[i % PAL.length] }))} /></Panel>
          <Panel title="Quand agit-on ? (jour × heure)"><Heat rows={["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]} cols={["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"]} grid={k.grid} /></Panel>
          <Panel title="Net par semaine"><LineChart area labels={labels} series={[{ nom: "Net", color: C.gold, values: k.perWeek.map(x => x.g - x.p) }]} /></Panel>
        </div>}

        {tab === "employes" && <div style={{ display: "grid", gap: "1.25rem" }}>
          <Panel title="Performance détaillée par employé"><DataTable head={["Employé", "Actions", "Net", "Net / action", "Arrest.", "Amendes", "Pertes"]} rows={k.byEmp.map(e => [e.nom, e.n, <b style={{ color: e.net >= 0 ? C.ok : C.ko }}>{fmt(e.net)}</b>, e.n ? fmt(e.net / e.n) : "—", e.ar, fmt(e.amende), fmt(e.perte)])} /></Panel>
          <EmployeeRanking />
        </div>}

        {tab === "arrests" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <div className="stat-grid" style={{ gridColumn: "1 / -1" }}>
            <Kpi label="Arrestations" value={k.AR.length} color={C.warn} />
            <Kpi label="Amendes (primes)" value={fmt(sum(k.AR.map((a: any) => Number(a.amende) || 0)))} color={C.gold} />
            <Kpi label="Perte sèche (argent)" value={fmt(sum(k.AR.map((a: any) => Number(a.argent_perdu) || 0)))} color={C.ko} />
            <Kpi label="Amende moyenne" value={fmt(mean(k.AR.map((a: any) => Number(a.amende) || 0)))} />
          </div>
          <Panel title="Arrestations par semaine"><BarChart labels={labels} series={[{ nom: "Arrestations", color: C.ko, values: k.perWeek.map(x => x.ar) }]} /></Panel>
          <Panel title="Employés les plus arrêtés"><HBars color={C.warn} format={n => n + " arrest."} rows={[...k.byEmp].sort((a, b) => b.ar - a.ar).filter(e => e.ar).slice(0, 8).map(e => ({ label: e.nom, value: e.ar, sub: fmt(e.perte) + " perdus" }))} /></Panel>
        </div>}

        {tab === "stocks" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <Panel title="Valeur par catégorie"><Donut parts={k.catVal.map(([nom, value], i) => ({ nom, value, color: PAL[i % PAL.length] }))} center={fmtK(k.stockVal)} /></Panel>
          <Panel title="Mouvements (quantités / semaine)"><BarChart labels={labels} series={[{ nom: "Entrées", color: C.ok, values: k.mvW.map(x => x.e) }, { nom: "Sorties", color: C.ko, values: k.mvW.map(x => x.s) }]} /></Panel>
          <Panel title="Articles sous le seuil d'alerte"><DataTable empty="Aucune alerte de stock 👍" head={["Article", "Qté", "Seuil"]} rows={k.low.map((s: any) => [`${s.emoji || ""} ${s.nom}`, <b style={{ color: C.ko }}>{s.quantite}</b>, s.seuil_alerte])} /></Panel>
          <Panel title="Top valeur immobilisée"><HBars rows={[...k.ST].map((s: any) => ({ label: `${s.emoji || ""} ${s.nom}`, value: (Number(s.quantite) || 0) * (Number(s.prix_unitaire) || 0) })).sort((a, b) => b.value - a.value).slice(0, 7)} /></Panel>
        </div>}

        {tab === "contrats" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <div className="stat-grid" style={{ gridColumn: "1 / -1" }}>
            <Kpi label="Contrats" value={k.CO.length} /><Kpi label="Taux de réussite" value={pct(winRate)} color={C.ok} />
            <Kpi label="Revenus (terminés)" value={fmt(sum(k.done.map((c: any) => Number(c.recompense) || 0)))} color={C.gold} />
            <Kpi label="Manque à gagner (échecs)" value={fmt(sum(k.fail.map((c: any) => Number(c.recompense) || 0)))} color={C.ko} />
          </div>
          <Panel title="Par statut"><Donut parts={count(k.CO, (c: any) => c.statut).map(([nom, value], i) => ({ nom, value, color: PAL[i % PAL.length] }))} /></Panel>
          <Panel title="Par difficulté"><DataTable head={["Difficulté", "Nb", "Récompense moy."]} rows={count(k.CO, (c: any) => c.difficulte).map(([dif, n]) => [dif, n, fmt(mean(k.CO.filter((c: any) => c.difficulte === dif).map((c: any) => Number(c.recompense) || 0)))])} /></Panel>
          <Panel title="Par type"><HBars format={n => String(n)} rows={count(k.CO, (c: any) => c.type).map(([label, value]) => ({ label, value }))} /></Panel>
        </div>}

        {tab === "flotte" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
          <Panel title="Statut de la flotte"><Donut parts={count(k.GA, (g: any) => g.statut).map(([nom, value], i) => ({ nom, value, color: PAL[i % PAL.length] }))} center={<>{k.GA.length}<br />véhicules</>} /></Panel>
          <Panel title="Véhicules les plus chers"><HBars rows={[...k.GA].sort((a: any, b: any) => (Number(b.valeur) || 0) - (Number(a.valeur) || 0)).slice(0, 6).map((g: any) => ({ label: `${g.modele} (${g.plaque})`, value: Number(g.valeur) || 0 }))} /></Panel>
          <Panel title="Rendez-vous"><div className="stat-grid"><Kpi label="Total RDV" value={(d.rdv as any[]).length} /><Kpi label="À venir" value={k.rdvFut} color={C.gold} /></div>
            <div style={{ marginTop: 10 }}><HBars format={n => String(n)} rows={count(d.rdv as any[], r => r.type).slice(0, 6).map(([label, value]) => ({ label, value }))} /></div></Panel>
        </div>}

        {tab === "rapport" && <WeeklyReport />}
      </>}
    </div>
  );
}
