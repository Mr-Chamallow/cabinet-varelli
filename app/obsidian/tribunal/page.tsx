"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { gmWrite } from "@/lib/gmApi";
import { pdfDossier } from "@/lib/pdfDocs";
import { useGmAccess, useOrgs, Chip, Badge, fmtDT, toLocalInput, fromLocalInput } from "@/components/gm/bits";

const STATUTS = [
  { k: "instruction", label: "Instruction", color: "var(--info)" },
  { k: "accusation", label: "Accusation", color: "var(--warning)" },
  { k: "defense", label: "Défense", color: "#a78bfa" },
  { k: "verdict", label: "Verdict", color: "var(--gold)" },
  { k: "clos", label: "Clos", color: "var(--text-dim)" },
];
const VERDICTS: Record<string, { label: string; color: string }> = {
  en_cours: { label: "En cours", color: "var(--text-dim)" }, coupable: { label: "COUPABLE", color: "var(--danger)" }, innocent: { label: "Innocent", color: "var(--success)" },
};
const EMPTY = { titre: "", accuse: "", organisation: "", statut: "instruction", juge: "", procureur: "", avocat: "", date_audience: "", acte_accusation: "", defense: "", preuves: [] as { texte: string; url?: string; par?: string; date?: string }[], verdict: "en_cours", sentence: "" };

export default function TribunalPage() {
  const { user, canWrite } = useGmAccess("gm_tribunal");
  const { toast, showToast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProof, setNewProof] = useState({ texte: "", url: "" });
  const orgs = useOrgs(list.length);

  useEffect(() => { load(); }, []);
  useRealtimeTable("tribunal_dossiers", load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("tribunal_dossiers").select("*").order("created_at", { ascending: false });
    setList(data || []); setLoading(false);
  }

  function openNew() { setEditId(null); setForm({ ...EMPTY, procureur: "" }); setShow(true); }
  function openEdit(d: any) {
    setEditId(d.id);
    setForm({ ...EMPTY, ...d, accuse: d.accuse || "", organisation: d.organisation || "", juge: d.juge || "", procureur: d.procureur || "", avocat: d.avocat || "", acte_accusation: d.acte_accusation || "", defense: d.defense || "", sentence: d.sentence || "", date_audience: toLocalInput(d.date_audience), preuves: d.preuves || [] });
    setShow(true);
  }
  async function save() {
    if (!form.titre.trim()) return;
    setSaving(true);
    const body: any = { ...form, date_audience: fromLocalInput(form.date_audience) };
    const r = await gmWrite("tribunal_dossiers", editId ? "PATCH" : "POST", editId ? { ...body, id: editId } : body);
    setSaving(false);
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setShow(false); showToast(editId ? "Dossier modifié" : "Dossier ouvert"); load();
  }
  async function quick(d: any, patch: any) {
    const r = await gmWrite("tribunal_dossiers", "PATCH", { id: d.id, ...patch });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else load();
  }
  async function addProof(d: any) {
    if (!newProof.texte.trim()) return;
    await quick(d, { preuves: [...(d.preuves || []), { texte: newProof.texte.trim(), url: newProof.url.trim() || undefined, par: (user as any)?.nom || "", date: new Date().toISOString() }] });
    setNewProof({ texte: "", url: "" });
  }
  async function del(d: any) {
    if (!window.confirm(`Supprimer le dossier « ${d.titre} » ?`)) return;
    const r = await gmWrite("tribunal_dossiers", "DELETE", { id: d.id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Supprimé"); load(); }
  }

  const visible = list.filter(d => !filter || d.statut === filter);
  const nextStatut = (k: string) => STATUTS[Math.min(STATUTS.findIndex(s => s.k === k) + 1, STATUTS.length - 1)].k;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">⚖️ Tribunal de l'Ombre</h1><p className="page-subtitle">Instruction · Accusation · Défense · Verdict</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouveau dossier</button>}
      </div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Chip active={!filter} onClick={() => setFilter("")}>Tous ({list.length})</Chip>
        {STATUTS.map(s => <Chip key={s.k} active={filter === s.k} onClick={() => setFilter(s.k)}>{s.label} ({list.filter(d => d.statut === s.k).length})</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon">⚖️</div><div className="empty-title">Aucun dossier</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {visible.map(d => {
            const st = STATUTS.find(s => s.k === d.statut) || STATUTS[0]; const v = VERDICTS[d.verdict] || VERDICTS.en_cours; const isOpen = open === d.id;
            return (
              <div key={d.id} className="card" style={{ padding: "0.85rem 1rem", borderLeft: `3px solid ${st.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : d.id)}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700 }}>{d.titre}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Accusé : {d.accuse || d.organisation || "—"} · Audience : {fmtDT(d.date_audience)} · {(d.preuves || []).length} preuve(s)</div>
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                  {d.verdict !== "en_cours" && <Badge color={v.color}>{v.label}</Badge>}
                </div>
                {isOpen && (
                  <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.7rem", fontSize: "0.82rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0.5rem" }}>
                      <div><b>Juge</b><br />{d.juge || "—"}</div><div><b>Procureur</b><br />{d.procureur || "—"}</div><div><b>Avocat commis d'office</b><br />{d.avocat || "—"}</div><div><b>Organisation</b><br />{d.organisation || "—"}</div>
                    </div>
                    {d.acte_accusation && <div><b>📜 Acte d'accusation</b><div style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{d.acte_accusation}</div></div>}
                    {d.defense && <div><b>🛡️ Défense</b><div style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{d.defense}</div></div>}
                    {d.sentence && <div><b>🔨 Sentence</b><div style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{d.sentence}</div></div>}
                    <div>
                      <b>🗂️ Preuves</b>
                      {(d.preuves || []).length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucune preuve</div>}
                      {(d.preuves || []).map((p: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", padding: "0.25rem 0" }}>
                          <span>•</span><span style={{ flex: 1 }}>{p.texte}{p.url && <> — <a href={p.url} target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>lien</a></>}<span style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}> {p.par ? `· ${p.par}` : ""} {p.date ? `· ${fmtDT(p.date)}` : ""}</span></span>
                          {canWrite && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => quick(d, { preuves: d.preuves.filter((_: any, j: number) => j !== i) })}>✕</button>}
                        </div>
                      ))}
                      {canWrite && (
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                          <input placeholder="Nouvelle preuve (photo, écoute, témoignage…)" value={newProof.texte} onChange={e => setNewProof({ ...newProof, texte: e.target.value })} style={{ flex: 2, minWidth: 180 }} />
                          <input placeholder="Lien (optionnel)" value={newProof.url} onChange={e => setNewProof({ ...newProof, url: e.target.value })} style={{ flex: 1, minWidth: 120 }} />
                          <button className="btn btn-outline btn-sm" onClick={() => addProof(d)}>+ Preuve</button>
                        </div>
                      )}
                    </div>
                    <div><button className="btn btn-outline btn-sm" onClick={() => pdfDossier(d)}>📄 Dossier PDF</button></div>
                    {canWrite && (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {d.statut !== "clos" && <button className="btn btn-gold btn-sm" onClick={() => quick(d, { statut: nextStatut(d.statut) })}>➡️ Passer à : {STATUTS.find(s => s.k === nextStatut(d.statut))?.label}</button>}
                        {d.verdict === "en_cours" && <><button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => quick(d, { verdict: "coupable", statut: "verdict" })}>🔨 Coupable</button><button className="btn btn-outline btn-sm" style={{ color: "var(--success)" }} onClick={() => quick(d, { verdict: "innocent", statut: "verdict" })}>✅ Innocent</button></>}
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>✏️ Modifier</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(d)}>🗑️</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {show && (
        <Modal title={editId ? "Modifier le dossier" : "Nouveau dossier"} size="lg" onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.titre.trim()} onClick={save}>{saving ? "…" : "Enregistrer"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            <div className="form-grid">
              <div><label>Titre *</label><input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Ex : Trahison du Pacte — Les Vagos" /></div>
              <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{STATUTS.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}</select></div>
              <div><label>Accusé (personne)</label><input value={form.accuse} onChange={e => setForm({ ...form, accuse: e.target.value })} /></div>
              <div><label>Organisation</label><input list="trib-orgs" value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} /><datalist id="trib-orgs">{orgs.map(o => <option key={o} value={o} />)}</datalist></div>
              <div><label>Juge</label><input value={form.juge} onChange={e => setForm({ ...form, juge: e.target.value })} /></div>
              <div><label>Procureur</label><input value={form.procureur} onChange={e => setForm({ ...form, procureur: e.target.value })} /></div>
              <div><label>Avocat commis d'office</label><input value={form.avocat} onChange={e => setForm({ ...form, avocat: e.target.value })} /></div>
              <div><label>Date d'audience</label><input type="datetime-local" value={form.date_audience} onChange={e => setForm({ ...form, date_audience: e.target.value })} /></div>
            </div>
            <div><label>Acte d'accusation</label><textarea rows={3} value={form.acte_accusation} onChange={e => setForm({ ...form, acte_accusation: e.target.value })} /></div>
            <div><label>Défense</label><textarea rows={3} value={form.defense} onChange={e => setForm({ ...form, defense: e.target.value })} /></div>
            <div className="form-grid">
              <div><label>Verdict</label><select value={form.verdict} onChange={e => setForm({ ...form, verdict: e.target.value })}>{Object.entries(VERDICTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              <div><label>Sentence</label><input value={form.sentence} onChange={e => setForm({ ...form, sentence: e.target.value })} placeholder="Amende, mort RP (validée staff)…" /></div>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Les preuves s'ajoutent depuis la carte du dossier. Un verdict « coupable » lié à une organisation baisse sa réputation (−15).</div>
          </div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
