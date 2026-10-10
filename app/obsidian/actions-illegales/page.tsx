"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { CountUp } from "@/components/ui/CountUp";
import { hasPermission, hasWriteAccess } from "@/lib/auth";
import { timeAgo } from "@/lib/activity";
import { exportXlsx } from "@/lib/exportXlsx";
import { useOpenOnNew } from "@/lib/useOpenOnNew";
import { ActionType, DEFAULT_ACTION_TYPES, rowToType, fmtDelai } from "@/lib/actionTypes";

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PERIODS = [
  { k: "all", label: "Tout", ms: 0 },
  { k: "day", label: "24 h", ms: 86400_000 },
  { k: "week", label: "7 jours", ms: 7 * 86400_000 },
  { k: "month", label: "30 jours", ms: 30 * 86400_000 },
];

interface Entry { id: string; membre: string; action: string; montant: number; notes?: string; created_by?: string; created_at: string; }

function pad(n: number) { return String(n).padStart(2, "0"); }
function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
function localInputNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ActionsIllegalesPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_actions"))) { window.location.href = "/"; } }, [user, userLoading]);
  const canWrite = !!user && hasWriteAccess(user, "obsidian_actions");
  const canDeleteAll = !!user && hasWriteAccess(user, "delete_all");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [types, setTypes] = useState<ActionType[]>(DEFAULT_ACTION_TYPES);
  const [employes, setEmployes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [period, setPeriod] = useState("all");
  const [filterAction, setFilterAction] = useState("");
  const [filterMembre, setFilterMembre] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ action: DEFAULT_ACTION_TYPES[0].nom, membre: "", resultat: "gain", montant: "", date: localInputNow(), notes: "" });

  useEffect(() => { load(); }, []);
  useRealtimeTable(["actions_illegales", "actions_illegales_types"], load);
  const actionInfo = (nom: string): ActionType => types.find(a => a.nom === nom) || { nom, icon: "🕶️", delaiMin: 0, ordre: 999, actif: false };
  const activeTypes = types.filter(t => t.actif);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data }, { data: emp }, { data: ty, error: tyErr }] = await Promise.all([
      supabase.from("actions_illegales").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("obsidian_employes").select("nom").order("nom"),
      supabase.from("actions_illegales_types").select("*").order("ordre").order("nom"),
    ]);
    if (!tyErr && ty && ty.length > 0) setTypes(ty.map(rowToType));
    setEntries((data || []).map((e: any) => ({ ...e, montant: Number(e.montant) || 0 })));
    setEmployes((emp || []).map((e: any) => e.nom).filter(Boolean));
    setLoading(false);
  }

  // Dernière fois que chaque personne a fait chaque action → fin de cooldown.
  const lastByKey = useMemo(() => {
    const m = new Map<string, number>();
    entries.forEach(e => {
      const k = `${e.membre}||${e.action}`;
      const t = new Date(e.created_at).getTime();
      if (!m.has(k) || t > (m.get(k) as number)) m.set(k, t);
    });
    return m;
  }, [entries]);

  const membres = useMemo(() => [...new Set(entries.map(e => e.membre))].sort((a, b) => a.localeCompare(b)), [entries]);
  const suggestions = useMemo(() => [...new Set([...employes, ...membres])], [employes, membres]);

  function remainingMs(membre: string, action: string) {
    const info = actionInfo(action);
    if (!info.delaiMin) return 0;
    const last = lastByKey.get(`${membre}||${action}`);
    if (!last) return 0;
    return Math.max(0, last + info.delaiMin * 60_000 - now);
  }

  const periodMs = PERIODS.find(p => p.k === period)?.ms || 0;
  const visible = entries.filter(e =>
    (!periodMs || now - new Date(e.created_at).getTime() <= periodMs) &&
    (!filterAction || e.action === filterAction) &&
    (!filterMembre || e.membre === filterMembre)
  );
  const gains = visible.filter(e => e.montant > 0).reduce((s, e) => s + e.montant, 0);
  const pertes = visible.filter(e => e.montant < 0).reduce((s, e) => s + e.montant, 0);
  const net = gains + pertes;

  const perAction = types.map(a => {
    const list = visible.filter(e => e.action === a.nom);
    return { ...a, count: list.length, net: list.reduce((s, e) => s + e.montant, 0) };
  }).filter(a => a.count > 0);

  useOpenOnNew(!userLoading && !!user && canWrite, () => openForm());

  function openEdit(e: Entry) {
    const d = new Date(e.created_at); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setEditId(e.id);
    setForm({ action: e.action, membre: e.membre, resultat: e.montant < 0 ? "perte" : "gain", montant: String(Math.abs(e.montant) || ""), date: d.toISOString().slice(0, 16), notes: e.notes || "" });
    setShowForm(true);
  }

  function exportList() {
    exportXlsx("actions-illegales", { Actions: visible.map(e => ({ Date: new Date(e.created_at).toLocaleString("fr-FR"), Personne: e.membre, Action: e.action, Montant: e.montant, Notes: e.notes || "", "Saisi par": e.created_by || "" })) });
  }

  function openForm() {
    setEditId(null);
    setForm({ action: activeTypes[0]?.nom || DEFAULT_ACTION_TYPES[0].nom, membre: (user as any)?.nom || "", resultat: "gain", montant: "", date: localInputNow(), notes: "" });
    setShowForm(true);
  }

  async function save() {
    if (!supabase || !form.membre.trim() || !form.action) return;
    const abs = Math.abs(Number(form.montant) || 0);
    setSaving(true);
    const payload = {
      membre: form.membre.trim(),
      action: form.action,
      montant: form.resultat === "perte" ? -abs : abs,
      notes: form.notes.trim() || null,
      created_by: (user as any)?.nom || null,
      created_at: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    };
    const res = await fetch("/api/obsidian/actions", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editId ? { ...payload, id: editId } : payload) });
    const out = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); return; }
    setShowForm(false);
    showToast(editId ? "Action modifiée (compta mise à jour)" : "Action enregistrée (ajoutée à la compta)");
    load();
  }

  async function del(id: string) {
    const res = await fetch("/api/obsidian/actions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); return; }
    setEntries(list => list.filter(e => e.id !== id));
    showToast("Supprimé (retiré aussi de la compta)");
  }

  const formRemaining = form.membre.trim() ? remainingMs(form.membre.trim(), form.action) : 0;
  const timedActions = activeTypes.filter(a => a.delaiMin > 0);
  const freeActions = activeTypes.filter(a => a.delaiMin === 0);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.75rem", borderRadius: 999, cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Inter',sans-serif",
    border: `1px solid ${active ? "rgba(var(--gold-rgb),0.5)" : "var(--border)"}`,
    background: active ? "rgba(var(--gold-rgb),0.12)" : "transparent",
    color: active ? "var(--gold)" : "var(--text-muted)", fontWeight: active ? 600 : 400,
  });

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">🕶️ Actions illégales</h1>
          <p className="page-subtitle">Gains · Pertes · Délais par personne</p>
          <div className="gold-line" />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" onClick={exportList} disabled={visible.length === 0}>⬇️ Excel</button>
          {canWrite && <button className="btn btn-gold" onClick={openForm}>+ Enregistrer une action</button>}
        </div>
      </div>

      {/* Délais en cours */}
      {timedActions.map(a => (
        <div key={a.nom} className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.1rem" }}>{a.icon}</span>
            <span style={{ fontWeight: 700 }}>{a.nom}</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>1 fois toutes les {fmtDelai(a.delaiMin)} par personne</span>
          </div>
          {membres.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Aucune action enregistrée pour le moment.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "0.5rem" }}>
              {membres.map(m => {
                const rem = remainingMs(m, a.nom);
                const done = lastByKey.has(`${m}||${a.nom}`);
                const ready = rem === 0;
                const col = ready ? "var(--success)" : "var(--warning)";
                return (
                  <div key={m} style={{ border: `1px solid ${ready ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.3)"}`, background: ready ? "rgba(34,197,94,0.06)" : "rgba(234,179,8,0.07)", borderRadius: "var(--radius)", padding: "0.5rem 0.75rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: ready ? "0.8rem" : "1.05rem", fontWeight: 700, color: col }}>
                      {ready ? (done ? "✅ Disponible" : "✅ Jamais fait") : `⏳ ${countdown(rem)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
        Sans délai : {freeActions.map(a => `${a.icon} ${a.nom}`).join(" · ")}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        {PERIODS.map(p => <button key={p.k} onClick={() => setPeriod(p.k)} style={chip(period === p.k)}>{p.label}</button>)}
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ maxWidth: 190 }}>
          <option value="">Toutes les actions</option>
          {types.map(a => <option key={a.nom} value={a.nom}>{a.icon} {a.nom}</option>)}
        </select>
        <select value={filterMembre} onChange={e => setFilterMembre(e.target.value)} style={{ maxWidth: 190 }}>
          <option value="">Toutes les personnes</option>
          {membres.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Gains</div><div className="stat-value" style={{ color: "var(--success)", fontSize: "1.4rem" }}><CountUp value={gains} format={fmt} /></div></div>
        <div className="stat-card"><div className="stat-label">Pertes</div><div className="stat-value" style={{ color: "var(--danger)", fontSize: "1.4rem" }}><CountUp value={pertes} format={fmt} /></div></div>
        <div className="stat-card"><div className="stat-label">Net</div><div className="stat-value" style={{ color: net >= 0 ? "var(--success)" : "var(--danger)", fontSize: "1.4rem" }}><CountUp value={net} format={fmt} /></div></div>
        <div className="stat-card"><div className="stat-label">Actions</div><div className="stat-value" style={{ fontSize: "1.4rem" }}><CountUp value={visible.length} /></div></div>
      </div>

      {perAction.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {perAction.map(a => (
            <span key={a.nom} style={{ fontSize: "0.72rem", padding: "0.2rem 0.65rem", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {a.icon} {a.nom} · {a.count}× · <b style={{ color: a.net >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(a.net)}</b>
            </span>
          ))}
        </div>
      )}

      {/* Historique */}
      {loading ? <LoadingBlock /> : visible.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🕶️</div><div className="empty-title">Aucune action enregistrée</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {visible.slice(0, 200).map(e => {
            const info = actionInfo(e.action);
            const col = e.montant >= 0 ? "var(--success)" : "var(--danger)";
            return (
              <div key={e.id} className="card" style={{ padding: "0.65rem 1rem", display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>{info.icon}</div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{e.action} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {e.membre}</span></div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>
                    {new Date(e.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {timeAgo(e.created_at)}
                    {e.created_by && e.created_by !== e.membre ? ` · saisi par ${e.created_by}` : ""}
                    {e.notes ? ` · ${e.notes}` : ""}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: col, fontSize: "0.95rem" }}>{e.montant > 0 ? "+" : ""}{fmt(e.montant)}</div>
                {(canDeleteAll || (canWrite && e.created_by === (user as any)?.nom)) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)} title="Modifier">✏️</button>
                )}
                {(canDeleteAll || (canWrite && e.created_by === (user as any)?.nom)) && (
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(e.id)}>🗑️</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal
          title={editId ? "Modifier l'action" : "Enregistrer une action"}
          onClose={() => setShowForm(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.membre.trim()} onClick={save}>{saving ? "…" : "Enregistrer"}</button></>}
        >
          <div className="form-grid">
            <div>
              <label>Action</label>
              <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}>
                {activeTypes.map(a => <option key={a.nom} value={a.nom}>{a.icon} {a.nom}</option>)}
              </select>
            </div>
            <div>
              <label>Personne</label>
              <input list="aj-membres" value={form.membre} onChange={e => setForm({ ...form, membre: e.target.value })} placeholder="Nom" />
              <datalist id="aj-membres">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div>
              <label>Résultat</label>
              <select value={form.resultat} onChange={e => setForm({ ...form, resultat: e.target.value })}>
                <option value="gain">💰 Gain</option>
                <option value="perte">📉 Perte</option>
              </select>
            </div>
            <div>
              <label>Montant ($)</label>
              <input type="number" min="0" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label>Date et heure</label>
            <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label>Notes (optionnel)</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Détails, équipe, butin…" />
          </div>
          {formRemaining > 0 && (
            <div style={{ fontSize: "0.8rem", color: "var(--warning)" }}>
              ⚠️ {form.membre.trim()} est encore en délai pour « {form.action} » ({countdown(formRemaining)} restant).
            </div>
          )}
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
