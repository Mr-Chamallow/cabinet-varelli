"use client";
import { PhotoPicker } from "@/components/PhotoPicker";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { CountUp } from "@/components/ui/CountUp";
import { hasPermission } from "@/lib/auth";
import { timeAgo } from "@/lib/activity";
import { exportXlsx } from "@/lib/exportXlsx";
import { useOpenOnNew } from "@/lib/useOpenOnNew";

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function localInputNow() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }

interface Arrest { id: string; membre: string; amende: number; argent_perdu: number; type_argent: string; items: any[]; notes?: string; created_by?: string; created_at: string; photo_url?: string | null; }
interface StockLite { id: string; nom: string; emoji: string; categorie: string; quantite: number; unite: string; }
const EMPTY = () => ({ membre: "", amende: "", argent: "", type_argent: "sale", date: localInputNow(), notes: "", photo_url: "" as string });

export default function ArrestationsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_arrestations"))) { window.location.href = "/"; } }, [user, userLoading]);

  const [list, setList] = useState<Arrest[]>([]);
  const [employes, setEmployes] = useState<string[]>([]);
  const [stocks, setStocks] = useState<StockLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY());
  const [zoom, setZoom] = useState<string | null>(null);
  const [rows, setRows] = useState<{ stock_id: string; quantite: number }[]>([]);
  const [filterMembre, setFilterMembre] = useState("");

  useEffect(() => { load(); }, []);
  useRealtimeTable(["arrestations", "obsidian_stocks"], load);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: a }, { data: e }, { data: s }] = await Promise.all([
      supabase.from("arrestations").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("obsidian_employes").select("nom,actif").order("nom"),
      supabase.from("obsidian_stocks").select("id,nom,emoji,categorie,quantite,unite").order("categorie").order("nom"),
    ]);
    setList((a || []).map((r: any) => ({ ...r, amende: Number(r.amende) || 0, argent_perdu: Number(r.argent_perdu) || 0, items: r.items || [] })));
    setEmployes((e || []).filter((x: any) => x.actif !== false).map((x: any) => x.nom).filter(Boolean));
    setStocks(s || []);
    setLoading(false);
  }

  const visible = list.filter(a => !filterMembre || a.membre === filterMembre);
  const totalAmendes = visible.reduce((s, a) => s + a.amende, 0);
  const totalArgent = visible.reduce((s, a) => s + a.argent_perdu, 0);
  const membres = useMemo(() => [...new Set([...employes, ...list.map(a => a.membre)])].filter(Boolean).sort((a, b) => a.localeCompare(b)), [list, employes]);
  const grouped = useMemo(() => {
    const m: Record<string, StockLite[]> = {};
    stocks.forEach(s => { (m[s.categorie] ??= []).push(s); });
    return Object.entries(m);
  }, [stocks]);

  function openForm() { setEditId(null); setForm(EMPTY()); setRows([]); setShowForm(true); }
  useOpenOnNew(!userLoading && !!user, () => openForm());

  function openEdit(a: Arrest) {
    const d = new Date(a.created_at); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditId(a.id);
    setForm({ membre: a.membre, amende: a.amende ? String(a.amende) : "", argent: a.argent_perdu ? String(a.argent_perdu) : "", type_argent: a.type_argent || "sale", date: d.toISOString().slice(0, 16), notes: a.notes || "", photo_url: a.photo_url || "" });
    setRows((a.items || []).filter((i: any) => i.stock_id).map((i: any) => ({ stock_id: i.stock_id, quantite: Number(i.quantite) || 1 })));
    setShowForm(true);
  }

  function exportList() {
    exportXlsx("arrestations", { Arrestations: visible.map(a => ({
      Date: new Date(a.created_at).toLocaleString("fr-FR"), Employé: a.membre, Amende: a.amende, "Argent perdu": a.argent_perdu, "Type argent": a.type_argent,
      Objets: (a.items || []).map((i: any) => `${i.nom} x${i.quantite}`).join(", "), Notes: a.notes || "", "Saisi par": a.created_by || "",
    })) });
  }

  async function save() {
    if (!form.membre) return;
    setSaving(true);
    const payload = {
      membre: form.membre,
      amende: Number(form.amende) || 0,
      argent_perdu: Number(form.argent) || 0,
      type_argent: form.type_argent,
      items: rows.filter(r => r.stock_id && r.quantite > 0),
      notes: form.notes.trim() || null,
      photo_url: form.photo_url || null,
      created_by: (user as any)?.nom || "",
      created_at: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    };
    const res = await fetch("/api/obsidian/arrestations", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? { ...payload, id: editId } : payload) });
    const out = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); load(); return; }
    setShowForm(false);
    showToast(editId ? "Arrestation modifiée (stock et prime recalculés)" : "Arrestation enregistrée (stock mis à jour, amende = prime de paie)");
    load();
  }

  async function del(a: Arrest) {
    if (!window.confirm(`Annuler l'arrestation de ${a.membre} ? Les objets seront remis en stock et la prime de paie retirée.`)) return;
    const res = await fetch("/api/obsidian/arrestations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); return; }
    setList(l => l.filter(x => x.id !== a.id));
    showToast("Arrestation annulée");
  }

  const stockOf = (id: string) => stocks.find(s => s.id === id);

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">🚔 Arrestations</h1>
          <p className="page-subtitle">Amende = prime de paie · argent perdu et objets saisis = notés sur le profil (pas en compta)</p>
          <div className="gold-line" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" onClick={exportList} disabled={visible.length === 0}>⬇️ Excel</button>
          <button className="btn btn-gold" onClick={openForm}>+ Nouvelle arrestation</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={filterMembre} onChange={e => setFilterMembre(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Tous les employés</option>
          {membres.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Arrestations</div><div className="stat-value" style={{ fontSize: "1.4rem" }}><CountUp value={visible.length} /></div></div>
        <div className="stat-card"><div className="stat-label">Total amendes</div><div className="stat-value" style={{ color: "var(--warning)", fontSize: "1.4rem" }}><CountUp value={totalAmendes} format={fmt} /></div></div>
        <div className="stat-card"><div className="stat-label">Argent perdu</div><div className="stat-value" style={{ color: "var(--danger)", fontSize: "1.4rem" }}><CountUp value={totalArgent} format={fmt} /></div></div>
      </div>

      {loading ? <LoadingBlock /> : visible.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🚔</div><div className="empty-title">Aucune arrestation</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {visible.map(a => (
            <div key={a.id} className="card" style={{ padding: "0.75rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>🚔</div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{a.membre}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
                    {new Date(a.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {timeAgo(a.created_at)}
                    {a.created_by && a.created_by !== a.membre ? ` · saisi par ${a.created_by}` : ""}
                    {a.notes ? ` · ${a.notes}` : ""}
                  </div>
                </div>
                {a.photo_url && <img src={a.photo_url} alt="Photo de l'arrestation" title="Voir la photo" onClick={() => setZoom(a.photo_url!)} style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)", cursor: "zoom-in" }} />}
                {a.amende > 0 && <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: 999, background: "rgba(234,179,8,0.12)", color: "var(--warning)", border: "1px solid rgba(234,179,8,0.3)", fontWeight: 700 }}>Amende {fmt(a.amende)}</span>}
                {a.argent_perdu > 0 && <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: 999, background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700 }}>−{fmt(a.argent_perdu)} ({a.type_argent})</span>}
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} title="Modifier">✏️</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(a)} title="Annuler (remet le stock)">🗑️</button>
              </div>
              {a.items.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                  {a.items.map((it: any, i: number) => (
                    <span key={i} style={{ fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      {it.emoji} {it.nom} × {it.quantite}{it.retire < it.quantite ? ` (stock : ${it.retire} retiré)` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal
          title={editId ? "Modifier l'arrestation" : "Nouvelle arrestation"}
          size="lg"
          onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.membre} onClick={save}>{saving ? "…" : "Enregistrer"}</button></>}
        >
          <div className="form-grid">
            <div>
              <label>Employé arrêté *</label>
              <select value={form.membre} onChange={e => setForm({ ...form, membre: e.target.value })}>
                <option value="">— Choisir —</option>
                {employes.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              {employes.length === 0 && <div style={{ fontSize: "0.68rem", color: "var(--warning)", marginTop: 4 }}>Aucun employé : ajoute-les dans la page Employés.</div>}
            </div>
            <div>
              <label>Date et heure</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label>🧾 Amende ($) — non déduite du solde</label>
              <input type="number" min="0" value={form.amende} onChange={e => setForm({ ...form, amende: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label>💵 Argent perdu ($) — noté sur le profil, pas en compta</label>
              <input type="number" min="0" value={form.argent} onChange={e => setForm({ ...form, argent: e.target.value })} placeholder="0" />
            </div>
          </div>
          {Number(form.argent) > 0 && (
            <div>
              <label>Type d'argent perdu</label>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                {["sale", "propre", "mixte"].map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type_argent: t })} style={{ padding: "0.3rem 0.7rem", borderRadius: "var(--radius)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Inter',sans-serif", fontWeight: form.type_argent === t ? 700 : 400, background: form.type_argent === t ? "var(--gold-muted)" : "var(--surface)", border: `1px solid ${form.type_argent === t ? "rgba(var(--gold-rgb),0.4)" : "var(--border)"}`, color: form.type_argent === t ? "var(--gold)" : "var(--text-muted)" }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label>Objets perdus (retirés du stock)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {rows.map((r, i) => {
                const st = stockOf(r.stock_id);
                return (
                  <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <select value={r.stock_id} onChange={e => setRows(rs => rs.map((x, j) => j === i ? { ...x, stock_id: e.target.value } : x))} style={{ flex: 1 }}>
                      <option value="">— Objet —</option>
                      {grouped.map(([cat, arr]) => (
                        <optgroup key={cat} label={cat}>
                          {arr.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.nom} (stock : {s.quantite})</option>)}
                        </optgroup>
                      ))}
                    </select>
                    <input type="number" min="1" value={r.quantite} onChange={e => setRows(rs => rs.map((x, j) => j === i ? { ...x, quantite: Math.max(1, Number(e.target.value) || 1) } : x))} style={{ width: 80 }} />
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>✕</button>
                    {st && r.quantite > st.quantite && <span style={{ fontSize: "0.65rem", color: "var(--warning)" }}>⚠️ stock insuffisant</span>}
                  </div>
                );
              })}
              <div><button type="button" className="btn btn-outline btn-sm" onClick={() => setRows(rs => [...rs, { stock_id: "", quantite: 1 }])}>+ Ajouter un objet</button></div>
            </div>
          </div>

          <div>
            <label>📷 Photo (preuve — inventaire, saisie…)</label>
            <PhotoPicker evidence value={form.photo_url} onChange={u => setForm(f => ({ ...f, photo_url: u || "" }))} />
          </div>
          <div>
            <label>Notes (optionnel)</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Lieu, circonstances…" />
          </div>
        </Modal>
      )}
      {zoom && <div onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.88)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: "2vh 2vw" }}><img src={zoom} alt="" style={{ maxWidth: "100%", maxHeight: "96vh", borderRadius: 8 }} /></div>}
      <Toast toast={toast} />
    </div>
  );
}
