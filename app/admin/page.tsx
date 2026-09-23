"use client";

import { useEffect, useState } from "react";
import { ALL_PERMISSIONS, PERMISSION_LABELS, DEFAULT_PERMISSIONS, loadRolesFromSupabase, canAccess } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { fetchRecentActivity, ACTIVITY_CONFIG, timeAgo, ActivityItem } from "@/lib/activity";
import { deriveGoldPalette, applyThemeToDocument, DEFAULT_GOLD, isValidHex } from "@/lib/theme";

// Force le rendu dynamique côté serveur/client et désactive le pré-rendu statique au build Vercel
export const dynamic = "force-dynamic";

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

const COULEURS_PRESET = [
  "#a78bfa","#c9a84c","#6366f1","#22c55e","#ef4444","#f97316",
  "#06b6d4","#ec4899","#a855f7","#14b8a6","#f59e0b",
  "#3b82f6","#84cc16","#e11d48","#0ea5e9","#d97706",
];

const SITE_SETTINGS_KEYS = [
  { key: "app_nom", label: "Nom du site", placeholder: "Obsidian Logistique" },
  { key: "app_sous_nom", label: "Sous-titre", placeholder: "Consortium · Opérations · Logistique" },
  { key: "logo_url", label: "URL du logo", placeholder: "https://..." },
];

// Fetch défensif : ne jamais planter sur une réponse non-JSON (page d'erreur HTML, 500, etc.)
// — avant, res.json() plantait silencieusement dans ce cas et le bouton restait bloqué sur
// "..." indéfiniment, sans jamais montrer l'erreur réelle.
async function apiRequest(url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* réponse non-JSON */ }
    if (!res.ok) {
      return { ok: false, status: res.status, data, error: data?.error || text?.slice(0, 300) || `Erreur HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 0, data: null, error: `Réseau/connexion : ${e?.message || e}` };
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [overrides, setOverrides] = useState<RoleOverride[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"membres"|"roles"|"journaux"|"site">("membres");

  const [showCreateOverride, setShowCreateOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ nom:"", discord_id:"", role:"" });
  const [creatingOverride, setCreatingOverride] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteOverrideId, setDeleteOverrideId] = useState<string|null>(null);

  const [showCreateRole, setShowCreateRole] = useState(false);
  const [roleForm, setRoleForm] = useState({ nom:"", permissions:[] as string[], couleur:"#6366f1" });
  const [creatingRole, setCreatingRole] = useState(false);

  const [editRoleId, setEditRoleId] = useState<string|null>(null);
  const [editRolePerms, setEditRolePerms] = useState<string[]>([]);
  const [editRoleCouleur, setEditRoleCouleur] = useState("#c9a84c");
  const [savingRole, setSavingRole] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState<string|null>(null);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [filterActMember, setFilterActMember] = useState("");
  const [filterActType, setFilterActType] = useState("");

  // Site (Personnalisation centralisée)
  const [siteSettings, setSiteSettings] = useState<Record<string,string>>({});
  const [siteGold, setSiteGold] = useState(DEFAULT_GOLD);
  const [siteGoldInput, setSiteGoldInput] = useState(DEFAULT_GOLD);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteSaving, setSiteSaving] = useState(false);

  // Plus de redirection automatique ici : le middleware protège déjà la route côté serveur.
  // Rediriger EN PLUS depuis le client pouvait créer un aller-retour visible ("ça charge en
  // boucle") si le rôle détecté différait entre le token serveur et l'état client.
  useEffect(() => {
    if (user && !userLoading && canAccess(user, "admin")) fetchAll();
  }, [user, userLoading]);

  async function fetchAll() {
    if (!supabase) {
      setFetchError("Connexion Supabase non configurée.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError("");
    try {
      const [{ data: o, error: oErr }, rolesData] = await Promise.all([
        supabase.from("role_overrides").select("*").order("updated_at", { ascending: false }),
        loadRolesFromSupabase(),
      ]);
      if (oErr) {
        setFetchError(`Erreur lors du chargement des overrides : ${oErr.message}`);
      }
      setOverrides(o || []);
      setRoles((rolesData as Role[]) || []);
      if ((!rolesData || rolesData.length === 0) && !oErr) {
        setFetchError("Aucun rôle trouvé. Vérifiez que la table `roles` existe et contient des données.");
      }
    } catch (e: any) {
      setFetchError(`Erreur lors de la récupération des données : ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivity() {
    setActLoading(true);
    try {
      const items = await fetchRecentActivity(40);
      setActivity(items);
    } catch (e) {
      console.error(e);
    } finally {
      setActLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "journaux" && activity.length === 0) loadActivity();
    if (activeTab === "site" && Object.keys(siteSettings).length === 0) loadSite();
  }, [activeTab]);

  async function loadSite() {
    if (!supabase) return;
    setSiteLoading(true);
    const { data, error } = await supabase.from("app_settings").select("cle,valeur");
    if (error) {
      setFetchError(`Table app_settings introuvable ou inaccessible : ${error.message}`);
      setSiteLoading(false);
      return;
    }
    const m: Record<string,string> = {};
    (data || []).forEach((r: any) => { m[r.cle] = r.valeur; });
    setSiteSettings(m);
    const g = m["couleur_gold"] && isValidHex(m["couleur_gold"]) ? m["couleur_gold"] : DEFAULT_GOLD;
    setSiteGold(g);
    setSiteGoldInput(g);
    setSiteLoading(false);
  }

  async function saveSiteKey(key: string, val: string) {
    if (!supabase) return;
    setSiteSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ cle: key, valeur: val }, { onConflict: "cle" });
    if (error) setFetchError(`Échec de l'enregistrement : ${error.message}`);
    else setSiteSettings(s => ({ ...s, [key]: val }));
    setSiteSaving(false);
  }

  async function applySiteGold(hex: string) {
    if (!isValidHex(hex)) return;
    setSiteGold(hex); setSiteGoldInput(hex);
    applyThemeToDocument(hex);
    await saveSiteKey("couleur_gold", hex);
  }

  async function createOverride() {
    if(!overrideForm.discord_id.trim()||!overrideForm.role) return;
    setCreatingOverride(true); setCreateError("");
    const r = await apiRequest("/api/admin/overrides", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discord_id: overrideForm.discord_id.trim(), nom: overrideForm.nom.trim(), role: overrideForm.role, updated_by: user?.nom, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) { setCreateError(r.error || "Erreur inconnue"); }
    else { setShowCreateOverride(false); setOverrideForm({ nom:"", discord_id:"", role:"" }); await fetchAll(); }
    setCreatingOverride(false);
  }

  async function deleteOverride(discordId: string) {
    const r = await apiRequest("/api/admin/overrides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discord_id: discordId }) });
    if (!r.ok) setFetchError(`Impossible de retirer l'override : ${r.error}`);
    setDeleteOverrideId(null); await fetchAll();
  }

  async function createRole() {
    if(!roleForm.nom.trim()) return;
    setCreatingRole(true); setFetchError("");
    const r = await apiRequest("/api/admin/roles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom:roleForm.nom.trim(), permissions:roleForm.permissions, couleur:roleForm.couleur }),
    });
    if (!r.ok) { setFetchError(`Impossible de créer le rôle : ${r.error}`); }
    else { await fetchAll(); setShowCreateRole(false); setRoleForm({ nom:"", permissions:[], couleur:"#6366f1" }); }
    setCreatingRole(false);
  }

  async function saveRole(id: string) {
    setSavingRole(true); setFetchError("");
    const r = await apiRequest("/api/admin/roles", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, permissions:editRolePerms, couleur:editRoleCouleur }),
    });
    if (!r.ok) setFetchError(`Impossible de sauvegarder le rôle : ${r.error}`);
    else setEditRoleId(null);
    await fetchAll(); setSavingRole(false);
  }

  async function deleteRole(id: string) {
    setFetchError("");
    const r = await apiRequest("/api/admin/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!r.ok) setFetchError(`Impossible de supprimer le rôle : ${r.error}`);
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
  const sitePalette = deriveGoldPalette(siteGold);

  // ✅ FIX SÉCURITÉ : bloque le rendu si pas admin (empêche le flash de contenu avant redirect)
  // ✅ FIX SÉCURITÉ : bloque le rendu si pas admin — mais montre POURQUOI au lieu d'un écran
  // vide indéfini, pour pouvoir diagnostiquer sans deviner (rôle détecté, permissions, etc.)
  if (userLoading) {
    return <div className="page-container" style={{ color: "var(--text-dim)" }}>Chargement de la session…</div>;
  }
  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Session non détectée</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Essaie de te <a href="/login" style={{ color: "var(--gold)" }}>reconnecter</a>. Si ça persiste après reconnexion,
            le problème vient de la config NextAuth côté serveur (NEXTAUTH_URL / NEXTAUTH_SECRET sur Vercel).
          </p>
        </div>
      </div>
    );
  }
  if (!canAccess(user, "admin")) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🚫</div>
          <div className="empty-title">Accès refusé</div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Rôle détecté : <strong style={{ color: "var(--text)" }}>{user.role || "(aucun)"}</strong>
            {" — "}permissions Supabase : <code style={{ fontSize: "0.75rem" }}>{JSON.stringify(user.permissions || [])}</code>
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Si ce rôle devrait avoir accès, ajoute la permission "admin" à ce rôle dans l'onglet Rôles,
            ou force le rôle "Associé / Patron" pour ce membre via un override.
          </p>
          <a href="/" className="btn btn-outline btn-sm" style={{ marginTop: "1rem", display: "inline-block" }}>← Retour au tableau de bord</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="back-link" onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer" }}>
        ← Tableau de bord
      </button>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Membres · Rôles · Permissions · Journaux · Site</p>
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
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {([["membres","👥 Membres"],["roles","🎭 Rôles & Permissions"],["journaux","📋 Journaux"],["site","⚙️ Site"]] as [string,string][]).map(([k,l]) => (
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
              const currentPerms = isEditing ? editRolePerms : (r.permissions || []);
              const currentCouleur = isEditing ? editRoleCouleur : (r.couleur || "#c9a84c");
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
                          <button className="btn btn-outline btn-sm" onClick={() => { setEditRoleId(r.id); setEditRolePerms([...(r.permissions || [])]); setEditRoleCouleur(r.couleur || "#c9a84c"); }}>✏️ Modifier</button>
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
                        <button
                          key={p}
                          disabled={!isEditing}
                          onClick={() => isEditing && setEditRolePerms(perms => togglePerm(perms, p))}
                          style={{
                            display:"flex",alignItems:"center",gap:"0.4rem",padding:"0.3rem 0.55rem",borderRadius:6,
                            background:has?currentCouleur+"15":"transparent",
                            border:`1px solid ${has?currentCouleur+"30":"var(--border)"}`,
                            cursor:isEditing?"pointer":"default",fontFamily:"'Inter',sans-serif",fontSize:"0.7rem",
                            color:has?currentCouleur:"var(--text-dim)",fontWeight:has?600:400,
                            opacity:isEditing?1:0.85, transition:"all 0.12s",
                          }}
                        >
                          <span style={{fontSize:"0.58rem"}}>{has?"✓":"○"}</span>{PERMISSION_LABELS[p]||p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === "journaux" ? (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
            <select value={filterActMember} onChange={e=>setFilterActMember(e.target.value)} style={{ maxWidth:200 }}>
              <option value="">Tous les membres</option>
              {uniqueActMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setFilterActType("")} style={{ fontWeight:filterActType===""?700:400 }}>Tous</button>
              {(Object.keys(ACTIVITY_CONFIG) as (keyof typeof ACTIVITY_CONFIG)[]).map(t => (
                <button key={t} className="btn btn-ghost btn-sm" onClick={()=>setFilterActType(t)} style={{
                  fontWeight:filterActType===t?700:400,
                  color:filterActType===t?ACTIVITY_CONFIG[t].color:"var(--text-muted)",
                }}>
                  {ACTIVITY_CONFIG[t].icon} {ACTIVITY_CONFIG[t].label}
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
                const cfg = ACTIVITY_CONFIG[item.type];
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
      ) : (
        // ── Onglet Site (Personnalisation centralisée) ──
        <div>
          {siteLoading ? (
            <div style={{ color:"var(--text-dim)" }}>Chargement…</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem", alignItems:"start" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
                <div className="card">
                  <div className="section-title" style={{ marginBottom:"1rem" }}>🎨 Couleur du site</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"1rem" }}>
                    {COULEURS_PRESET.map(c => (
                      <button key={c} onClick={()=>applySiteGold(c)} title={c} style={{
                        width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",
                        border:`3px solid ${siteGold.toLowerCase()===c.toLowerCase()?"#fff":"transparent"}`,
                        boxShadow:siteGold.toLowerCase()===c.toLowerCase()?`0 0 0 2px ${c}`:"none", transition:"all 0.15s",
                      }}/>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:"0.6rem", alignItems:"center" }}>
                    <input type="color" value={siteGold} onChange={e=>applySiteGold(e.target.value)} style={{ width:40,height:36,padding:0,border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",background:"none" }}/>
                    <input value={siteGoldInput} onChange={e=>setSiteGoldInput(e.target.value)} onBlur={()=>isValidHex(siteGoldInput)&&applySiteGold(siteGoldInput)} placeholder="#a78bfa" style={{ flex:1, fontFamily:"monospace" }}/>
                    {siteSaving && <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>…</span>}
                  </div>
                </div>

                <div className="card">
                  <div className="section-title" style={{ marginBottom:"1rem" }}>Identité</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                    {SITE_SETTINGS_KEYS.map(({key,label,placeholder}) => (
                      <div key={key} style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                        <label style={{ fontSize:"0.7rem", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</label>
                        <div style={{ display:"flex", gap:"0.5rem" }}>
                          <input value={siteSettings[key]||""} onChange={e=>setSiteSettings(s=>({...s,[key]:e.target.value}))} placeholder={placeholder} style={{ flex:1 }}/>
                          <button className="btn btn-gold btn-sm" onClick={()=>saveSiteKey(key, siteSettings[key]||"")} disabled={siteSaving}>{siteSaving?"…":"✓"}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize:"0.75rem", color:"var(--text-dim)" }}>
                  Réglages détaillés (police, sous-titre complet…) → <a href="/settings" style={{ color:"var(--gold)" }}>page Personnalisation</a>.
                </p>
              </div>

              <div className="card" style={{ border:`2px solid ${sitePalette.goldMuted}` }}>
                <div style={{ fontSize:"0.68rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-dim)", marginBottom:"0.875rem" }}>Aperçu</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.05rem", fontWeight:900, color:sitePalette.gold, letterSpacing:"0.08em", marginBottom:"0.2rem" }}>
                  {siteSettings["app_nom"] || "Obsidian Logistique"}
                </div>
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginBottom:"0.875rem" }}>{siteSettings["app_sous_nom"] || "Consortium · Opérations · Logistique"}</div>
                <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#0b0b12", background:sitePalette.gold, padding:"0.3rem 0.75rem", borderRadius:"var(--radius)", display:"inline-block" }}>Bouton</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
