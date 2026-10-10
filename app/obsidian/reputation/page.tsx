"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { CountUp } from "@/components/ui/CountUp";
import { gmWrite, scoreOf, scoreLabel } from "@/lib/gmApi";
import { useGmAccess, Badge, fmtDT } from "@/components/gm/bits";

const CATS = ["Gang", "Cartel", "Mafia", "Police / SAMP", "Gouvernement", "Entreprise", "Autre"];

export default function ReputationPage() {
  const { canWrite } = useGmAccess("gm_reputation");
  const { toast, showToast } = useToast();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [showOrg, setShowOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ nom: "", categorie: "Gang", notes: "" });
  const [adj, setAdj] = useState<{ org: string; delta: string; motif: string } | null>(null);

  useEffect(() => { load(); }, []);
  useRealtimeTable(["gm_organisations", "gm_reputation_log"], load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: o }, { data: l }] = await Promise.all([
      supabase.from("gm_organisations").select("*").order("nom"),
      supabase.from("gm_reputation_log").select("*").order("created_at", { ascending: false }).limit(2000),
    ]);
    setOrgs(o || []); setLogs(l || []); setLoading(false);
  }
  const rows = useMemo(() => orgs.map(o => {
    const h = logs.filter(l => l.organisation === o.nom);
    return { ...o, history: h, score: scoreOf(h.map(x => x.delta)) };
  }).sort((a, b) => b.score - a.score), [orgs, logs]);

  async function addOrg() {
    if (!orgForm.nom.trim()) return;
    const r = await gmWrite("gm_organisations", "POST", orgForm);
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setShowOrg(false); setOrgForm({ nom: "", categorie: "Gang", notes: "" }); showToast("Organisation ajoutée"); load();
  }
  async function saveAdj() {
    if (!adj) return; const d = Number(adj.delta);
    if (!d) return;
    const r = await gmWrite("gm_reputation_log", "POST", { organisation: adj.org, delta: d, motif: adj.motif.trim() || "Ajustement manuel" });
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setAdj(null); showToast("Réputation ajustée"); load();
  }
  async function delLog(id: string) {
    const r = await gmWrite("gm_reputation_log", "DELETE", { id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else load();
  }
  async function delOrg(nom: string) {
    if (!window.confirm(`Supprimer « ${nom} » et tout son historique de réputation ?`)) return;
    const r = await gmWrite("gm_organisations", "DELETE", { nom });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Supprimée"); load(); }
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">⭐ Réputation des groupes</h1><p className="page-subtitle">Score 0–100 · alimenté par audits, pactes, tribunal et convois</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={() => setShowOrg(true)}>+ Organisation</button>}
      </div>
      {loading ? <LoadingBlock /> : rows.length === 0 ? <div className="empty-state"><div className="empty-icon">⭐</div><div className="empty-title">Aucune organisation</div><div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Elles se créent aussi toutes seules via les audits, pactes et dossiers.</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {rows.map(o => {
            const lab = scoreLabel(o.score); const isOpen = open === o.nom;
            return (
              <div key={o.nom} className="card" style={{ padding: "0.8rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap", cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : o.nom)}>
                  <div style={{ flex: 1, minWidth: 170 }}>
                    <div style={{ fontWeight: 700 }}>{o.nom} <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontWeight: 400 }}>· {o.categorie}</span></div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--surface)", marginTop: 6, overflow: "hidden" }}><div style={{ width: `${o.score}%`, height: "100%", background: lab.color, transition: "width .6s var(--ease, ease)" }} /></div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.3rem", color: lab.color, minWidth: 48, textAlign: "right" }}><CountUp value={o.score} /></div>
                  <Badge color={lab.color}>{lab.label}</Badge>
                </div>
                {isOpen && (
                  <div style={{ marginTop: "0.8rem" }}>
                    {canWrite && <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setAdj({ org: o.nom, delta: "5", motif: "" })}>± Ajuster</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => delOrg(o.nom)}>🗑️ Supprimer</button>
                    </div>}
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
      {showOrg && (
        <Modal title="Nouvelle organisation" onClose={() => setShowOrg(false)} footer={<><button className="btn btn-outline" onClick={() => setShowOrg(false)}>Annuler</button><button className="btn btn-gold" disabled={!orgForm.nom.trim()} onClick={addOrg}>Ajouter</button></>}>
          <div><label>Nom *</label><input autoFocus value={orgForm.nom} onChange={e => setOrgForm({ ...orgForm, nom: e.target.value })} /></div>
          <div><label>Catégorie</label><select value={orgForm.categorie} onChange={e => setOrgForm({ ...orgForm, categorie: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label>Notes</label><input value={orgForm.notes} onChange={e => setOrgForm({ ...orgForm, notes: e.target.value })} /></div>
        </Modal>
      )}
      {adj && (
        <Modal title={`Ajuster — ${adj.org}`} onClose={() => setAdj(null)} footer={<><button className="btn btn-outline" onClick={() => setAdj(null)}>Annuler</button><button className="btn btn-gold" onClick={saveAdj}>Appliquer</button></>}>
          <div><label>Points (ex : 5 ou -10)</label><input type="number" value={adj.delta} onChange={e => setAdj({ ...adj, delta: e.target.value })} /></div>
          <div><label>Motif</label><input value={adj.motif} onChange={e => setAdj({ ...adj, motif: e.target.value })} placeholder="Ex : a aidé lors du convoi" /></div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
