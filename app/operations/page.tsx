"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Operation {
  id: string;
  type: string;
  montant: number;
  motif: string;
  created_at: string;
}

const TYPES = ["Entrée", "Sortie"];
const EMPTY_FORM = { type: "Entrée", montant: 0, motif: "" };

export default function OperationsPage() {
  const [ops, setOps] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Operation | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
    setOps(data || []);
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function save() {
    if (!supabase || !form.motif.trim() || form.montant <= 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("operations").insert([form]);
      if (error) throw error;
      showToast("Opération enregistrée");
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    } catch {
      showToast("Erreur lors de l'enregistrement", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!supabase || !confirmDelete) return;
    await supabase.from("operations").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showToast("Opération supprimée");
    load();
  }

  const filtered = ops.filter(
    (o) =>
      o.motif?.toLowerCase().includes(search.toLowerCase()) ||
      o.type?.toLowerCase().includes(search.toLowerCase())
  );

  const totalEntrees = ops.filter(o => o.type === "Entrée").reduce((s, o) => s + (o.montant || 0), 0);
  const totalSorties = ops.filter(o => o.type === "Sortie").reduce((s, o) => s + (o.montant || 0), 0);
  const solde = totalEntrees - totalSorties;

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Opérations</h1>
          <p className="page-subtitle">Flux financiers du cabinet</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          + Nouvelle opération
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-label">Total entrées</div>
          <div className="stat-value" style={{ fontSize: "1.5rem", color: "var(--success)" }}>{fmt(totalEntrees)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-label">Total sorties</div>
          <div className="stat-value" style={{ fontSize: "1.5rem", color: "var(--danger)" }}>{fmt(totalSorties)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: solde >= 0 ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)" }}>
          <div className="stat-icon">⚖️</div>
          <div className="stat-label">Solde</div>
          <div className="stat-value" style={{ fontSize: "1.5rem", color: solde >= 0 ? "var(--success)" : "var(--danger)" }}>
            {solde >= 0 ? "+" : ""}{fmt(solde)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Rechercher par motif, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>💸</div><div className="empty-title">Chargement…</div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <div className="empty-title">{search ? "Aucun résultat" : "Aucune opération"}</div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Enregistrez votre première opération financière.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Motif</th>
                <th>Montant</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>
                    <span className={`badge ${o.type === "Entrée" ? "badge-success" : "badge-danger"}`}>
                      {o.type === "Entrée" ? "↑" : "↓"} {o.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: 300 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {o.motif}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: o.type === "Entrée" ? "var(--success)" : "var(--danger)", fontSize: "1rem" }}>
                    {o.type === "Entrée" ? "+" : "-"}{fmt(o.montant)}
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{dateStr(o.created_at)}</td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(o)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouvelle opération</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type *</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Montant ($) *</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.montant || ""}
                      onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Motif *</label>
                  <textarea
                    rows={3}
                    placeholder="Description de l'opération…"
                    value={form.motif}
                    onChange={(e) => setForm({ ...form, motif: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={save}
                disabled={saving || !form.motif.trim() || form.montant <= 0}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette opération ?</div>
            <div className="confirm-msg">{confirmDelete.motif}</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✅" : "❌"} {toast.msg}</div>
        </div>
      )}
    </div>
  );
}
