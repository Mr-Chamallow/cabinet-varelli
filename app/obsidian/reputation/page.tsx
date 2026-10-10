"use client";
import { gangTypeLabel } from "@/components/carte-enqueteur/types";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { CountUp } from "@/components/ui/CountUp";
import { gmWrite, scoreOf, scoreLabel } from "@/lib/gmApi";
import { pdfOrganisation, pdfConvocation } from "@/lib/pdfDocs";
import { PALIERS } from "@/lib/rolesRP";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useGmAccess, Badge, fmtDT } from "@/components/gm/bits";


export default function ReputationPage() {
  const { canWrite } = useGmAccess("gm_reputation");
  const { toast, showToast } = useToast();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const { user } = useCurrentUser();
  const [conv, setConv] = useState<{ org: string; destinataire: string; lieu: string; date: string; heure: string; objet: string; consignes: string; noms: string[]; score: number } | null>(null);
  const [adj, setAdj] = useState<{ org: string; delta: string; motif: string } | null>(null);

  useEffect(() => { load(); }, []);
  useRealtimeTable(["carte_gangs", "gm_reputation_log"], load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: o }, { data: l }] = await Promise.all([
      supabase.from("carte_gangs").select("id,nom,type").order("nom"),
      supabase.from("gm_reputation_log").select("*").order("created_at", { ascending: false }).limit(2000),
    ]);
    setOrgs(o || []); setLogs(l || []); setLoading(false);
  }
  const rows = useMemo(() => orgs.map(o => {
    const h = logs.filter(l => l.organisation === o.nom);
    return { ...o, history: h, score: scoreOf(h.map(x => x.delta)) };
  }).sort((a, b) => b.score - a.score), [orgs, logs]);

  async function saveAdj() {
    if (!adj) return; const d = Number(adj.delta);
    if (!d) return;
    const r = await gmWrite("gm_reputation_log", "POST", { organisation: adj.org, delta: d, motif: adj.motif.trim() || "Ajustement manuel" });
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setAdj(null); showToast("Réputation ajustée"); load();
  }
  async function dossierPdf(o: any) {
    if (!supabase) return;
    const [{ data: pactes }, { data: audits }, { data: dossiers }, { data: evenements }, { data: fiches }] = await Promise.all([
      supabase.from("gm_pactes").select("*").eq("organisation", o.nom),
      supabase.from("gm_audits").select("*").eq("organisation", o.nom).order("created_at", { ascending: false }),
      supabase.from("tribunal_dossiers").select("*").eq("organisation", o.nom).order("created_at", { ascending: false }),
      supabase.from("gm_evenements").select("*").eq("partenaire", o.nom).order("created_at", { ascending: false }),
      supabase.from("obsidian_fiches").select("nom,metier,priorite,statut").eq("organisation", o.nom),
    ]);
    await pdfOrganisation({ ...o, categorie: gangTypeLabel(o.type) }, { pactes: pactes || [], audits: audits || [], dossiers: dossiers || [], evenements: evenements || [], history: o.history, fiches: fiches || [] });
  }
  async function openConv(o: any) {
    const { data } = supabase ? await supabase.from("obsidian_fiches").select("nom").eq("organisation", o.nom) : { data: [] as any[] };
    const d = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    setConv({ org: o.nom, destinataire: "", lieu: "Hangar du désert de Blaine County", date: d, heure: "22:00", objet: "Audit de conformité", consignes: "Présence personnelle et obligatoire. Aucune arme, aucun enregistrement. Venir seul ou avec un seul second.", noms: (data || []).map((f: any) => f.nom), score: o.score });
  }
  async function genConv() {
    if (!conv) return;
    await pdfConvocation({ organisation: conv.org, destinataire: conv.destinataire, lieu: conv.lieu, date: conv.date, heure: conv.heure, objet: conv.objet, consignes: conv.consignes, score: conv.score, par: (user as any)?.nom || "" });
    setConv(null);
  }
  async function delLog(id: string) {
    const r = await gmWrite("gm_reputation_log", "DELETE", { id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else load();
  }
  async function delOrg(nom: string) {
    if (!window.confirm(`Remettre à zéro la réputation de « ${nom} » (le groupe reste dans la Base de données) ?`)) return;
    const r = await gmWrite("gm_organisations", "DELETE", { nom });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Réputation réinitialisée"); load(); }
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">⭐ Réputation des groupes</h1><p className="page-subtitle">Échelle nommée (de « Banni » à « Partenaire du Directoire ») · alimentée par audits, pactes, tribunal et convois</p><div className="gold-line" /></div>
        <a className="btn btn-outline" href="/base-de-donnees">🗄️ Gérer les groupes</a>
      </div>
      <details className="card" style={{ marginBottom: "0.8rem", padding: "0.6rem 1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.82rem" }}>📊 Échelle de réputation du Consortium</summary>
        <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
          {PALIERS.map(p => <div key={p.label} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: "0.78rem" }}><b style={{ color: p.color, minWidth: 190 }}>{p.label}</b><span style={{ color: "var(--text-dim)", minWidth: 46 }}>≥ {p.min}</span><span style={{ flex: 1 }}>{p.effet}</span></div>)}
        </div>
      </details>
      {loading ? <LoadingBlock /> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon">⭐</div><div className="empty-title">Aucune organisation</div><div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Les groupes se créent dans Base de données → Groupes.</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {rows.map(o => {
            const lab = scoreLabel(o.score); const isOpen = open === o.nom;
            return (
              <div key={o.nom} className="card" style={{ padding: "0.8rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap", cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : o.nom)}>
                  <div style={{ flex: 1, minWidth: 170 }}>
                    <div style={{ fontWeight: 700 }}>{o.nom} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontWeight: 400 }}>· {gangTypeLabel(o.type)}</span></div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--surface)", marginTop: 6, overflow: "hidden" }}><div style={{ width: `${o.score}%`, height: "100%", background: lab.color, transition: "width .6s var(--ease, ease)" }} /></div>
                  </div>
                  <div style={{ position: "relative", width: 64, height: 40 }}>
                    <svg viewBox="0 0 64 40" width="64" height="40"><path d="M6 36 A26 26 0 0 1 58 36" fill="none" stroke="var(--surface)" strokeWidth="6" strokeLinecap="round" /><path d="M6 36 A26 26 0 0 1 58 36" fill="none" stroke={lab.color} strokeWidth="6" strokeLinecap="round" pathLength={100} strokeDasharray="100" strokeDashoffset={100 - o.score} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1), stroke .6s" }} /></svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", fontWeight: 800, fontSize: "1rem", color: lab.color }}><CountUp value={o.score} /></div>
                  </div>
                  <Badge color={lab.color}>{lab.label}</Badge>
                </div>
                {isOpen && (
                  <div style={{ marginTop: "0.8rem" }}>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "0.6rem", borderLeft: `3px solid ${lab.color}`, paddingLeft: 8 }}><b style={{ color: lab.color }}>{lab.label}</b> — {lab.effet}</div>
                    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => dossierPdf(o)}>📄 Dossier complet (PDF)</button>
                      <button className="btn btn-outline btn-sm" onClick={() => openConv(o)}>📜 Convocation officielle</button>
                      {canWrite && <><button className="btn btn-outline btn-sm" onClick={() => setAdj({ org: o.nom, delta: "5", motif: "" })}>± Ajuster</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => delOrg(o.nom)}>🧹 Remettre à zéro</button></>}
                    </div>
                    {o.history.length === 0 ? <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>Aucun mouvement (score de départ : 50)</div> :
                      o.history.slice(0, 30).map((h: any) => (
                        <div key={h.id} style={{ display: "flex", gap: "0.6rem", fontSize: "0.78rem", padding: "0.2rem 0", alignItems: "baseline" }}>
                          <b style={{ color: h.delta >= 0 ? "var(--success)" : "var(--danger)", minWidth: 36 }}>{h.delta > 0 ? "+" : ""}{h.delta}</b>
                          <span style={{ flex: 1 }}>{h.motif || "—"}</span>
                          <span style={{ color: "var(--text-dim)", fontSize: "0.66rem" }}>{h.source || "manuel"} · {fmtDT(h.created_at)}</span>
                          {canWrite && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => delLog(h.id)}>✕</button>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {adj && (
        <Modal title={`Ajuster — ${adj.org}`} onClose={() => setAdj(null)} footer={<><button className="btn btn-outline" onClick={() => setAdj(null)}>Annuler</button><button className="btn btn-gold" onClick={saveAdj}>Appliquer</button></>}>
          <div><label>Points (ex : 5 ou -10)</label><input type="number" value={adj.delta} onChange={e => setAdj({ ...adj, delta: e.target.value })} /></div>
          <div><label>Motif</label><input value={adj.motif} onChange={e => setAdj({ ...adj, motif: e.target.value })} placeholder="Ex : a aidé lors du convoi" /></div>
        </Modal>
      )}
      {conv && (
        <Modal title={`📜 Convocation officielle — ${conv.org}`} onClose={() => setConv(null)} footer={<><button className="btn btn-outline" onClick={() => setConv(null)}>Annuler</button><button className="btn btn-gold" onClick={genConv} disabled={!conv.destinataire.trim()}>Générer le PDF</button></>}>
          <div className="form-group"><label>Convoqué (chef / représentant) *</label><input list="conv-noms" value={conv.destinataire} onChange={e => setConv({ ...conv, destinataire: e.target.value })} /><datalist id="conv-noms">{conv.noms.map(n => <option key={n} value={n} />)}</datalist></div>
          <div className="form-group"><label>Objet</label><input value={conv.objet} onChange={e => setConv({ ...conv, objet: e.target.value })} /></div>
          <div className="form-grid"><div className="form-group"><label>Date</label><input type="date" value={conv.date} onChange={e => setConv({ ...conv, date: e.target.value })} /></div><div className="form-group"><label>Heure</label><input type="time" value={conv.heure} onChange={e => setConv({ ...conv, heure: e.target.value })} /></div></div>
          <div className="form-group"><label>Lieu</label><input value={conv.lieu} onChange={e => setConv({ ...conv, lieu: e.target.value })} /></div>
          <div className="form-group"><label>Consignes</label><textarea rows={3} value={conv.consignes} onChange={e => setConv({ ...conv, consignes: e.target.value })} /></div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
