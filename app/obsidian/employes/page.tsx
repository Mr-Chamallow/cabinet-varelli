"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission, DEFAULT_PERMISSIONS, getMemberColor } from "@/lib/auth";

interface Employe {
  id: string; nom: string; role: string; telephone: string; discord: string;
  email: string; notes: string; actif: boolean; created_at: string;
}

const EMPTY = { nom: "", role: "", telephone: "", discord: "", email: "", notes: "", actif: true };
const ROLES_LOGISTIQUE = Object.keys(DEFAULT_PERMISSIONS).filter(r =>
  DEFAULT_PERMISSIONS[r].some(p => p.startsWith("obsidian_") || p === "cahier_vente" || p === "h47")
);

export default function EmployesObsidianPage() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_employes"))) { window.location.href = "/"; } }, [user, userLoading]);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [showInactifs, setShowInactifs] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("obsidian_employes").select("*").order("nom");
    setEmployes(data || []);
    setLoading(false);
  }

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function openNew() { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); }
  function openEdit(e: Employe) {
    setForm({ nom: e.nom, role: e.role || "", telephone: e.telephone || "", discord: e.discord || "", email: e.email || "", notes: e.notes || "", actif: e.actif !== false });
    setEditId(e.id); setShowForm(true);
  }

  async function save() {
    if (!supabase || !user || !form.nom.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from("obsidian_employes").update(form).eq("id", editId);
      showT("Fiche mise à jour");
    } else {
      await supabase.from("obsidian_employes").insert([{ ...form, created_by: user.nom, created_by_id: user.id }]);
      showT("Employé ajouté");
    }
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    if (!supabase) return;
    await supabase.from("obsidian_employes").delete().eq("id", id);
    setConfirm(null);
    showT("Fiche supprimée");
    load();
  }

  const visibles = employes.filter(e => showInactifs ? true : e.actif !== false);

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Obsidian Logistics</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employés</h1>
          <p className="page-subtitle">Annuaire Obsidian Logistics · {visibles.length} membre{visibles.length !== 1 ? "s" : ""}</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={openNew}>+ Ajouter un employé</button>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <button className="btn btn-outline btn-sm" onClick={() => setShowInactifs(!showInactifs)}>
          {showInactifs ? "Masquer les inactifs" : "Afficher aussi les inactifs"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-icon">🧑‍💼</div><div className="empty-title">Chargement…</div></div>
      ) : visibles.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🧑‍💼</div><div className="empty-title">Aucun employé enregistré</div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
          {visibles.map(e => {
            const couleur = getMemberColor(e.role);
            return (
              <div key={e.id} className="card" style={{ opacity: e.actif === false ? 0.55 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: couleur + "20", border: `2px solid ${couleur}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: couleur }}>
                    {e.nom.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom}</div>
                    {e.role && <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 999, background: couleur + "18", color: couleur, border: `1px solid ${couleur}30`, fontWeight: 600 }}>{e.role}</span>}
                  </div>
                  {e.actif === false && <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Inactif</span>}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.75rem" }}>
                  {e.telephone && <span>📞 {e.telephone}</span>}
                  {e.discord && <span>💬 {e.discord}</span>}
                  {e.email && <span>✉️ {e.email}</span>}
                  {!e.telephone && !e.discord && !e.email && <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Aucun contact renseigné</span>}
                </div>
                {e.notes && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.75rem", fontStyle: "italic" }}>{e.notes}</div>}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(e)}>✏️ Modifier</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setConfirm(e.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editId ? "Modifier l'employé" : "Nouvel employé"}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="form-group">
                <label>Rôle</label>
                <input list="roles-list" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Agent logistique" />
                <datalist id="roles-list">{ROLES_LOGISTIQUE.map(r => <option key={r} value={r} />)}</datalist>
              </div>
              <div className="form-grid">
                <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
                <div className="form-group"><label>Discord</label><input value={form.discord} onChange={e => setForm(f => ({ ...f, discord: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: "0.82rem" }}>Actif</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.nom.trim()}>{saving ? "…" : editId ? "Mettre à jour" : "Ajouter"}</button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="confirm-overlay"><div className="confirm-box">
          <div className="confirm-icon">⚠️</div><div className="confirm-title">Supprimer cette fiche ?</div>
          <div className="confirm-actions"><button className="btn btn-outline" onClick={() => setConfirm(null)}>Annuler</button><button className="btn btn-danger" onClick={() => remove(confirm)}>Supprimer</button></div>
        </div></div>
      )}

      {toast && <div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
