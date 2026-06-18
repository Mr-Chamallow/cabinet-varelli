"use client";

import { useEffect, useState } from "react";
import { getUser, ALL_PERMISSIONS, PERMISSION_LABELS, setRolesCache, type User } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Membre {
  id: string;
  nom: string;
  role: string;
  password: string;
  couleur: string;
  created_at?: string;
}

interface Role {
  id: string;
  nom: string;
  permissions: string[];
  couleur: string;
}

const COULEURS_PRESET = [
  "#c9a84c","#6366f1","#22c55e","#ef4444","#f97316",
  "#06b6d4","#ec4899","#a855f7","#14b8a6","#f59e0b",
  "#3b82f6","#84cc16","#e11d48","#0ea5e9","#d97706",
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"membres"|"roles">("membres");

  // Membre form
  const [showCreateMembre, setShowCreateMembre] = useState(false);
  const [membreForm, setMembreForm] = useState({ nom:"", role:"", password:"", couleur:"#c9a84c" });
  const [creatingMembre, setCreatingMembre] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit membre
  const [editMembreId, setEditMembreId] = useState<string|null>(null);
  const [editMembreRole, setEditMembreRole] = useState("");
  const [editMembrePassword, setEditMembrePassword] = useState("");
  const [editMembreCouleur, setEditMembreCouleur] = useState("#c9a84c");
  const [savingMembre, setSavingMembre] = useState(false);

  // Suppr membre
  const [deleteMembreId, setDeleteMembreId] = useState<string|null>(null);

  // Role form
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ nom:"", permissions:[] as string[], couleur:"#6366f1" });
  const [creatingRole, setCreatingRole] = useState(false);

  // Edit role permissions
  const [editRoleId, setEditRoleId] = useState<string|null>(null);
  const [editRolePerms, setEditRolePerms] = useState<string[]>([]);
  const [editRoleCouleur, setEditRoleCouleur] = useState("#c9a84c");
  const [savingRole, setSavingRole] = useState(false);

  // Suppr role
  const [deleteRoleId, setDeleteRoleId] = useState<string|null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/"); return; }
    // Vérifier la permission admin via les rôles chargés
    setUserState(u);
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!supabase) return;
    setLoading(true);
    const [{ data: m, error: mErr }, { data: r, error: rErr }] = await Promise.all([
      supabase.from("membres").select("*").order("created_at"),
      supabase.from("roles").select("*").order("created_at"),
    ]);
    if (mErr) console.error("Erreur membres:", mErr);
    if (rErr) console.error("Erreur roles:", rErr);
    setMembres(m || []);
    const rolesData = (r || []).map((role: any) => ({
      ...role,
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : (typeof role.permissions === "string" ? JSON.parse(role.permissions || "[]") : []),
    }));
    setRoles(rolesData);
    // Mettre à jour le cache des permissions
    const cache: Record<string, string[]> = {};
    rolesData.forEach((role: Role) => { cache[role.nom] = role.permissions || []; });
    setRolesCache(cache);
    setLoading(false);
  }

  // ─── MEMBRES ───────────────────────────────────────────────────────────────

  async function createMembre() {
    if (!supabase || !membreForm.nom.trim() || !membreForm.password.trim() || !membreForm.role) return;
    setCreatingMembre(true);
    setCreateError("");
    const { error } = await supabase.from("membres").insert([{
      nom: membreForm.nom.trim(), role: membreForm.role,
      password: membreForm.password, couleur: membreForm.couleur,
    }]);
    if (error) { setCreateError(error.message); }
    else { setShowCreateMembre(false); setMembreForm({ nom:"", role:"", password:"", couleur:"#c9a84c" }); fetchAll(); }
    setCreatingMembre(false);
  }

  async function saveMembre(id: string) {
    if (!supabase) return;
    setSavingMembre(true);
    const updates: Partial<Membre> = { role: editMembreRole, couleur: editMembreCouleur };
    if (editMembrePassword.trim()) updates.password = editMembrePassword;
    await supabase.from("membres").update(updates).eq("id", id);
    setEditMembreId(null); setEditMembrePassword(""); fetchAll();
    setSavingMembre(false);
  }

  async function deleteMembre(id: string) {
    if (!supabase) return;
    await supabase.from("membres").delete().eq("id", id);
    setDeleteMembreId(null); fetchAll();
  }

  // ─── RÔLES ─────────────────────────────────────────────────────────────────

  async function createRole() {
    if (!supabase || !roleForm.nom.trim()) return;
    setCreatingRole(true);
    await supabase.from("roles").insert([{ nom: roleForm.nom.trim(), permissions: roleForm.permissions, couleur: roleForm.couleur }]);
    setShowCreateRole(false);
    setRoleForm({ nom:"", permissions:[], couleur:"#6366f1" });
    fetchAll();
    setCreatingRole(false);
  }

  async function saveRole(id: string) {
    if (!supabase) return;
    setSavingRole(true);
    await supabase.from("roles").update({ permissions: editRolePerms, couleur: editRoleCouleur }).eq("id", id);
    setEditRoleId(null); fetchAll();
    setSavingRole(false);
  }

  async function deleteRole(id: string) {
    if (!supabase) return;
    await supabase.from("roles").delete().eq("id", id);
    setDeleteRoleId(null); fetchAll();
  }

  function togglePerm(perms: string[], perm: string): string[] {
    return perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
  }

  if (!user) return null;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Membres · Rôles · Permissions</p>
          <div className="gold-line" />
        </div>
        <span className="badge badge-danger" style={{ padding:"0.4rem 1rem" }}>🛡️ Patron uniquement</span>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {[["membres","👥 Membres"],["roles","🎭 Rôles & Permissions"]].map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem",
            fontWeight:activeTab===k?700:400,
            background:activeTab===k?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${activeTab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,
            color:activeTab===k?"var(--gold)":"var(--text-muted)",
            transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color:"var(--text-dim)" }}>Chargement…</div>
      ) : activeTab === "membres" ? (
        /* ─── ONGLET MEMBRES ─── */
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div className="section-title">Membres ({membres.length})</div>
            <button className="btn btn-gold btn-sm" onClick={() => { setMembreForm({ nom:"", role:roles[0]?.nom||"", password:"", couleur:"#c9a84c" }); setCreateError(""); setShowCreateMembre(true); }}>
              + Nouveau membre
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            {membres.map(m => {
              const roleData = roles.find(r => r.nom === m.role);
              const couleur = m.couleur || roleData?.couleur || "#c9a84c";
              const isEditing = editMembreId === m.id;
              return (
                <div key={m.id} className="card" style={{ border:`1px solid ${isEditing?couleur+"40":"var(--border)"}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
                    {/* Avatar avec couleur personnalisée */}
                    <div style={{
                      width:44,height:44,borderRadius:"50%",flexShrink:0,
                      background:couleur+"20",border:`2px solid ${couleur}40`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.1rem",color:couleur,
                    }}>{m.nom.charAt(0).toUpperCase()}</div>

                    <div style={{ flex:1, minWidth:120 }}>
                      <div style={{ fontWeight:600, marginBottom:"0.2rem" }}>{m.nom}</div>
                      {!isEditing ? (
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <span style={{ fontSize:"0.75rem",padding:"0.15rem 0.55rem",borderRadius:999,
                            background:couleur+"18",color:couleur,border:`1px solid ${couleur}30`,fontWeight:600 }}>
                            {m.role}
                          </span>
                          <div style={{ width:12,height:12,borderRadius:"50%",background:couleur,border:"1px solid rgba(255,255,255,0.1)" }}/>
                        </div>
                      ) : (
                        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                          {roles.map(r => (
                            <button key={r.nom} onClick={() => setEditMembreRole(r.nom)} style={{
                              padding:"0.2rem 0.65rem",borderRadius:999,cursor:"pointer",
                              fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",
                              fontWeight:editMembreRole===r.nom?700:400,
                              background:editMembreRole===r.nom?r.couleur+"20":"var(--surface)",
                              border:`1px solid ${editMembreRole===r.nom?r.couleur+"60":"var(--border)"}`,
                              color:editMembreRole===r.nom?r.couleur:"var(--text-muted)",
                              transition:"all 0.1s",
                            }}>{r.nom}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Couleur picker en mode édition */}
                    {isEditing && (
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                        <div style={{ fontSize:"0.7rem", color:"var(--text-dim)" }}>Couleur</div>
                        <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", maxWidth:180 }}>
                          {COULEURS_PRESET.map(c => (
                            <button key={c} onClick={() => setEditMembreCouleur(c)} style={{
                              width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",
                              border:`2px solid ${editMembreCouleur===c?"white":"transparent"}`,
                              outline:`1px solid ${editMembreCouleur===c?c:"transparent"}`,
                              padding:0,flexShrink:0,transition:"all 0.1s",
                            }}/>
                          ))}
                          <input type="color" value={editMembreCouleur}
                            onChange={e=>setEditMembreCouleur(e.target.value)}
                            style={{ width:20,height:20,padding:0,border:"none",borderRadius:"50%",cursor:"pointer",background:"none" }}/>
                        </div>
                      </div>
                    )}

                    {isEditing && (
                      <input type="password" placeholder="Nouveau mot de passe (optionnel)"
                        value={editMembrePassword} onChange={e=>setEditMembrePassword(e.target.value)}
                        style={{ width:220, fontSize:"0.85rem" }}/>
                    )}

                    <div style={{ display:"flex", gap:"0.5rem", flexShrink:0 }}>
                      {!isEditing ? (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setEditMembreId(m.id); setEditMembreRole(m.role);
                            setEditMembrePassword(""); setEditMembreCouleur(m.couleur||"#c9a84c");
                          }}>✏️ Modifier</button>
                          <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}}
                            onClick={()=>setDeleteMembreId(m.id)}>🗑️</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-gold btn-sm" onClick={()=>saveMembre(m.id)} disabled={savingMembre}>
                            {savingMembre?"…":"✓ Sauvegarder"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{setEditMembreId(null);setEditMembrePassword("");}}>Annuler</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── ONGLET RÔLES ─── */
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div className="section-title">Rôles ({roles.length})</div>
            <button className="btn btn-gold btn-sm" onClick={() => { setRoleForm({ nom:"", permissions:[], couleur:"#6366f1" }); setShowCreateRole(true); }}>
              + Nouveau rôle
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {roles.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎭</div>
                <div className="empty-title">Aucun rôle trouvé</div>
                <p style={{ fontSize:"0.875rem", marginTop:"0.5rem" }}>
                  Vérifiez que la table <code>roles</code> existe dans Supabase et contient des données, ou créez un rôle ci-dessus.
                </p>
              </div>
            )}
            {roles.map(r => {
              const isEditing = editRoleId === r.id;
              const currentPerms = isEditing ? editRolePerms : r.permissions;
              const currentCouleur = isEditing ? editRoleCouleur : r.couleur;
              return (
                <div key={r.id} className="card" style={{ border:`1px solid ${isEditing?currentCouleur+"40":"var(--border)"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{ width:12,height:12,borderRadius:"50%",background:currentCouleur,flexShrink:0 }}/>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.05rem", color:currentCouleur }}>
                        {r.nom}
                      </div>
                      <span style={{ fontSize:"0.72rem",color:"var(--text-dim)" }}>
                        {currentPerms.length}/{ALL_PERMISSIONS.length} permissions
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                      {!isEditing ? (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => {
                            setEditRoleId(r.id); setEditRolePerms([...r.permissions]); setEditRoleCouleur(r.couleur);
                          }}>✏️ Modifier</button>
                          <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}}
                            onClick={()=>setDeleteRoleId(r.id)}>🗑️</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-gold btn-sm" onClick={()=>saveRole(r.id)} disabled={savingRole}>
                            {savingRole?"…":"✓ Sauvegarder"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>setEditRoleId(null)}>Annuler</button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Couleur en mode édition */}
                  {isEditing && (
                    <div style={{ marginBottom:"0.875rem" }}>
                      <div style={{ fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.35rem" }}>Couleur du rôle</div>
                      <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", alignItems:"center" }}>
                        {COULEURS_PRESET.map(c => (
                          <button key={c} onClick={() => setEditRoleCouleur(c)} style={{
                            width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",padding:0,
                            border:`2px solid ${editRoleCouleur===c?"white":"transparent"}`,
                            outline:`1px solid ${editRoleCouleur===c?c:"transparent"}`,
                            transition:"all 0.1s",flexShrink:0,
                          }}/>
                        ))}
                        <input type="color" value={editRoleCouleur} onChange={e=>setEditRoleCouleur(e.target.value)}
                          style={{ width:22,height:22,padding:0,border:"none",borderRadius:"50%",cursor:"pointer" }}/>
                      </div>
                    </div>
                  )}

                  {/* Permissions grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.375rem" }}>
                    {ALL_PERMISSIONS.map(p => {
                      const has = currentPerms.includes(p);
                      return (
                        <button key={p} onClick={() => isEditing && setEditRolePerms(prev => togglePerm(prev, p))}
                          disabled={!isEditing}
                          style={{
                            display:"flex",alignItems:"center",gap:"0.4rem",
                            padding:"0.35rem 0.625rem",borderRadius:8,
                            background:has?currentCouleur+"15":"var(--surface)",
                            border:`1px solid ${has?currentCouleur+"35":"var(--border)"}`,
                            cursor:isEditing?"pointer":"default",
                            fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",
                            color:has?currentCouleur:"var(--text-dim)",
                            fontWeight:has?600:400,
                            transition:"all 0.12s",
                            opacity:!isEditing&&!has?0.4:1,
                          }}>
                          <span style={{ fontSize:"0.6rem" }}>{has?"✓":"○"}</span>
                          {PERMISSION_LABELS[p]||p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal création membre */}
      {showCreateMembre && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreateMembre(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouveau membre</h2>
              <button className="modal-close" onClick={()=>setShowCreateMembre(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom RP *</label>
                <input placeholder="Ex : Marco Varelli" value={membreForm.nom}
                  onChange={e=>setMembreForm(f=>({...f,nom:e.target.value}))} autoFocus/>
              </div>
              <div className="form-group">
                <label>Rôle *</label>
                <select value={membreForm.role} onChange={e=>setMembreForm(f=>({...f,role:e.target.value}))}>
                  <option value="">Choisir un rôle…</option>
                  {roles.map(r=><option key={r.nom} value={r.nom}>{r.nom}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Mot de passe *</label>
                <input type="password" placeholder="Mot de passe de connexion"
                  value={membreForm.password} onChange={e=>setMembreForm(f=>({...f,password:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label>Couleur agenda</label>
                <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", alignItems:"center" }}>
                  {COULEURS_PRESET.map(c=>(
                    <button key={c} onClick={()=>setMembreForm(f=>({...f,couleur:c}))} style={{
                      width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",padding:0,
                      border:`2px solid ${membreForm.couleur===c?"white":"transparent"}`,
                      outline:`1px solid ${membreForm.couleur===c?c:"transparent"}`,
                      flexShrink:0,transition:"all 0.1s",
                    }}/>
                  ))}
                  <input type="color" value={membreForm.couleur}
                    onChange={e=>setMembreForm(f=>({...f,couleur:e.target.value}))}
                    style={{ width:24,height:24,padding:0,border:"none",borderRadius:"50%",cursor:"pointer" }}/>
                </div>
              </div>
              {createError&&<div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"var(--radius)",padding:"0.75rem",fontSize:"0.84rem",color:"var(--danger)" }}>⚠️ {createError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowCreateMembre(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={createMembre}
                disabled={creatingMembre||!membreForm.nom.trim()||!membreForm.password.trim()||!membreForm.role}>
                {creatingMembre?"Création…":"Créer le membre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création rôle */}
      {showCreateRole && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreateRole(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Nouveau rôle</h2>
              <button className="modal-close" onClick={()=>setShowCreateRole(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nom du rôle *</label>
                  <input placeholder="Ex : Stagiaire" value={roleForm.nom}
                    onChange={e=>setRoleForm(f=>({...f,nom:e.target.value}))} autoFocus/>
                </div>
                <div className="form-group">
                  <label>Couleur</label>
                  <div style={{ display:"flex",gap:"0.3rem",flexWrap:"wrap",alignItems:"center",paddingTop:"0.4rem" }}>
                    {COULEURS_PRESET.map(c=>(
                      <button key={c} onClick={()=>setRoleForm(f=>({...f,couleur:c}))} style={{
                        width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",padding:0,
                        border:`2px solid ${roleForm.couleur===c?"white":"transparent"}`,
                        outline:`1px solid ${roleForm.couleur===c?c:"transparent"}`,
                        flexShrink:0,transition:"all 0.1s",
                      }}/>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.375rem" }}>
                  {ALL_PERMISSIONS.map(p=>{
                    const has=roleForm.permissions.includes(p);
                    return(
                      <button key={p} onClick={()=>setRoleForm(f=>({...f,permissions:togglePerm(f.permissions,p)}))} style={{
                        display:"flex",alignItems:"center",gap:"0.4rem",
                        padding:"0.35rem 0.625rem",borderRadius:8,
                        background:has?roleForm.couleur+"15":"var(--surface)",
                        border:`1px solid ${has?roleForm.couleur+"35":"var(--border)"}`,
                        cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",
                        color:has?roleForm.couleur:"var(--text-dim)",fontWeight:has?600:400,
                        transition:"all 0.12s",
                      }}>
                        <span style={{fontSize:"0.6rem"}}>{has?"✓":"○"}</span>
                        {PERMISSION_LABELS[p]||p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowCreateRole(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={createRole}
                disabled={creatingRole||!roleForm.nom.trim()}>
                {creatingRole?"Création…":"Créer le rôle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete membre */}
      {deleteMembreId&&(
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer ce membre ?</div>
            <div className="confirm-msg">Il ne pourra plus se connecter.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={()=>setDeleteMembreId(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>deleteMembre(deleteMembreId)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete rôle */}
      {deleteRoleId&&(
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer ce rôle ?</div>
            <div className="confirm-msg">Les membres avec ce rôle perdront leurs accès.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={()=>setDeleteRoleId(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>deleteRole(deleteRoleId)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
