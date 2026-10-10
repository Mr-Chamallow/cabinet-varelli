"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { gmWrite } from "@/lib/gmApi";
import { pdfAudit } from "@/lib/pdfDocs";
import { useGmAccess, useOrgs, Badge, fmtDT, toLocalInput, fromLocalInput } from "@/components/gm/bits";

const pad = (n: number) => String(n).padStart(2, "0");
function cd(ms: number) { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }
const EMPTY = { organisation: "", note: 5, appreciation: "", sanction: "", sanction_fin: "", notes: "" };

export default function AuditsPage() {
  const { canWrite } = useGmAccess("gm_audits");
  const { toast, showToast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const orgs = useOrgs(list.length);

  useEffect(() => { load(); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  useRealtimeTable("gm_audits", load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("gm_audits").select("*").order("created_at", { ascending: false });
    setList(data || []); setLoading(false);
  }
  function openNew() { setEditId(null); setForm(EMPTY); setShow(true); }
  function openEdit(a: any) { setEditId(a.id); setForm({ organisation: a.organisation, note: a.note, appreciation: a.appreciation || "", sanction: a.sanction || "", sanction_fin: toLocalInput(a.sanction_fin), notes: a.notes || "" }); setShow(true); }
  function quickDuration(h: number) { const d = new Date(Date.now() + h * 3600_000); setForm((f: any) => ({ ...f, sanction_fin: toLocalInput(d.toISOString()) })); }
  async function save() {
    if (!form.organisation.trim()) return;
    setSaving(true);
    const body = { ...form, note: Number(form.note), sanction_fin: fromLocalInput(form.sanction_fin) };
    const r = await gmWrite("gm_audits", editId ? "PATCH" : "POST", editId ? { ...body, id: editId } : body);
    setSaving(false);
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setShow(false); showToast("Audit enregistré (réputation mise à jour)"); load();
  }
  async function del(a: any) {
    if (!window.confirm(`Supprimer l'audit de ${a.organisation} ?`)) return;
    const r = await gmWrite("gm_audits", "DELETE", { id: a.id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Supprimé"); load(); }
  }
  const active = list.filter(a => a.sanction && a.sanction_fin && new Date(a.sanction_fin).getTime() > now);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">🔎 Audits de conformité</h1><p className="page-subtitle">Notes · Sanctions · Compte à rebours</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouvel audit</button>}
      </div>
      {active.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="section-title" style={{ marginBottom: "0.6rem" }}>⛔ Sanctions en cours</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.5rem" }}>
            {active.map(a => (
              <div key={a.id} style={{ border: "1px solid rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.07)", borderRadius: "var(--radius)", padding: "0.5rem 0.75rem" }}>
                <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{a.organisation}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{a.sanction}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--warning)" }}>⏳ {cd(new Date(a.sanction_fin).getTime() - now)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading ? <LoadingBlock /> : list.length === 0 ? <div className="empty-state"><div className="empty-icon">🔎</div><div className="empty-title">Aucun audit</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {list.map(a => {
            const good = a.note >= 5; const col = a.note >= 7 ? "var(--success)" : good ? "var(--info)" : a.note >= 3 ? "var(--warning)" : "var(--danger)";
            return (
              <div key={a.id} className="card" style={{ padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.9rem", flexWrap: "wrap" }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2px solid ${col}`, color: col, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>{a.note}<span style={{ fontSize: "0.55rem" }}>/10</span></div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700 }}>{a.organisation}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{a.appreciation || "—"}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>{fmtDT(a.created_at)}{a.created_by ? ` · ${a.created_by}` : ""}{a.notes ? ` · ${a.notes}` : ""}</div>
                </div>
                {a.sanction && <Badge color="var(--warning)">⛔ {a.sanction}{a.sanction_fin ? ` · jusqu'au ${fmtDT(a.sanction_fin)}` : ""}</Badge>}
                <button className="btn btn-ghost btn-sm" title="PDF" onClick={() => pdfAudit(a)}>📄</button>
                {canWrite && <><button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(a)}>🗑️</button></>}
              </div>
            );
          })}
        </div>
      )}
      {show && (
        <Modal title={editId ? "Modifier l'audit" : "Nouvel audit"} onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.organisation.trim()} onClick={save}>{saving ? "…" : "Enregistrer"}</button></>}>
          <div><label>Organisation *</label><input list="aud-orgs" value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} /><datalist id="aud-orgs">{orgs.map(o => <option key={o} value={o} />)}</datalist></div>
          <div><label>Note : {form.note}/10 <span style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}>(5 = neutre ; réputation {Math.round((form.note - 5) * 4) >= 0 ? "+" : ""}{Math.round((form.note - 5) * 4)})</span></label>
            <input type="range" min={0} max={10} value={form.note} onChange={e => setForm({ ...form, note: Number(e.target.value) })} /></div>
          <div><label>Appréciation</label><input value={form.appreciation} onChange={e => setForm({ ...form, appreciation: e.target.value })} placeholder="Bilan, guerres récentes, respect des pactes…" /></div>
          <div className="form-grid">
            <div><label>Sanction (optionnel)</label><input value={form.sanction} onChange={e => setForm({ ...form, sanction: e.target.value })} placeholder="Embargo armes, taxe…" /></div>
            <div><label>Fin de la sanction</label><input type="datetime-local" value={form.sanction_fin} onChange={e => setForm({ ...form, sanction_fin: e.target.value })} />
              <div style={{ display: "flex", gap: "0.3rem", marginTop: 4 }}>{[24, 48, 72, 168].map(h => <button type="button" key={h} className="btn btn-outline btn-sm" onClick={() => quickDuration(h)}>{h === 168 ? "7 j" : `${h} h`}</button>)}</div></div>
          </div>
          <div><label>Notes internes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Quand une sanction se termine, une alerte Discord est envoyée automatiquement.</div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
