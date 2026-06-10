"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  nom_rp: string;
  telephone: string;
  organisation: string;
  notes: string;
  created_at: string;
}

const EMPTY: Omit<Client, "id" | "created_at"> = {
  nom_rp: "",
  telephone: "",
  organisation: "",
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openNew() {
    setForm({ ...EMPTY });
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(c: Client) {
    setForm({ nom_rp: c.nom_rp, telephone: c.telephone, organisation: c.organisation, notes: c.notes });
    setEditTarget(c);
    setShowForm(true);
  }

  async function save() {
    if (!supabase || !form.nom_rp.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        const { error } = await supabase.from("clients").update(form).eq("id", editTarget.id);
        if (error) throw error;
        showToast("Client mis à jour");
      } else {
        const { error } = await supabase.from("clients").insert([form]);
        if (error) throw error;
        showToast("Client ajouté");
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
    await supabase.from("clients").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showToast("Client supprimé");
    load();
  }

  const filtered = clients.filter(
    (c) =>
      c.nom_rp?.toLowerCase().includes(search.toLowerCase()) ||
      c.organisation?.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone?.includes(search)
  );

  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? "s" : ""} enregistré{clients.length !== 1 ? "s" : ""}</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={openNew}>+ Nouveau client</button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Rechercher par nom, organisation, téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>⚖️</div>
          <div className="empty-title">Chargement…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <div className="empty-title">{search ? "Aucun résultat" : "Aucun client"}</div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {search ? "Modifiez votre recherche" : "Ajoutez votre premier client pour commencer."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filtered.map((c) => (
            <div key={c.id} className="card" style={{ position: "relative" }}>
              {/* Top */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "var(--gold-muted)",
                  border: "1.5px solid rgba(212,175,55,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}>
                  {c.nom_rp?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--text)",
                    marginBottom: "0.2rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {c.nom_rp}
                  </div>
                  {c.organisation && (
                    <span className="badge badge-gold">{c.organisation}</span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {c.telephone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <span>📞</span> {c.telephone}
                  </div>
                )}
                {c.notes && (
                  <div style={{
                    fontSize: "0.82rem",
                    color: "var(--text-dim)",
                    background: "var(--surface)",
                    borderRadius: 8,
                    padding: "0.5rem 0.75rem",
                    borderLeft: "2px solid var(--border)",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {c.notes}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  {dateStr(c.created_at)}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>✏️ Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(c)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Modifier le client" : "Nouveau client"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom RP *</label>
                    <input
                      placeholder="Ex : Marco Varelli"
                      value={form.nom_rp}
                      onChange={(e) => setForm({ ...form, nom_rp: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input
                      placeholder="Ex : 555-1234"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Organisation</label>
                  <input
                    placeholder="Ex : Bande des Ballas, Indépendant…"
                    value={form.organisation}
                    onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Informations complémentaires, contexte RP…"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={save}
                disabled={saving || !form.nom_rp.trim()}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Enregistrement…" : editTarget ? "Mettre à jour" : "Ajouter le client"}
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
            <div className="confirm-title">Supprimer ce client ?</div>
            <div className="confirm-msg">
              <strong style={{ color: "var(--text)" }}>{confirmDelete.nom_rp}</strong> sera définitivement supprimé.
              Cette action est irréversible.
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
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✅" : "❌"} {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
