"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { gmWrite } from "@/lib/gmApi";
import { pdfPacte } from "@/lib/pdfDocs";
import { useGmAccess, useOrgs, Chip, Badge, fmtDT } from "@/components/gm/bits";

const STATUTS: Record<string, { label: string; color: string }> = {
  actif: { label: "Actif", color: "var(--success)" }, suspendu: { label: "Suspendu", color: "var(--warning)" },
  rompu: { label: "Rompu", color: "var(--danger)" }, expire: { label: "Expiré", color: "var(--text-dim)" },
};
const EMPTY = { organisation: "", statut: "actif", date_signature: new Date().toISOString().slice(0, 10), date_fin: "", signataire: "", clauses: "" };

export default function PactesPage() {
  const { canWrite } = useGmAccess("gm_pactes");
  const { toast, showToast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viol, setViol] = useState<{ pact: any; texte: string } | null>(null);
  const orgs = useOrgs(list.length);

  useEffect(() => { load(); }, []);
  useRealtimeTable("gm_pactes", load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("gm_pactes").select("*").order("created_at", { ascending: false });
    setList(data || []); setLoading(false);
  }
  function openNew() { setEditId(null); setForm(EMPTY); setShow(true); }
  function openEdit(p: any) { setEditId(p.id); setForm({ organisation: p.organisation, statut: p.statut, date_signature: p.date_signature || "", date_fin: p.date_fin || "", signataire: p.signataire || "", clauses: p.clauses || "" }); setShow(true); }
  async function save() {
    if (!form.organisation.trim()) return;
    setSaving(true);
    const r = await gmWrite("gm_pactes", editId ? "PATCH" : "POST", editId ? { ...form, id: editId } : form);
    setSaving(false);
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setShow(false); showToast("Pacte enregistré"); load();
  }
  async function addViolation() {
    if (!viol || !viol.texte.trim()) return;
    const r = await gmWrite("gm_pactes", "PATCH", { id: viol.pact.id, violations: [...(viol.pact.violations || []), { texte: viol.texte.trim(), date: new Date().toISOString() }] });
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setViol(null); showToast("Violation notée (réputation −10)"); load();
  }
  async function setStatut(p: any, statut: string) {
    const r = await gmWrite("gm_pactes", "PATCH", { id: p.id, statut });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else load();
  }
  async function del(p: any) {
    if (!window.confirm(`Supprimer le pacte avec ${p.organisation} ?`)) return;
    const r = await gmWrite("gm_pactes", "DELETE", { id: p.id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Supprimé"); load(); }
  }
  const visible = list.filter(p => !filter || p.statut === filter);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">🤝 Pactes d'Obsidienne</h1><p className="page-subtitle">Groupes signataires · Clauses · Violations</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouveau pacte</button>}
      </div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Chip active={!filter} onClick={() => setFilter("")}>Tous ({list.length})</Chip>
        {Object.entries(STATUTS).map(([k, s]) => <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{s.label} ({list.filter(p => p.statut === k).length})</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon">🤝</div><div className="empty-title">Aucun pacte</div></div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: "0.75rem" }}>
          {visible.map(p => {
            const s = STATUTS[p.statut] || STATUTS.actif; const expired = p.date_fin && new Date(p.date_fin) < new Date() && p.statut === "actif";
            return (
              <div key={p.id} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ fontWeight: 700 }}>{p.organisation}</div><Badge color={s.color}>{s.label}</Badge>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", margin: "0.25rem 0 0.6rem" }}>
                  Signé le {p.date_signature ? new Date(p.date_signature).toLocaleDateString("fr-FR") : "—"}{p.date_fin ? ` · fin ${new Date(p.date_fin).toLocaleDateString("fr-FR")}` : ""}{p.signataire ? ` · par ${p.signataire}` : ""}
                  {expired && <span style={{ color: "var(--warning)" }}> · ⚠️ échéance dépassée</span>}
                </div>
                {p.clauses && <div style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap", color: "var(--text-muted)", marginBottom: "0.6rem" }}>{p.clauses}</div>}
                {(p.violations || []).length > 0 && (
                  <div style={{ marginBottom: "0.6rem", padding: "0.5rem 0.7rem", background: "rgba(239,68,68,0.06)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--danger)" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--danger)", marginBottom: "0.2rem" }}>{p.violations.length} violation(s)</div>
                    {p.violations.map((v: any, i: number) => <div key={i} style={{ fontSize: "0.75rem" }}>• {v.texte} <span style={{ color: "var(--text-dim)" }}>({fmtDT(v.date)})</span></div>)}
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: canWrite ? "0.35rem" : 0 }}><button className="btn btn-outline btn-sm" onClick={() => pdfPacte(p)}>📄 PDF</button></div>
                {canWrite && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setViol({ pact: p, texte: "" })}>⚠️ Violation</button>
                    {p.statut === "actif" && <button className="btn btn-outline btn-sm" onClick={() => setStatut(p, "suspendu")}>⏸️</button>}
                    {p.statut !== "actif" && p.statut !== "rompu" && <button className="btn btn-outline btn-sm" onClick={() => setStatut(p, "actif")}>▶️ Réactiver</button>}
                    {p.statut !== "rompu" && <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => window.confirm("Marquer ce pacte comme ROMPU (réputation −20) ?") && setStatut(p, "rompu")}>💥 Rompre</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(p)}>🗑️</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {show && (
        <Modal title={editId ? "Modifier le pacte" : "Nouveau pacte"} onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.organisation.trim()} onClick={save}>{saving ? "…" : "Enregistrer"}</button></>}>
          <div className="form-grid">
            <div><label>Organisation *</label><input list="pact-orgs" value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} /><datalist id="pact-orgs">{orgs.map(o => <option key={o} value={o} />)}</datalist></div>
            <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
            <div><label>Date de signature</label><input type="date" value={form.date_signature} onChange={e => setForm({ ...form, date_signature: e.target.value })} /></div>
            <div><label>Fin (optionnel)</label><input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} /></div>
          </div>
          <div><label>Signataire</label><input value={form.signataire} onChange={e => setForm({ ...form, signataire: e.target.value })} /></div>
          <div><label>Clauses</label><textarea rows={4} value={form.clauses} onChange={e => setForm({ ...form, clauses: e.target.value })} /></div>
        </Modal>
      )}
      {viol && (
        <Modal title={`Violation — ${viol.pact.organisation}`} onClose={() => setViol(null)}
          footer={<><button className="btn btn-outline" onClick={() => setViol(null)}>Annuler</button><button className="btn btn-gold" disabled={!viol.texte.trim()} onClick={addViolation}>Noter</button></>}>
          <label>Que s'est-il passé ?</label>
          <textarea rows={3} autoFocus value={viol.texte} onChange={e => setViol({ ...viol, texte: e.target.value })} />
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
