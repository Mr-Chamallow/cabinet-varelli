"use client";

import { useEffect, useState } from "react";
import { getUser, PERMISSIONS, ROLE_BADGES, ROLE_COLORS, ALL_PERMISSIONS, type User, type Role } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Membre {
  id: string;
  nom: string;
  role: Role;
  password: string;
  created_at?: string;
}

const ROLES: Role[] = ["Patron", "Avocat", "Employé"];

const EMPTY_FORM = { nom: "", role: "Avocat" as Role, password: "" };

export default function AdminPage() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);

  // Création
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Édition rôle
  const [editId, setEditId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("Avocat");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Suppr
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "Patron") { router.replace("/"); return; }
    setUserState(u);
    fetchMembres();
  }, []);

  async function fetchMembres() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("membres").select("*").order("created_at");
    setMembres(data || []);
    setLoading(false);
  }

  async function createMembre() {
    if (!supabase || !form.nom.trim() || !form.password.trim()) return;
    setCreating(true);
    setCreateError("");

    const { error } = await supabase.from("membres").insert([{
      nom: form.nom.trim(),
      role: form.role,
      password: form.password,
    }]);

    if (error) {
      setCreateError("Erreur : " + error.message);
    } else {
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchMembres();
    }
    setCreating(false);
  }

  async function saveEdit(id: string) {
    if (!supabase) return;
    setSaving(true);
    const updates: Partial<Membre> = { role: editRole };
    if (editPassword.trim()) updates.password = editPassword.trim();
    await supabase.from("membres").update(updates).eq("id", id);
    setEditId(null);
    setEditPassword("");
    fetchMembres();
    setSaving(false);
  }

  async function deleteMembre(id: string) {
    if (!supabase) return;
    await supabase.from("membres").delete().eq("id", id);
    setDeleteId(null);
    fetchMembres();
  }

  if (!user) return null;

  const roleColor = (r: Role) => ROLE_COLORS[r];

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Gestion des membres · Rôles & Permissions</p>
          <div className="gold-line" />
        </div>
        <span className="badge badge-danger" style={{ padding: "0.4rem 1rem" }}>🛡️ Patron uniquement</span>
      </div>

      {/* Header membres */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 className="section-title">Membres ({membres.length})</h2>
        <button className="btn btn-gold btn-sm" onClick={() => { setShowCreate(true); setCreateError(""); setForm(EMPTY_FORM); }}>
          + Nouveau membre
        </button>
      </div>

      {/* Liste membres */}
      {loading ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>Chargement…</div>
      ) : membres.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "2.5rem" }}>
          Aucun membre. Créez le premier compte ci-dessus.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {membres.map(m => {
            const isEditing = editId === m.id;
            return (
              <div key={m.id} className="card" style={{ border: isEditing ? `1px solid ${roleColor(m.role)}40` : "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                    background: "var(--gold-muted)",
                    border: `2px solid ${roleColor(isEditing ? editRole : m.role)}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem",
                    color: roleColor(isEditing ? editRole : m.role),
                  }}>
                    {m.nom.charAt(0).toUpperCase()}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{m.nom}</div>
                    {!isEditing ? (
                      <span className={`badge ${ROLE_BADGES[m.role]}`}>{m.role}</span>
                    ) : (
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {ROLES.map(r => (
                          <button
                            key={r}
                            onClick={() => setEditRole(r)}
                            style={{
                              padding: "0.2rem 0.7rem", borderRadius: 999, cursor: "pointer",
                              fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: editRole === r ? 700 : 400,
                              background: editRole === r ? roleColor(r) + "20" : "var(--surface)",
                              border: `1px solid ${editRole === r ? roleColor(r) + "60" : "var(--border)"}`,
                              color: editRole === r ? roleColor(r) : "var(--text-muted)",
                              transition: "all 0.1s",
                            }}
                          >{r}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Champ nouveau mdp si édition */}
                  {isEditing && (
                    <input
                      placeholder="Nouveau mot de passe (optionnel)"
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      type="password"
                      style={{ width: 220, fontSize: "0.85rem" }}
                    />
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    {!isEditing ? (
                      <>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => { setEditId(m.id); setEditRole(m.role); setEditPassword(""); }}
                        >✏️ Modifier</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--danger)" }}
                          onClick={() => setDeleteId(m.id)}
                        >🗑️</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-gold btn-sm" onClick={() => saveEdit(m.id)} disabled={saving}>
                          {saving ? "…" : "✓ Sauvegarder"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setEditPassword(""); }}>
                          Annuler
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Permissions du rôle */}
                {!isEditing && (
                  <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
                      Permissions ({PERMISSIONS[m.role].length}/{ALL_PERMISSIONS.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {ALL_PERMISSIONS.map(p => {
                        const has = PERMISSIONS[m.role].includes(p);
                        return (
                          <span key={p} style={{
                            fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 999,
                            background: has ? roleColor(m.role) + "15" : "var(--surface)",
                            border: `1px solid ${has ? roleColor(m.role) + "30" : "var(--border)"}`,
                            color: has ? roleColor(m.role) : "var(--text-dim)",
                            opacity: has ? 1 : 0.4,
                          }}>{p}</span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tableau permissions */}
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>Matrice des permissions</h2>
      <div className="table-container" style={{ marginBottom: "2.5rem" }}>
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              {ROLES.map(r => <th key={r} style={{ textAlign: "center", color: roleColor(r) }}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map(p => (
              <tr key={p}>
                <td style={{ fontSize: "0.82rem" }}>{p}</td>
                {ROLES.map(r => (
                  <td key={r} style={{ textAlign: "center" }}>
                    {PERMISSIONS[r].includes(p)
                      ? <span style={{ color: roleColor(r), fontSize: "1rem" }}>✓</span>
                      : <span style={{ color: "var(--text-dim)", opacity: 0.3 }}>—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouveau membre</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>Nom RP *</label>
                  <input placeholder="Ex : Marco Varelli" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label>Rôle *</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        style={{
                          flex: 1, padding: "0.5rem", borderRadius: 8, cursor: "pointer",
                          fontFamily: "'Inter', sans-serif", fontSize: "0.82rem",
                          fontWeight: form.role === r ? 700 : 400,
                          background: form.role === r ? roleColor(r) + "18" : "var(--surface)",
                          border: `1px solid ${form.role === r ? roleColor(r) + "50" : "var(--border)"}`,
                          color: form.role === r ? roleColor(r) : "var(--text-muted)",
                          transition: "all 0.12s",
                        }}
                      >{r}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Mot de passe *</label>
                  <input type="password" placeholder="Mot de passe de connexion" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {createError && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "0.75rem", fontSize: "0.84rem", color: "var(--danger)" }}>
                    ⚠️ {createError}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={createMembre}
                disabled={creating || !form.nom.trim() || !form.password.trim()}
              >{creating ? "Création…" : "Créer le membre"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: "var(--danger)" }}>⚠️ Supprimer ce membre ?</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Cette action est irréversible. Le membre ne pourra plus se connecter.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => deleteMembre(deleteId)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
