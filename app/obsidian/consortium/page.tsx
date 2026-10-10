"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { CountUp } from "@/components/ui/CountUp";
import { scoreOf } from "@/lib/gmApi";
import { useGmAccess, usd } from "@/components/gm/bits";

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.78rem", marginBottom: "0.35rem" }}>
    <span style={{ width: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "var(--surface)", overflow: "hidden" }}><div style={{ width: `${max ? (value / max) * 100 : 0}%`, height: "100%", background: color, borderRadius: 4, transition: "width .8s cubic-bezier(.2,.8,.2,1)" }} /></div>
    <b style={{ width: 34, textAlign: "right" }}>{value}</b>
  </div>
);

export default function ConsortiumStatsPage() {
  useGmAccess("gm_stats");
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("carte_gangs").select("id,nom"), supabase.from("gm_reputation_log").select("organisation,delta"),
      supabase.from("gm_pactes").select("organisation,statut,violations"), supabase.from("gm_audits").select("organisation,note"),
      supabase.from("tribunal_dossiers").select("statut,verdict"), supabase.from("gm_evenements").select("type,statut,montant"),
    ]).then(([g, r, p, a, t, e]) => setD({ gangs: g.data || [], rep: r.data || [], pactes: p.data || [], audits: a.data || [], dossiers: t.data || [], events: e.data || [] }));
  }, []);

  const k = useMemo(() => {
    if (!d) return null;
    const byOrg: Record<string, number[]> = {}; d.rep.forEach((x: any) => (byOrg[x.organisation] ??= []).push(x.delta));
    const scores = d.gangs.map((g: any) => ({ nom: g.nom, score: scoreOf(byOrg[g.nom] || []) })).sort((a: any, b: any) => b.score - a.score);
    const cnt = (arr: any[], f: (x: any) => boolean) => arr.filter(f).length;
    const ev = (t: string) => d.events.filter((x: any) => x.type === t);
    const conv = ev("convoi");
    return {
      scores, avgScore: scores.length ? Math.round(scores.reduce((s: number, x: any) => s + x.score, 0) / scores.length) : 0,
      pactes: { actifs: cnt(d.pactes, (x: any) => x.statut === "actif"), suspendus: cnt(d.pactes, (x: any) => x.statut === "suspendu"), rompus: cnt(d.pactes, (x: any) => x.statut === "rompu"), viol: d.pactes.reduce((s: number, x: any) => s + (x.violations || []).length, 0) },
      auditAvg: d.audits.length ? (d.audits.reduce((s: number, x: any) => s + Number(x.note), 0) / d.audits.length).toFixed(1) : "—",
      auditBad: cnt(d.audits, (x: any) => Number(x.note) < 5),
      dossiers: { total: d.dossiers.length, cours: cnt(d.dossiers, (x: any) => x.verdict === "en_cours"), coupable: cnt(d.dossiers, (x: any) => x.verdict === "coupable"), innocent: cnt(d.dossiers, (x: any) => x.verdict === "innocent") },
      convois: { livres: cnt(conv, (x: any) => x.statut === "livre"), echecs: cnt(conv, (x: any) => x.statut === "echec"), valeur: conv.filter((x: any) => x.statut === "livre").reduce((s: number, x: any) => s + Number(x.montant), 0) },
      encheres: ev("enchere").filter((x: any) => x.statut === "cloturee").reduce((s: number, x: any) => s + Number(x.montant), 0),
      captures: { faire: cnt(ev("capture"), (x: any) => x.statut === "a_faire" || x.statut === "en_cours"), faites: cnt(ev("capture"), (x: any) => x.statut === "capturee") },
      alertes: cnt(ev("alerte"), (x: any) => x.statut === "ouverte" || x.statut === "traquee"),
    };
  }, [d]);

  const tiles = k ? [
    { i: "⭐", l: "Réputation moyenne", v: k.avgScore, suf: "/100", c: "var(--gold)" },
    { i: "🤝", l: "Pactes actifs", v: k.pactes.actifs, c: "var(--success)" },
    { i: "⚠️", l: "Violations de pactes", v: k.pactes.viol, c: "var(--warning)" },
    { i: "🔎", l: "Audits sous 5/10", v: k.auditBad, c: "var(--danger)" },
    { i: "⚖️", l: "Dossiers en cours", v: k.dossiers.cours, c: "var(--info)" },
    { i: "🎯", l: "Captures à faire", v: k.captures.faire, c: "var(--danger)" },
  ] : [];

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header"><div><h1 className="page-title">📈 Stats du Consortium</h1><p className="page-subtitle">Réputation · Pactes · Audits · Tribunal · Événements</p><div className="gold-line" /></div></div>
      {!k ? <LoadingBlock /> : (
        <>
          <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
            {tiles.map(t => <div key={t.l} className="stat-card"><div className="stat-icon">{t.i}</div><div className="stat-value" style={{ color: t.c, fontSize: "1.3rem" }}><CountUp value={t.v as number} />{(t as any).suf || ""}</div><div className="stat-label">{t.l}</div></div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "1.1rem" }}>
            <div className="card"><div className="section-title" style={{ marginBottom: "0.8rem" }}>⭐ Classement réputation</div>
              {k.scores.length === 0 ? <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Aucun groupe.</div> : k.scores.slice(0, 10).map((s: any) => <Bar key={s.nom} label={s.nom} value={s.score} max={100} color={s.score >= 60 ? "var(--success)" : s.score >= 40 ? "var(--gold)" : "var(--danger)"} />)}
            </div>
            <div className="card"><div className="section-title" style={{ marginBottom: "0.8rem" }}>⚖️ Justice & pactes</div>
              <Bar label="Verdicts coupables" value={k.dossiers.coupable} max={Math.max(1, k.dossiers.total)} color="var(--danger)" />
              <Bar label="Verdicts innocents" value={k.dossiers.innocent} max={Math.max(1, k.dossiers.total)} color="var(--success)" />
              <Bar label="Pactes suspendus" value={k.pactes.suspendus} max={Math.max(1, k.pactes.actifs + k.pactes.suspendus + k.pactes.rompus)} color="var(--warning)" />
              <Bar label="Pactes rompus" value={k.pactes.rompus} max={Math.max(1, k.pactes.actifs + k.pactes.suspendus + k.pactes.rompus)} color="var(--danger)" />
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>Note moyenne des audits : <b>{k.auditAvg}/10</b></div>
            </div>
            <div className="card"><div className="section-title" style={{ marginBottom: "0.8rem" }}>🚚 Événements</div>
              <Bar label="Convois livrés" value={k.convois.livres} max={Math.max(1, k.convois.livres + k.convois.echecs)} color="var(--success)" />
              <Bar label="Convois échoués" value={k.convois.echecs} max={Math.max(1, k.convois.livres + k.convois.echecs)} color="var(--danger)" />
              <Bar label="Captures faites" value={k.captures.faites} max={Math.max(1, k.captures.faites + k.captures.faire)} color="var(--success)" />
              <Bar label="Alertes ouvertes" value={k.alertes} max={Math.max(1, k.alertes)} color="var(--warning)" />
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>Valeur livrée : <b>{usd(k.convois.valeur)}</b> · Enchères adjugées : <b>{usd(k.encheres)}</b></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
