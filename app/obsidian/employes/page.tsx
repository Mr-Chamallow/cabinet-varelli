"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoAction } from "@/lib/useUndoAction";
import { hasPermission, DEFAULT_PERMISSIONS, getMemberColor } from "@/lib/auth";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { EmployeeCard, EmployeeCardModalBody } from "@/components/EmployeeCard";

interface Employe {
  id: string; nom: string; role: string; telephone: string; discord: string;
  email: string; notes: string; actif: boolean; created_at: string; photo_url?: string | null;
}

const EMPTY = { nom: "", role: "", telephone: "", discord: "", email: "", notes: "", actif: true };
const ROLES_LOGISTIQUE = Object.keys(DEFAULT_PERMISSIONS).filter(r =>
  DEFAULT_PERMISSIONS[r].some(p => p.startsWith("obsidian_") || p === "cahier_vente" || p === "h47")
);

export default function EmployesObsidianPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_employes"))) { window.location.href = "/"; } }, [user, userLoading]);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const { pending: pendingUndo, scheduleDelete, undo: undoDelete } = useUndoAction();
  const [showInactifs, setShowInactifs] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const cardEmp = employes.find(x => x.id === cardId) || null;
  async function savePhoto(url: string | null) {
    if (!cardEmp) return;
    const r = await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cardEmp.id, photo_url: url }) });
    if (!r.ok) { const d = await r.json(); alert("❌ " + d.error); return; }
    setEmployes(l => l.map(x => x.id === cardEmp.id ? { ...x, photo_url: url } : x));
    showToast(url ? "Photo enregistrée" : "Photo retirée");
  }

  const isPatron = ["CEO - Directeur général","Associé / Patron"].includes((user as any)?.role);
  useEffect(() => { load(); }, []);
  useRealtimeTable("obsidian_employes", load);
  // Importe automatiquement les membres du site (rôles internes) qui ne sont pas encore employés.
  useEffect(() => {
    if (!user || !hasPermission(user, "obsidian_employes")) return;
    fetch("/api/obsidian/employes/sync", { method: "POST" }).then(r => r.json()).then(d => { if (d?.crees || d?.lies) load(); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("obsidian_employes").select("*").order("nom");
    setEmployes(data || []);
    setLoading(false);
  }


  function openNew() { setForm({ ...EMPTY }); setEditId(null); setShowForm(true); }
  function openEdit(e: Employe) {
    setForm({ nom: e.nom, role: e.role || "", telephone: e.telephone || "", discord: e.discord || "", email: e.email || "", notes: e.notes || "", actif: e.actif !== false });
    setEditId(e.id); setShowForm(true);
  }

  async function save() {
    if (!user || !form.nom.trim()) return;
    setSaving(true);
    const res = editId
      ? await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editId, ...form }) })
      : await fetch("/api/obsidian/employes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, created_by: user.nom, created_by_id: user.id }) });
    if (!res.ok) { const data = await res.json(); alert("❌ "+data.error); setSaving(false); return; }
    showToast(editId ? "Fiche mise à jour" : "Employé ajouté");
    setShowForm(false);
    setSaving(false);
    load();
  }

  // ⚠️ La vraie suppression (appel API) se fait IMMÉDIATEMENT, pas après le délai
  // du toast "Annuler" : un refresh pendant les 5s du toast tuerait le setTimeout
  // avant son exécution, donc l'employé ne serait jamais réellement supprimé côté
  // serveur et réapparaîtrait au rechargement. Le toast ne sert plus qu'à proposer
  // de RECRÉER l'employé (nouvel id) si on clique "Annuler" à temps.
  async function remove(id: string) {
    const emp = employes.find((e) => e.id === id);
    if (!emp) return;
    setEmployes((list) => list.filter((e) => e.id !== id));

    const res = await fetch("/api/obsidian/employes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) {
      const data = await res.json(); alert("❌ "+data.error);
      setEmployes((list) => [...list, emp]);
      return;
    }

    scheduleDelete(`"${emp.nom}" supprimé`, async () => {}, async () => {
      const { id: _id, created_at: _ca, ...rest } = emp;
      const r = await fetch("/api/obsidian/employes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
      if (r.ok) { const recreated = await r.json(); setEmployes((list) => [...list, recreated]); }
    });
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.875rem" }}>
          {visibles.map(e => {
            const couleur = getMemberColor(e.role);
            return (
              <div key={e.id} className="card" style={{ opacity: e.actif === false ? 0.55 : 1 }}>
                <div style={{ marginBottom: "0.9rem" }}><EmployeeCard e={e} onZoom={() => setCardId(e.id)} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: couleur + "20", border: `2px solid ${couleur}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 700, color: couleur }}>
                    {e.photo_url ? <img src={e.photo_url} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : e.nom.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom}</div>
                    {e.role && <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 999, background: couleur + "18", color: couleur, border: `1px solid ${couleur}30`, fontWeight: 600 }}>{e.role}</span>}
                  </div>
                  {e.actif === false && <span style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>Inactif</span>}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.75rem" }}>
                  {e.telephone && <span>📞 {e.telephone}</span>}
                  {e.email && <span>✉️ {e.email}</span>}
                  {!e.telephone && !e.email && <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>Aucun contact renseigné</span>}
                </div>
                {e.notes && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.75rem", fontStyle: "italic" }}>{e.notes}</div>}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-outline btn-sm" title="Changer la photo" onClick={() => setCardId(e.id)}>📷 Photo</button>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openEdit(e)}>✏️ Modifier</button>
                  {isPatron && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} title="Supprimer (Patron)" onClick={() => window.confirm(`Supprimer ${e.nom} ?`) && remove(e.id)}>🗑️</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={<>{editId ? "Modifier l'employé" : "Nouvel employé"}</>} onClose={() => setShowForm(false)} footer={<>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.nom.trim()}>{saving ? "…" : editId ? "Mettre à jour" : "Ajouter"}</button></>}>
              <div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} disabled={!!editId && !isPatron} title={!!editId && !isPatron ? "Seul le Patron peut renommer" : ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />{!!editId && !isPatron && <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 4 }}>Seul le Patron peut renommer un employé.</div>}</div>
              <div className="form-group">
                <label>Rôle</label>
                <input list="roles-list" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex: Agent logistique" />
                <datalist id="roles-list">{ROLES_LOGISTIQUE.map(r => <option key={r} value={r} />)}</datalist>
              </div>
              <div className="form-grid">
                <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: "0.82rem" }}>Actif</span>
              </label></Modal>
      )}

      {cardEmp && (
        <Modal size="lg" title="🪪 Carte d'employé" onClose={() => setCardId(null)}>
          <EmployeeCardModalBody e={cardEmp} canEdit onPhoto={savePhoto} />
        </Modal>
      )}

      <UndoToast pending={pendingUndo} onUndo={undoDelete} />

      <Toast toast={toast} />
    </div>
  );
}
