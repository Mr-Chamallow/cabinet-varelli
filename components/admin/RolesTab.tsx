"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PERMISSIONS, PERMISSION_LABELS, loadRolesFromSupabase } from "@/lib/auth";
import { PERMISSION_GUIDE } from "@/lib/permissionsInfo";
import { setPreviewRole } from "@/lib/previewRole";
import { apiRequest } from "@/lib/apiRequest";
import { Modal } from "@/components/ui/Modal";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoAction } from "@/lib/useUndoAction";

interface Role {
  id: string;
  nom: string;
  permissions: string[];
  couleur: string;
  ordre?: number | null;
  groupe?: string | null;
}

const ORDRE_DEFAUT = ["Associé / Patron","CEO - Directeur général","COO - Directrice opérationnel","Responsable juridique","Agent juridique","Avocat","Responsable logistique","Agent logistique","Responsable sécurité","Agent de sécurité","Opérateur","Opérateur stagiaire","Légal Service"];
function rang(r: Role) { return r.ordre ?? (ORDRE_DEFAUT.indexOf(r.nom) >= 0 ? ORDRE_DEFAUT.indexOf(r.nom) + 1 : 999); }

export const COULEURS_PRESET = [
  "#a48fff","#c9a84c","#6366f1","#22c55e","#ef4444","#f97316",
  "#06b6d4","#ec4899","#a855f7","#14b8a6","#f59e0b",
  "#3b82f6","#84cc16","#e11d48","#0ea5e9","#d97706",
];

// ─── Niveau d'accès par permission : aucun → lecture → écriture → aucun ───
// Stocké comme "perm" (écriture, rétro-compat) ou "perm:read" (lecture seule).
type PermLvl = "none" | "read" | "write";
export function getPermLvl(perms: string[], perm: string): PermLvl {
  if (perms.includes(perm)) return "write";
  if (perms.includes(perm + ":read")) return "read";
  return "none";
}
function cyclePermLvl(perms: string[], perm: string): string[] {
  const current = getPermLvl(perms, perm);
  const stripped = perms.filter(p => p !== perm && p !== perm + ":read");
  if (current === "none") return [...stripped, perm + ":read"];
  if (current === "read") return [...stripped, perm];
  return stripped; // write → none
}

const ALL_INFO = PERMISSION_GUIDE.flatMap(g => g.perms);
function permDesc(p: string, lvl: PermLvl) { const i = ALL_INFO.find(x => x.key === p); return i ? (lvl === "read" ? i.read : i.write) : ""; }

export function RolesTab() {
  const router = useRouter();
  const { pending: pendingUndo, scheduleDelete, undo: undoDelete } = useUndoAction();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [showCreateRole, setShowCreateRole] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ nom: "", permissions: [] as string[], couleur: "#6366f1" });

  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [editRolePerms, setEditRolePerms] = useState<string[]>([]);
  const [editRoleCouleur, setEditRoleCouleur] = useState("#c9a84c");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    const r = await loadRolesFromSupabase();
    setRoles(((r || []) as Role[]).slice().sort((a, b) => rang(a) - rang(b) || a.nom.localeCompare(b.nom)));
    setLoading(false);
  }

  async function createRole() {
    if (!roleForm.nom.trim()) return;
    setCreatingRole(true); setFetchError("");
    const r = await apiRequest("/api/admin/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: roleForm.nom.trim(), permissions: roleForm.permissions, couleur: roleForm.couleur }),
    });
    if (!r.ok) { setFetchError(`Impossible de créer le rôle : ${r.error}`); }
    else { await refresh(); setShowCreateRole(false); setRoleForm({ nom: "", permissions: [], couleur: "#6366f1" }); }
    setCreatingRole(false);
  }

  async function saveRole(id: string) {
    setSavingRole(true); setFetchError("");
    const r = await apiRequest("/api/admin/roles", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, permissions: editRolePerms, couleur: editRoleCouleur }),
    });
    if (!r.ok) setFetchError(`Impossible de sauvegarder le rôle : ${r.error}`);
    else setEditRoleId(null);
    await refresh(); setSavingRole(false);
  }

  // ⚠️ La vraie suppression (appel API) se fait IMMÉDIATEMENT, pas après le délai
  // du toast "Annuler" : un refresh pendant les 5s du toast tuerait le setTimeout
  // avant son exécution, donc le rôle ne serait jamais réellement supprimé côté
  // serveur et réapparaîtrait au rechargement. Le toast ne sert plus qu'à proposer
  // de RECRÉER le rôle (nouvel id) si on clique "Annuler" à temps.
  async function deleteRole(id: string) {
    const role = roles.find(r => r.id === id);
    if (!role) return;
    setRoles(list => list.filter(r => r.id !== id));
    setFetchError("");

    const r = await apiRequest("/api/admin/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!r.ok) {
      setFetchError(`Impossible de supprimer le rôle : ${r.error}`);
      setRoles(list => [...list, role]);
      return;
    }

    scheduleDelete(`Rôle "${role.nom}" supprimé`, async () => {}, async () => {
      const created = await apiRequest("/api/admin/roles", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: role.nom, permissions: role.permissions, couleur: role.couleur }),
      });
      await refresh();
      if (!created.ok) setFetchError(`Impossible de restaurer le rôle : ${created.error}`);
    });
  }

  if (loading) return <div style={{ color: "var(--text-dim)" }}>Chargement…</div>;

  return (
    <div>
      {fetchError && <div style={{ color: "var(--danger)", fontSize: "0.8rem", marginBottom: "1rem" }}>{fetchError}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div className="section-title">Rôles ({roles.length})</div>
        <button className="btn btn-gold btn-sm" onClick={() => { setRoleForm({ nom: "", permissions: [], couleur: "#6366f1" }); setShowCreateRole(true); }}>+ Nouveau rôle</button>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
        Ces rôles et permissions contrôlent réellement l'accès aux pages (calculé à chaque connexion Discord). Le nom du rôle doit correspondre exactement au rôle attribué (via Discord ou un override dans l'onglet Membres) pour s'appliquer.
      </p>


      <details className="card" style={{ marginBottom: "1rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>📖 Guide des permissions (ce que donne chaque accès)</summary>
        <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", margin: "0.6rem 0" }}>
          ○ Aucun = page cachée · 👁 Lecture seule = voir sans rien modifier (boutons d'action masqués, API refusée) · ✓ Écriture = tout faire sur la page.
        </div>
        {PERMISSION_GUIDE.map(g => (
          <div key={g.titre} style={{ marginBottom: "0.9rem" }}>
            <div className="section-title" style={{ margin: "0.4rem 0" }}>{g.icon} {g.titre}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse" }}>
                <thead><tr style={{ textAlign: "left", color: "var(--text-dim)" }}><th style={{ padding: "0.25rem 0.5rem" }}>Permission</th><th style={{ padding: "0.25rem 0.5rem" }}>👁 Lecture</th><th style={{ padding: "0.25rem 0.5rem" }}>✓ Écriture</th></tr></thead>
                <tbody>{g.perms.map(x => (
                  <tr key={x.key} style={{ borderTop: "1px solid var(--border)", verticalAlign: "top" }}>
                    <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600, whiteSpace: "nowrap" }}>{PERMISSION_LABELS[x.key] || x.key}</td>
                    <td style={{ padding: "0.35rem 0.5rem" }}>{x.read}</td>
                    <td style={{ padding: "0.35rem 0.5rem" }}>{x.write}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </div>
        ))}
      </details>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {roles.length === 0 && (
          <div className="empty-state"><div className="empty-icon">🎭</div><div className="empty-title">Aucun rôle trouvé</div></div>
        )}
        {roles.map((r, idx) => {
          const grp = r.groupe || "";
          const showGrp = grp && grp !== (roles[idx - 1]?.groupe || "");
          const isEditing = editRoleId === r.id;
          const currentPerms = isEditing ? editRolePerms : (r.permissions || []);
          const currentCouleur = isEditing ? editRoleCouleur : (r.couleur || "#c9a84c");
          return (
            <div key={r.id}>
            {showGrp && <div className="section-title" style={{ margin: "0.5rem 0" }}>{grp}</div>}
            <div className="card" style={{ border: `1px solid ${isEditing ? currentCouleur + "40" : "var(--border)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: currentCouleur, flexShrink: 0 }} />
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.05rem", color: currentCouleur }}>{r.nom}</div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{ALL_PERMISSIONS.filter(p => getPermLvl(currentPerms, p) !== "none").length}/{ALL_PERMISSIONS.length} permissions</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  {!isEditing ? (
                    <>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={`Voir le site en tant que "${r.nom}"`}
                        onClick={() => { setPreviewRole(r.nom); router.push("/"); }}
                      >
                        👁️ Aperçu
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditRoleId(r.id); setEditRolePerms([...(r.permissions || [])]); setEditRoleCouleur(r.couleur || "#c9a84c"); }}>✏️ Modifier</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => deleteRole(r.id)}>🗑️</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-gold btn-sm" onClick={() => saveRole(r.id)} disabled={savingRole}>{savingRole ? "…" : "✓ Sauvegarder"}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditRoleId(null)}>Annuler</button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div style={{ marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.35rem" }}>Couleur du rôle</div>
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center" }}>
                    {COULEURS_PRESET.map(c => (
                      <button key={c} onClick={() => setEditRoleCouleur(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", padding: 0, border: `2px solid ${editRoleCouleur === c ? "white" : "transparent"}`, outline: `1px solid ${editRoleCouleur === c ? c : "transparent"}`, transition: "all 0.1s", flexShrink: 0 }} />
                    ))}
                    <input type="color" value={editRoleCouleur} onChange={e => setEditRoleCouleur(e.target.value)} style={{ width: 22, height: 22, padding: 0, border: "none", borderRadius: "50%", cursor: "pointer" }} />
                  </div>
                </div>
              )}

              {isEditing && (
                <p style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
                  Clique une permission pour faire tourner : ○ Aucun → 👁 Lecture seule → ✓ Écriture
                </p>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "0.375rem" }}>
                {ALL_PERMISSIONS.map(p => {
                  const lvl = getPermLvl(currentPerms, p);
                  const icon = lvl === "write" ? "✓" : lvl === "read" ? "👁" : "○";
                  const color = lvl === "write" ? currentCouleur : lvl === "read" ? "var(--info)" : "var(--text-dim)";
                  return (
                    <button
                      key={p}
                      disabled={!isEditing}
                      onClick={() => isEditing && setEditRolePerms(perms => cyclePermLvl(perms, p))}
                      title={(lvl === "write" ? "Écriture : " : lvl === "read" ? "Lecture seule : " : "Aucun accès. ") + permDesc(p, lvl)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.55rem", borderRadius: 6,
                        background: lvl !== "none" ? color + "15" : "transparent",
                        border: `1px solid ${lvl !== "none" ? color + "30" : "var(--border)"}`,
                        cursor: isEditing ? "pointer" : "default", fontFamily: "'Inter',sans-serif", fontSize: "0.7rem",
                        color: lvl !== "none" ? color : "var(--text-dim)", fontWeight: lvl !== "none" ? 600 : 400,
                        opacity: isEditing ? 1 : 0.85, transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: "0.58rem" }}>{icon}</span>{PERMISSION_LABELS[p] || p}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          );
        })}
      </div>

      {showCreateRole && (
        <Modal title={<>Nouveau rôle</>} onClose={() => setShowCreateRole(false)} size="lg" footer={<>
          <button className="btn btn-outline" onClick={() => setShowCreateRole(false)}>Annuler</button>
          <button className="btn btn-gold" onClick={createRole} disabled={creatingRole || !roleForm.nom.trim()}>{creatingRole ? "Création…" : "Créer le rôle"}</button></>}>
          <div className="form-grid">
            <div className="form-group"><label>Nom du rôle *</label><input placeholder="Ex : Stagiaire" value={roleForm.nom} onChange={e => setRoleForm(f => ({ ...f, nom: e.target.value }))} autoFocus /></div>
            <div className="form-group">
              <label>Couleur</label>
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center", paddingTop: "0.4rem" }}>
                {COULEURS_PRESET.map(c => (<button key={c} onClick={() => setRoleForm(f => ({ ...f, couleur: c }))} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", padding: 0, border: `2px solid ${roleForm.couleur === c ? "white" : "transparent"}`, outline: `1px solid ${roleForm.couleur === c ? c : "transparent"}`, flexShrink: 0, transition: "all 0.1s" }} />))}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Permissions</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "0.375rem" }}>
              {ALL_PERMISSIONS.map(p => {
                const lvl = getPermLvl(roleForm.permissions, p);
                const icon = lvl === "write" ? "✓" : lvl === "read" ? "👁" : "○";
                const color = lvl === "write" ? roleForm.couleur : lvl === "read" ? "var(--info)" : "var(--text-dim)";
                return (<button key={p} onClick={() => setRoleForm(f => ({ ...f, permissions: cyclePermLvl(f.permissions, p) }))} title={lvl === "write" ? "Écriture" : lvl === "read" ? "Lecture seule" : "Aucun accès"} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.625rem", borderRadius: 8, background: lvl !== "none" ? color + "15" : "var(--surface)", border: `1px solid ${lvl !== "none" ? color + "35" : "var(--border)"}`, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: "0.72rem", color: lvl !== "none" ? color : "var(--text-dim)", fontWeight: lvl !== "none" ? 600 : 400, transition: "all 0.12s" }}><span style={{ fontSize: "0.6rem" }}>{icon}</span>{PERMISSION_LABELS[p] || p}</button>);
              })}
            </div>
          </div>
        </Modal>
      )}

      <UndoToast pending={pendingUndo} onUndo={undoDelete} />
    </div>
  );
}
