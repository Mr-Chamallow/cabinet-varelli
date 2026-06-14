"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

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
  created_by: string;
}

const TYPE_CLIENTS = ["Indépendant", "Gang", "PF", "Famille", "Petit frappe"];
const RISQUES = ["Aucun", "Faible", "Moyen", "Élevé", "Extrême"];
const STATUTS = ["Ouvert", "En cours", "Clôturé", "Gagné", "Perdu"];
const TYPES_AFFAIRE = [
  "Défense pénale", "Appel / Expungement", "Droit civil", "Adoption",
  "Divorce", "Contrat", "Conseil juridique", "Autre",
];

const BADGE_RISQUE: Record<string, string> = {
  Aucun: "badge-muted", Faible: "badge-success",
  Moyen: "badge-warning", Élevé: "badge-danger", Extrême: "badge-danger",
};
const BADGE_STATUT: Record<string, string> = {
  Ouvert: "badge-info", "En cours": "badge-warning",
  Clôturé: "badge-muted", Gagné: "badge-success", Perdu: "badge-danger",
};

function genRef() {
  return `DOS-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
}

const EMPTY_FORM = {
  reference: "", client: "", client_id: "",
  type_affaire: "Défense pénale", type_client: "Indépendant",
  risque: "Aucun", montant: 0, statut: "Ouvert", notes: "",
};

export default function DossiersPage() {
  const user = getUser();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [clients, setClients] = useState<{ id: string; nom_rp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Dossier | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Dossier | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

  useEffect(() => { if (user) load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("dossiers").select("*").eq("created_by", user.nom).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, nom_rp").eq("created_by", user.nom).order("nom_rp"),
    ]);
    setDossiers(d || []);
    setClients(c || []);
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openNew() {
    setForm({ ...EMPTY_FORM, reference: genRef() });
    setEditTarget(null);
    setSaveError("");
    setShowForm(true);
  }

  function openEdit(d: Dossier) {
    setForm({
      reference: d.reference, client: d.client, client_id: d.client_id || "",
      type_affaire: d.type_affaire || "Défense pénale", type_client: d.type_client || "Indépendant",
      risque: d.risque || "Aucun", montant: d.montant || 0, statut: d.statut || "Ouvert", notes: d.notes || "",
    });
    setEditTarget(d);
    setSaveError("");
    setShowForm(true);
  }

  // Quand on choisit un client dans la liste
  function handleClientSelect(nomRp: string) {
    const found = clients.find(c => c.nom_rp === nomRp);
    setForm(f => ({ ...f, client: nomRp, client_id: found?.id || "" }));
  }

  async function save() {
    if (!supabase || !user) return;
    if (!form.client.trim()) { setSaveError("Le nom du client est obligatoire."); return; }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        reference: form.reference,
        client: form.client.trim(),
        client_id: form.client_id || null,
        type_affaire: form.type_affaire,
        type_client: form.type_client,
        risque: form.risque,
        montant: Number(form.montant) || 0,
        statut: form.statut,
        notes: form.notes,
        created_by: user.nom,
      };

      if (editTarget) {
        const { error } = await supabase.from("dossiers").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        showToast("Dossier mis à jour");
      } else {
        const { error } = await supabase.from("dossiers").insert([payload]);
        if (error) throw error;
        showToast("Dossier créé ✓");
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setSaveError(err?.message || "Erreur lors de l'enregistrement");
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

  const filtered = dossiers.filter(d => {
    const q = search.toLowerCase();
    return (
      (!search || d.reference?.toLowerCase().includes(q) || d.client?.toLowerCase().includes(q) || d.type_affaire?.toLowerCase().includes(q)) &&
      (!filterStatut || d.statut === filterStatut)
    );
  });

  const fmt = (n: number) => n?.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) || "—";
  const dateStr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Référence, client, type d'affaire…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-icon">📁</div><div className="empty-title">Chargement…</div></div>
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
                <th>Référence</th><th>Client</th><th>Type d'affaire</th><th>Type client</th>
                <th>Risque</th><th>Montant</th><th>Statut</th><th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td><span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--gold)" }}>{d.reference}</span></td>
                  <td style={{ fontWeight: 500 }}>{d.client}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{d.type_affaire}</td>
                  <td><span className="badge badge-muted">{d.type_client}</span></td>
                  <td><span className={`badge ${BADGE_RISQUE[d.risque] || "badge-muted"}`}>{d.risque || "Aucun"}</span></td>
                  <td style={{ color: "var(--gold)", fontWeight: 600 }}>{fmt(d.montant)}</td>
                  <td><span className={`badge ${BADGE_STATUT[d.statut] || "badge-muted"}`}>{d.statut}</span></td>
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

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
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
                    <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Client *</label>
                    <input
                      placeholder="Choisir ou saisir un nom RP"
                      value={form.client}
                      onChange={e => handleClientSelect(e.target.value)}
                      list="clients-datalist"
                      autoComplete="off"
                    />
                    <datalist id="clients-datalist">
                      {clients.map(c => <option key={c.id} value={c.nom_rp} />)}
                    </datalist>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Type d'affaire</label>
                    <select value={form.type_affaire} onChange={e => setForm({ ...form, type_affaire: e.target.value })}>
                      {TYPES_AFFAIRE.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type client</label>
                    <select value={form.type_client} onChange={e => setForm({ ...form, type_client: e.target.value })}>
                      {TYPE_CLIENTS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Risque</label>
                    <select value={form.risque} onChange={e => setForm({ ...form, risque: e.target.value })}>
                      {RISQUES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Montant ($)</label>
                    <input type="number" min={0} value={form.montant} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                      {STATUTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows={4} placeholder="Détails de l'affaire, éléments à retenir…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>

                {saveError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "0.75rem", fontSize: "0.84rem", color: "var(--danger)" }}>
                    ⚠️ {saveError}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Créer le dossier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer ce dossier ?</div>
            <div className="confirm-msg"><strong style={{ color: "var(--text)" }}>{confirmDelete.reference}</strong> — {confirmDelete.client}</div>
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
