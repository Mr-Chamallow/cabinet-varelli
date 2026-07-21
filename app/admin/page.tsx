"use client";

import { useEffect, useState } from "react";
import { ALL_PERMISSIONS, PERMISSION_LABELS, DEFAULT_PERMISSIONS, loadRolesFromSupabase, type User } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface RoleOverride {
  discord_id: string;
  nom: string;
  role: string;
  updated_at?: string;
}

interface Role {
  id: string;
  nom: string;
  permissions: string[];
  couleur: string;
}

interface ActivityItem {
  type: "casier" | "dossier" | "facture" | "audience" | "client";
  icon: string;
  color: string;
  label: string;
  detail: string;
  by: string;
  at: string;
}

const COULEURS_PRESET = [
  "#c9a84c","#6366f1","#22c55e","#ef4444","#f97316",
  "#06b6d4","#ec4899","#a855f7","#14b8a6","#f59e0b",
  "#3b82f6","#84cc16","#e11d48","#0ea5e9","#d97706",
];

const ACT_CFG: Record<string, { icon: string; color: string; label: string }> = {
  casier:   { icon: "⚖️", color: "#7c3aed", label: "Casier"   },
  dossier:  { icon: "📁", color: "#c9a84c", label: "Dossier"  },
  facture:  { icon: "🧾", color: "#22c55e", label: "Facture"  },
  audience: { icon: "🏛️", color: "#3b82f6", label: "Audience" },
  client:   { icon: "👤", color: "#f97316", label: "Client"   },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d < 7 ? `Il y a ${d} j` : new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [overrides, setOverrides] = useState<RoleOverride[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"membres"|"roles"|"journaux">("membres");

  // Override form
  const [showCreateOverride, setShowCreateOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ nom:"", discord_id:"", role:"" });
  const [creatingOverride, setCreatingOverride] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteOverrideId, setDeleteOverrideId] = useState<string|null>(null);

  // Role form
  const [showCreateRole, setShowCreateRole]     = useState(false);
  const [roleForm, setRoleForm]                 = useState({ nom:"", permissions:[] as string[], couleur:"#6366f1" });
  const [creatingRole, setCreatingRole]         = useState(false);

  // Edit role
  const [editRoleId, setEditRoleId]             = useState<string|null>(null);
  const [editRolePerms, setEditRolePerms]       = useState<string[]>([]);
  const [editRoleCouleur, setEditRoleCouleur]   = useState("#c9a84c");
  const [savingRole, setSavingRole]             = useState(false);
  const [deleteRoleId, setDeleteRoleId]         = useState<string|null>(null);

  // Journaux
  const [activity, setActivity]                 = useState<ActivityItem[]>([]);
  const [actLoading, setActLoading]             = useState(false);
  const [filterActMember, setFilterActMember]   = useState("");
  const [filterActType, setFilterActType]       = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    if (!supabase) {
      setFetchError("Connexion Supabase non configurée.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError("");
    const [{ data: o, error: oErr }, rolesData] = await Promise.all([
      supabase.from("role_overrides").select("*").order("updated_at", { ascending: false }),
      loadRolesFromSupabase(),
    ]);
    if (oErr) {
      setFetchError(`Erreur lors du chargement des overrides : ${oErr.message}`);
    }
    setOverrides(o || []);
    setRoles(rolesData as Role[]);
    if (rolesData.length === 0 && !oErr) {
      setFetchError("Aucun rôle trouvé. Vérifiez que la table `roles` existe et contient des données.");
    }
    setLoading(false);
  }

  async function loadActivity() {
    if (!supabase) return;
    setActLoading(true);
    const [
      { data: casiers },
      { data: dossiers },
      { data: factures },
      { data: audiences },
      { data: clients },
    ] = await Promise.all([
      supabase.from("casier").select("client_nom,infraction,categorie,created_by,created_at").order("created_at",{ascending:false}).limit(40),
      supabase.from("dossiers").select("reference,client,type_affaire,statut,created_by,created_at").order("created_at",{ascending:false}).limit(40),
      supabase.from("factures").select("numero,client,montant,statut,created_by,created_at").order("created_at",{ascending:false}).limit(40),
      supabase.from("audiences").select("titre,client,type,created_by,created_at").order("created_at",{ascending:false}).limit(40),
      supabase.from("clients").select("nom_rp,type_client,created_by,created_at").order("created_at",{ascending:false}).limit(40),
    ]);
    const items: ActivityItem[] = [
      ...(casiers||[]).map((r:any) => ({ type:"casier" as const, icon:"⚖️", color:"#7c3aed", label:r.client_nom, detail:`${r.infraction} · ${r.categorie}`, by:r.created_by, at:r.created_at })),
      ...(dossiers||[]).map((r:any) => ({ type:"dossier" as const, icon:"📁", color:"#c9a84c", label:r.reference, detail:`${r.client} — ${r.type_affaire} · ${r.statut}`, by:r.created_by, at:r.created_at })),
      ...(factures||[]).map((r:any) => ({ type:"facture" as const, icon:"🧾", color:"#22c55e", label:r.numero||"Facture", detail:`${r.client} — ${(r.montant||0).toLocaleString("fr-FR")} $ · ${r.statut}`, by:r.created_by, at:r.created_at })),
      ...(audiences||[]).map((r:any) => ({ type:"audience" as const, icon:"🏛️", color:"#3b82f6", label:r.titre, detail:`${r.type}${r.client?` · ${r.client}`:""}`, by:r.created_by, at:r.created_at })),
      ...(clients||[]).map((r:any) => ({ type:"client" as const, icon:"👤", color:"#f97316", label:r.nom_rp, detail:`Nouveau client · ${r.type_client||"—"}`, by:r.created_by, at:r.created_at })),
    ].sort((a,b) => b.at.localeCompare(a.at));
    setActivity(items);
    setActLoading(false);
  }

  useEffect(() => { if (activeTab === "journaux" && activity.length === 0) loadActivity(); }, [activeTab]);

  // ─── OVERRIDES DE RÔLE ───────────────────────────────────────────────────────
  async function createOverride() {
    if (!supabase||!overrideForm.discord_id.trim()||!overrideForm.role) return;
    setCreatingOverride(true); setCreateError("");
    const { error } = await supabase.from("role_overrides").upsert([{
      discord_id: overrideForm.discord_id.trim(),
      nom: overrideForm.nom.trim(),
      role: overrideForm.role,
      updated_by: user?.nom,
      updated_at: new Date().toISOString(),
    }]);
    if (error) { setCreateError(error.message); }
    else { setShowCreateOverride(false); setOverrideForm({ nom:"", discord_id:"", role:"" }); fetchAll(); }
    setCreatingOverride(false);
  }

  async function deleteOverride(discordId: string) {
    if (!supabase) return;
    await supabase.from("role_overrides").delete().eq("discord_id", discordId);
    setDeleteOverrideId(null); fetchAll();
  }

  // ─── RÔLES ─────────────────────────────────────────────────────────────────
  async function createRole() {
    if (!supabase||!roleForm.nom.trim()) return;
    setCreatingRole(true);
    const { error } = await supabase.from("roles").insert([{ nom:roleForm.nom.trim(), permissions:roleForm.permissions, couleur:roleForm.couleur }]);
    if (error) setFetchError(`Impossible de créer le rôle : ${error.message}`);
    else { setShowCreateRole(false); setRoleForm({ nom:"", permissions:[], couleur:"#6366f1" }); }
    await fetchAll(); setCreatingRole(false);
  }

  async function saveRole(id: string) {
    if (!supabase) return;
    setSavingRole(true);
    const { error } = await supabase.from("roles").update({ permissions:editRolePerms, couleur:editRoleCouleur }).eq("id", id);
    if (error) setFetchError(`Impossible de sauvegarder le rôle : ${error.message}`);
    else setEditRoleId(null);
    await fetchAll(); setSavingRole(false);
  }

  async function deleteRole(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) setFetchError(`Impossible de supprimer le rôle : ${error.message}`);
    setDeleteRoleId(null); await fetchAll();
  }

  function togglePerm(perms: string[], perm: string): string[] {
    return perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
  }

  const uniqueActMembers = [...new Set(activity.map(a => a.by))].filter(Boolean).sort();
  const filteredActivity = activity.filter(a =>
    (!filterActMember || a.by === filterActMember) &&
    (!filterActType || a.type === filterActType)
  );

  if (userLoading || !user) return null;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Membres · Rôles · Permissions · Journaux</p>
          <div className="gold-line" />
        </div>
        <span className="badge badge-danger" style={{ padding:"0.4rem 1rem" }}>🛡️ Patron uniquement</span>
      </div>

      {fetchError && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"var(--radius)", padding:"0.875rem 1.125rem", marginBottom:"1.25rem", fontSize:"0.85rem", color:"var(--danger)", display:"flex", alignItems:"flex-start", gap:"0.625rem" }}>
          <span style={{ flexShrink:0 }}>⚠️</span><span>{fetchError}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {([["membres","👥 Membres"],["roles","🎭 Rôles & Permissions"],["journaux","📋 Journaux"]] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight:activeTab===k?700:400,
            background:activeTab===k?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${activeTab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,
            color:activeTab===k?"var(--gold)":"var(--text-muted)", transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color:"var(--text-dim)" }}>Chargement…</div>
      ) : activeTab === "membres" ? (
        /* ─── OVERRIDES DE RÔLE ─── */
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div className="section-title">Overrides de rôle ({overrides.length})</div>
            <button className="btn btn-gold btn-sm" onClick={() => { setOverrideForm({ nom:"", discord_id:"", role:"" }); setCreateError(""); setShowCreateOverride(true); }}>
              + Forcer un rôle
            </button>
          </div>

          <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", marginBottom:"1rem" }}>
            Les rôles sont normalement calculés depuis Discord. Un override ici prend le dessus, pour un membre en particulier, jusqu'à suppression.
          </p>

          {overrides.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎭</div><div className="empty-title">Aucun override actif</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              {overrides.map(o => {
                const roleData = roles.find(r => r.nom === o.role);
                const couleur = roleData?.couleur || "#c9a84c";
                return (
                  <div key={o.discord_id} className="card">
                    <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
                      <div style={{ width:44,height:44,borderRadius:"50%",flexShrink:0, background:couleur+"20",border:`2px solid ${couleur}40`, display:"flex",alignItems:"center",justifyContent:"center", fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.1rem",color:couleur }}>
                        {(o.nom || o.discord_id).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:120 }}>
                        <div style={{ fontWeight:600, marginBottom:"0.2rem" }}>{o.nom || "(sans nom)"}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <span style={{ fontSize:"0.75rem",padding:"0.15rem 0.55rem",borderRadius:999, background:couleur+"18",color:couleur,border:`1px solid ${couleur}30`,fontWeight:600 }}>{o.role}</span>
                          <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", fontFamily:"monospace" }}>{o.discord_id}</span>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}} onClick={()=>setDeleteOverrideId(o.discord_id)}>🗑️ Retirer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === "roles" ? (
        /* ─── RÔLES ─── */
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div className="section-title">Rôles ({roles.length})</div>
            <button className="btn btn-gold btn-sm" onClick={() => { setRoleForm({ nom:"", permissions:[], couleur:"#6366f1" }); setShowCreateRole(true); }}>+ Nouveau rôle</button>
          </div>

          <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", marginBottom:"1rem" }}>
            Ces rôles et permissions contrôlent réellement l'accès aux pages (calculé à chaque connexion Discord). Le nom du rôle doit correspondre exactement au rôle attribué (via Discord ou un override dans l'onglet Membres) pour s'appliquer.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {roles.length === 0 && (
              <div className="empty-state"><div className="empty-icon">🎭</div><div className="empty-title">Aucun rôle trouvé</div></div>
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
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.05rem", color:currentCouleur }}>{r.nom}</div>
                      <span style={{ fontSize:"0.72rem",color:"var(--text-dim)" }}>{currentPerms.length}/{ALL_PERMISSIONS.length} permissions</span>
                    </div>
                    <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                      {!isEditing ? (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => { setEditRoleId(r.id); setEditRolePerms([...r.permissions]); setEditRoleCouleur(r.couleur); }}>✏️ Modifier</button>
                          <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}} onClick={()=>setDeleteRoleId(r.id)}>🗑️</button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-gold btn-sm" onClick={()=>saveRole(r.id)} disabled={savingRole}>{savingRole?"…":"✓ Sauvegarder"}</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>setEditRoleId(null)}>Annuler</button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ marginBottom:"0.875rem" }}>
                      <div style={{ fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.35rem" }}>Couleur du rôle</div>
                      <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", alignItems:"center" }}>
                        {COULEURS_PRESET.map(c => (
                          <button key={c} onClick={() => setEditRoleCouleur(c)} style={{ width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",padding:0, border:`2px solid ${editRoleCouleur===c?"white":"transparent"}`, outline:`1px solid ${editRoleCouleur===c?c:"transparent"}`, transition:"all 0.1s",flexShrink:0 }}/>
                        ))}
                        <input type="color" value={editRoleCouleur} onChange={e=>setEditRoleCouleur(e.target.value)} style={{ width:22,height:22,padding:0,border:"none",borderRadius:"50%",cursor:"pointer" }}/>
                      </div>
                    </div>
                  )}

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.375rem" }}>
                    {ALL_PERMISSIONS.map(p => {
                      const has = currentPerms.includes(p);
                      return (
                        <button key={p} onClick={() => isEditing && setEditRolePerms(prev => togglePerm(prev, p))} disabled={!isEditing} style={{ display:"flex",alignItems:"center",gap:"0.4rem", padding:"0.35rem 0.625rem",borderRadius:8, background:has?currentCouleur+"15":"var(--surface)", border:`1px solid ${has?currentCouleur+"35":"var(--border)"}`, cursor:isEditing?"pointer":"default", fontFamily:"'Inter',sans-serif",fontSize:"0.72rem", color:has?currentCouleur:"var(--text-dim)", fontWeight:has?600:400, transition:"all 0.12s", opacity:!isEditing&&!has?0.4:1 }}>
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
      ) : (
        /* ─── JOURNAUX ─── */
        <div>
          {/* Filtres */}
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Membre</span>
              {["", ...uniqueActMembers].map(m => (
                <button key={m||"_all"} onClick={() => setFilterActMember(m)} style={{ padding:"0.25rem 0.65rem", borderRadius:999, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:"0.75rem", fontWeight:filterActMember===m?700:400, background:filterActMember===m?"var(--gold-muted)":"var(--surface)", border:`1px solid ${filterActMember===m?"rgba(201,168,76,0.4)":"var(--border)"}`, color:filterActMember===m?"var(--gold)":"var(--text-muted)" }}>
                  {m||"Tous"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Type</span>
              {["", ...Object.keys(ACT_CFG)].map(t => (
                <button key={t||"_all"} onClick={() => setFilterActType(t)} style={{ padding:"0.25rem 0.65rem", borderRadius:999, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:"0.75rem", fontWeight:filterActType===t?700:400, background:filterActType===t?(t?ACT_CFG[t].color+"18":"var(--gold-muted)"):"var(--surface)", border:`1px solid ${filterActType===t?(t?ACT_CFG[t].color+"40":"rgba(201,168,76,0.4)"):"var(--border)"}`, color:filterActType===t?(t?ACT_CFG[t].color:"var(--gold)"):"var(--text-muted)" }}>
                  {t ? `${ACT_CFG[t].icon} ${ACT_CFG[t].label}` : "Tous"}
                </button>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginLeft:"auto" }} onClick={loadActivity}>↻ Actualiser</button>
          </div>

          {actLoading ? (
            <div style={{ color:"var(--text-dim)" }}>Chargement du journal…</div>
          ) : filteredActivity.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucune entrée</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {filteredActivity.map((item, i) => {
                const cfg = ACT_CFG[item.type];
                return (
                  <div key={i} style={{ display:"flex", gap:"0.875rem", position:"relative", padding:"0.625rem 0", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, background:cfg.color+"18", border:`2px solid ${cfg.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.78rem" }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.1rem" }}>
                        <span style={{ fontSize:"0.62rem", padding:"0.08rem 0.4rem", borderRadius:999, background:cfg.color+"15", color:cfg.color, border:`1px solid ${cfg.color}30`, fontWeight:600 }}>{cfg.label}</span>
                        <span style={{ fontWeight:600, fontSize:"0.84rem", color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:260 }}>{item.label}</span>
                        <span style={{ marginLeft:"auto", fontSize:"0.65rem", color:"var(--text-dim)", flexShrink:0, whiteSpace:"nowrap" }}>{timeAgo(item.at)}</span>
                      </div>
                      <div style={{ fontSize:"0.75rem", color:"var(--text-dim)" }}>{item.detail}</div>
                      <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", marginTop:"0.1rem" }}>par {item.by}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Modals ─── */}
      {showCreateOverride && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreateOverride(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Forcer un rôle</h2>
              <button className="modal-close" onClick={()=>setShowCreateOverride(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Nom (repère visuel)</label><input placeholder="Ex : Marco Varelli" value={overrideForm.nom} onChange={e=>setOverrideForm(f=>({...f,nom:e.target.value}))} autoFocus/></div>
              <div className="form-group">
                <label>ID Discord *</label>
                <input placeholder="Ex : 460865920278069248" value={overrideForm.discord_id} onChange={e=>setOverrideForm(f=>({...f,discord_id:e.target.value}))} style={{ fontFamily:"monospace" }}/>
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.3rem" }}>Mode développeur Discord activé → clic droit sur le pseudo → Copier l'ID</div>
              </div>
              <div className="form-group"><label>Rôle à forcer *</label>
                <select value={overrideForm.role} onChange={e=>setOverrideForm(f=>({...f,role:e.target.value}))}>
                  <option value="">Choisir un rôle…</option>
                  {(roles.length > 0 ? roles.map(r => r.nom) : Object.keys(DEFAULT_PERMISSIONS)).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {createError&&<div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"var(--radius)",padding:"0.75rem",fontSize:"0.84rem",color:"var(--danger)" }}>⚠️ {createError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowCreateOverride(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={createOverride} disabled={creatingOverride||!overrideForm.discord_id.trim()||!overrideForm.role}>{creatingOverride?"Enregistrement…":"Forcer le rôle"}</button>
            </div>
          </div>
        </div>
      )}

      {showCreateRole && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreateRole(false)}>
          <div className="modal modal-lg">
            <div className="modal-header"><h2 className="modal-title">Nouveau rôle</h2><button className="modal-close" onClick={()=>setShowCreateRole(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Nom du rôle *</label><input placeholder="Ex : Stagiaire" value={roleForm.nom} onChange={e=>setRoleForm(f=>({...f,nom:e.target.value}))} autoFocus/></div>
                <div className="form-group">
                  <label>Couleur</label>
                  <div style={{ display:"flex",gap:"0.3rem",flexWrap:"wrap",alignItems:"center",paddingTop:"0.4rem" }}>
                    {COULEURS_PRESET.map(c=>(<button key={c} onClick={()=>setRoleForm(f=>({...f,couleur:c}))} style={{ width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",padding:0, border:`2px solid ${roleForm.couleur===c?"white":"transparent"}`, outline:`1px solid ${roleForm.couleur===c?c:"transparent"}`, flexShrink:0,transition:"all 0.1s" }}/>))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Permissions</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.375rem" }}>
                  {ALL_PERMISSIONS.map(p=>{ const has=roleForm.permissions.includes(p); return(<button key={p} onClick={()=>setRoleForm(f=>({...f,permissions:togglePerm(f.permissions,p)}))} style={{ display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.35rem 0.625rem",borderRadius:8, background:has?roleForm.couleur+"15":"var(--surface)", border:`1px solid ${has?roleForm.couleur+"35":"var(--border)"}`, cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem", color:has?roleForm.couleur:"var(--text-dim)",fontWeight:has?600:400,transition:"all 0.12s" }}><span style={{fontSize:"0.6rem"}}>{has?"✓":"○"}</span>{PERMISSION_LABELS[p]||p}</button>); })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowCreateRole(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={createRole} disabled={creatingRole||!roleForm.nom.trim()}>{creatingRole?"Création…":"Créer le rôle"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteOverrideId&&(<div className="confirm-overlay"><div className="confirm-box"><div className="confirm-icon">⚠️</div><div className="confirm-title">Retirer cet override ?</div><div className="confirm-msg">Le rôle repassera au calcul automatique via Discord.</div><div className="confirm-actions"><button className="btn btn-outline" onClick={()=>setDeleteOverrideId(null)}>Annuler</button><button className="btn btn-danger" onClick={()=>deleteOverride(deleteOverrideId)}>Retirer</button></div></div></div>)}
      {deleteRoleId&&(<div className="confirm-overlay"><div className="confirm-box"><div className="confirm-icon">⚠️</div><div className="confirm-title">Supprimer ce rôle ?</div><div className="confirm-msg">Les membres avec ce rôle perdront leurs accès.</div><div className="confirm-actions"><button className="btn btn-outline" onClick={()=>setDeleteRoleId(null)}>Annuler</button><button className="btn btn-danger" onClick={()=>deleteRole(deleteRoleId)}>Supprimer</button></div></div></div>)}
    </div>
  );
}
