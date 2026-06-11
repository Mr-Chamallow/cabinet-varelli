"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Dossier {
  id: string;
  reference: string;
  client_id: string;
  client: string;
  type_affaire: string;
  type_client: string;
  risque: string;
  montant: number;
  statut: string;
  notes: string;
  created_at: string;
}

const TYPE_CLIENTS = ["Indépendant", "Gang", "PF", "Famille", "Petit frappe"];
const RISQUES = ["Aucun", "Faible", "Moyen", "Élevé", "Extrême"];
const STATUTS = ["Ouvert", "En cours", "Clôturé", "Gagné", "Perdu"];
const TYPES_AFFAIRE = [
  "Défense pénale", "Appel / Expungement", "Droit civil", "Adoption",
  "Divorce", "Contrat", "Conseil juridique", "Autre",
];

const EMPTY_FORM = {
  reference: "",
  client: "",
  client_id: "",
  type_affaire: "Défense pénale",
  type_client: "Indépendant",
  risque: "Aucun",
  montant: 0,
  statut: "Ouvert",
  notes: "",
};

function genRef() {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `DOS-${new Date().getFullYear()}-${n}`;
}

const BADGE_RISQUE: Record<string, string> = {
  Aucun: "badge-muted",
  Faible: "badge-success",
  Moyen: "badge-warning",
  Élevé: "badge-danger",
  Extrême: "badge-danger",
};

const BADGE_STATUT: Record<string, string> = {
  Ouvert: "badge-info",
  "En cours": "badge-warning",
  Clôturé: "badge-muted",
  Gagné: "badge-success",
  Perdu: "badge-danger",
};

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [clients, setClients] = useState<{ id: string; nom_rp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Dossier | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Dossier | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("dossiers").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom_rp").order("nom_rp"),
    ]);
    setDossiers(d || []);
    setClients(c || []);
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setForm({ ...EMPTY_FORM, reference: genRef() });
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(d: Dossier) {
    setForm({
      reference: d.reference,
      client: d.client,
      client_id: d.client_id || "",
      type_affaire: d.type_affaire || "Défense pénale",
      type_client: d.type_client || "Indépendant",
      risque: d.risque || "Aucun",
      montant: d.montant || 0,
      statut: d.statut || "Ouvert",
      notes: d.notes || "",
    });
    setEditTarget(d);
    setShowForm(true);
  }

  async function save() {
    if (!supabase || !form.client.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (editTarget) {
        const { error } = await supabase.from("dossiers").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        showToast("Dossier mis à jour");
      } else {
        const { error } = await supabase.from("dossiers").insert([payload]);
        if (error) throw error;
        showToast("Dossier créé");
      }
      setShowForm(false);
      load();
    } catch {
      showToast("Erreur lors de l'enregistrement", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!supabase || !confirmDelete) return;
    await supabase.from("dossiers").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showToast("Dossier supprimé");
    load();
  }

  const filtered = dossiers.filter((d) => {
    const matchSearch =
      d.reference?.toLowerCase().includes(search.toLowerCase()) ||
      d.client?.toLowerCase().includes(search.toLowerCase()) ||
      d.type_affaire?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || d.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const fmt = (n: number) =>
    n?.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) || "—";

  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const totalMontant = filtered.reduce((s, d) => s + (d.montant || 0), 0);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Dossiers</h1>
          <p className="page-subtitle">{filtered.length} dossier{filtered.length !== 1 ? "s" : ""} · {fmt(totalMontant)} engagé</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={openNew}>+ Nouveau dossier</button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Rechercher par référence, client, type d'affaire…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>
          )}
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>📁</div><div className="empty-title">Chargement…</div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">{search || filterStatut ? "Aucun résultat" : "Aucun dossier"}</div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{search || filterStatut ? "Modifiez vos filtres" : "Créez votre premier dossier."}</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Type d'affaire</th>
                <th>Type client</th>
                <th>Risque</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gold)" }}>
                      {d.reference}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{d.client}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{d.type_affaire}</td>
                  <td>
                    <span className="badge badge-muted">{d.type_client}</span>
                  </td>
                  <td>
                    <span className={`badge ${BADGE_RISQUE[d.risque] || "badge-muted"}`}>{d.risque || "Aucun"}</span>
                  </td>
                  <td style={{ color: "var(--gold)", fontWeight: 600 }}>{fmt(d.montant)}</td>
                  <td>
                    <span className={`badge ${BADGE_STATUT[d.statut] || "badge-muted"}`}>{d.statut}</span>
                  </td>
                  <td style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>{dateStr(d.created_at)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(d)}>🗑️</button>
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
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Modifier le dossier" : "Nouveau dossier"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Référence</label>
                    <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Client *</label>
                    <input
                      placeholder="Nom RP du client"
                      value={form.client}
                      onChange={(e) => setForm({ ...form, client: e.target.value })}
                      list="clients-list"
                    />
                    <datalist id="clients-list">
                      {clients.map((c) => <option key={c.id} value={c.nom_rp} />)}
                    </datalist>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Type d'affaire</label>
                    <select value={form.type_affaire} onChange={(e) => setForm({ ...form, type_affaire: e.target.value })}>
                      {TYPES_AFFAIRE.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type client</label>
                    <select value={form.type_client} onChange={(e) => setForm({ ...form, type_client: e.target.value })}>
                      {TYPE_CLIENTS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Risque</label>
                    <select value={form.risque} onChange={(e) => setForm({ ...form, risque: e.target.value })}>
                      {RISQUES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Montant ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.montant}
                      onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      {STATUTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Détails de l'affaire, éléments à retenir…"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={save}
                disabled={saving || !form.client.trim()}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Créer le dossier"}
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
            <div className="confirm-title">Supprimer ce dossier ?</div>
            <div className="confirm-msg">
              <strong style={{ color: "var(--text)" }}>{confirmDelete.reference}</strong> — {confirmDelete.client} sera définitivement supprimé.
            </div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✅" : "❌"} {toast.msg}</div>
        </div>
      )}
    </div>
  );
}
