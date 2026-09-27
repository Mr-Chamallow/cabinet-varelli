"use client";

import { useEffect, useState } from "react";
import { DEFAULT_PERMISSIONS, loadRolesFromSupabase, canAccess } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { fetchRecentActivity, ACTIVITY_CONFIG, timeAgo, ActivityItem } from "@/lib/activity";
import { deriveGoldPalette, applyThemeToDocument, DEFAULT_GOLD, isValidHex } from "@/lib/theme";
import { Modal } from "@/components/ui/Modal";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoAction } from "@/lib/useUndoAction";
import { DiagnosticTab } from "@/components/admin/DiagnosticTab";
import { RolesTab, COULEURS_PRESET } from "@/components/admin/RolesTab";
import { apiRequest } from "@/lib/apiRequest";

// Force le rendu dynamique côté serveur/client et désactive le pré-rendu statique au build Vercel
export const dynamic = "force-dynamic";

interface RoleOverride {
  discord_id: string;
  nom: string;
  role: string;
  updated_at?: string;
}

interface SiteLogin {
  discord_id: string;
  discord_name: string;
  site_role: string;
  first_login?: string;
  last_login?: string;
  last_seen?: string;
}

interface SiteBan {
  discord_id: string;
  nom?: string;
  motif?: string;
  banned_by?: string;
  banned_at?: string;
}

interface SessionLogItem {
  id: string;
  discord_id: string;
  discord_name: string;
  event: "connect" | "disconnect";
  created_at: string;
}

// Un membre est considéré "en ligne" si son heartbeat (/api/presence, toutes les
// 45s pendant qu'il navigue sur le site) date de moins de 90 secondes.
const ONLINE_THRESHOLD_MS = 90_000;
function isOnline(l: SiteLogin): boolean {
  if (!l.last_seen) return false;
  return Date.now() - new Date(l.last_seen).getTime() < ONLINE_THRESHOLD_MS;
}

interface Role {
  id: string;
  nom: string;
  permissions: string[];
  couleur: string;
}

const SITE_SETTINGS_KEYS = [
  { key: "app_nom", label: "Nom du site", placeholder: "Obsidian Logistique" },
  { key: "app_sous_nom", label: "Sous-titre", placeholder: "Consortium · Opérations · Logistique" },
  { key: "logo_url", label: "URL du logo", placeholder: "https://..." },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const { pending: pendingUndo, scheduleDelete, undo: undoDelete } = useUndoAction();
  const [overrides, setOverrides] = useState<RoleOverride[]>([]);
  const [logins, setLogins] = useState<SiteLogin[]>([]);
  const [loginSearch, setLoginSearch] = useState("");
  const [groupByRole, setGroupByRole] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"membres"|"roles"|"journaux"|"site"|"diagnostic">("membres");

  const [showCreateOverride, setShowCreateOverride] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ nom:"", discord_id:"", role:"" });
  const [creatingOverride, setCreatingOverride] = useState(false);
  const [createError, setCreateError] = useState("");

  const [bans, setBans] = useState<SiteBan[]>([]);
  const [showBanForm, setShowBanForm] = useState(false);
  const [banForm, setBanForm] = useState({ discord_id:"", nom:"", motif:"" });
  const [banningId, setBanningId] = useState<string | null>(null);
  const [showBansList, setShowBansList] = useState(false);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [filterActMember, setFilterActMember] = useState("");
  const [filterActType, setFilterActType] = useState("");
  const [journauxSubTab, setJournauxSubTab] = useState<"activite" | "connexions">("activite");
  const [sessionLog, setSessionLog] = useState<SessionLogItem[]>([]);
  const [sessionLogLoading, setSessionLogLoading] = useState(false);

  // Site (Personnalisation centralisée)
  const [siteSettings, setSiteSettings] = useState<Record<string,string>>({});
  const [siteGold, setSiteGold] = useState(DEFAULT_GOLD);
  const [siteGoldInput, setSiteGoldInput] = useState(DEFAULT_GOLD);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteSaving, setSiteSaving] = useState(false);
  const [discordTestMsg, setDiscordTestMsg] = useState<Record<string,string>>({});

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
      const [{ data: o, error: oErr }, rolesData, { data: l }, { data: b }] = await Promise.all([
        supabase.from("role_overrides").select("*").order("updated_at", { ascending: false }),
        loadRolesFromSupabase(),
        supabase.from("site_logins").select("*").order("last_login", { ascending: false }),
        supabase.from("site_bans").select("*").order("banned_at", { ascending: false }),
      ]);
      if (oErr) {
        setFetchError(`Erreur lors du chargement des overrides : ${oErr.message}`);
      }
      setOverrides(o || []);
      setLogins(l || []);
      setBans(b || []);
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
    if (activeTab === "journaux" && journauxSubTab === "activite" && activity.length === 0) loadActivity();
    if (activeTab === "journaux" && journauxSubTab === "connexions") loadSessionLog();
    if (activeTab === "site" && Object.keys(siteSettings).length === 0) loadSite();
  }, [activeTab, journauxSubTab]);

  // Rafraîchit les statuts "en ligne" (last_seen) toutes les 20s tant qu'on regarde
  // l'onglet Membres, sans re-déclencher tout fetchAll (overrides, rôles, etc.).
  useEffect(() => {
    if (activeTab !== "membres" || !supabase) return;
    const id = setInterval(async () => {
      const { data } = await supabase!.from("site_logins").select("*").order("last_login", { ascending: false });
      if (data) setLogins(data);
    }, 20000);
    return () => clearInterval(id);
  }, [activeTab]);

  async function loadSessionLog() {
    if (!supabase) return;
    setSessionLogLoading(true);
    const { data } = await supabase.from("site_session_log").select("*").order("created_at", { ascending: false }).limit(80);
    setSessionLog(data || []);
    setSessionLogLoading(false);
  }

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

  async function testDiscordWebhook(kind: string) {
    setDiscordTestMsg(m => ({ ...m, [kind]: "…" }));
    const res = await apiRequest("/api/admin/discord-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind }) });
    setDiscordTestMsg(m => ({ ...m, [kind]: res.ok ? "✅ Envoyé" : `❌ ${res.error}` }));
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

  function deleteOverride(discordId: string) {
    const ov = overrides.find(o => o.discord_id === discordId);
    if (!ov) return;
    setOverrides(list => list.filter(o => o.discord_id !== discordId));
    scheduleDelete(`Override de "${ov.nom || discordId}" retiré`, async () => {
      const r = await apiRequest("/api/admin/overrides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discord_id: discordId }) });
      if (!r.ok) setFetchError(`Impossible de retirer l'override : ${r.error}`);
    }, async () => {
      setOverrides(list => [...list, ov]);
      await apiRequest("/api/admin/overrides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ov) });
    });
  }

  async function confirmBan() {
    if (!banForm.discord_id.trim()) return;
    setBanningId(banForm.discord_id);
    const r = await apiRequest("/api/admin/bans", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(banForm),
    });
    if (!r.ok) { setFetchError(`Impossible de bannir : ${r.error}`); }
    else { setShowBanForm(false); setBanForm({ discord_id:"", nom:"", motif:"" }); await fetchAll(); }
    setBanningId(null);
  }

  async function unbanUser(discordId: string, nom: string) {
    if (!window.confirm(`Lever le bannissement de "${nom || discordId}" ?`)) return;
    setBanningId(discordId);
    const r = await apiRequest("/api/admin/bans", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discord_id: discordId }) });
    if (!r.ok) setFetchError(`Impossible de débannir : ${r.error}`);
    else await fetchAll();
    setBanningId(null);
  }

  function bannedInfo(discordId: string) { return bans.find(b => b.discord_id === discordId) || null; }

  const uniqueActMembers = [...new Set(activity.map(a => a.by))].filter(Boolean).sort();
  const filteredActivity = activity.filter(a =>
    (!filterActMember || a.by === filterActMember) &&
    (!filterActType || a.type === filterActType)
  );
  const sitePalette = deriveGoldPalette(siteGold);


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
        {([["membres","👥 Membres"],["roles","🎭 Rôles & Permissions"],["journaux","📋 Journaux"],["site","⚙️ Site"],["diagnostic","🩺 Diagnostic"]] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight:activeTab===k?700:400,
            background:activeTab===k?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${activeTab===k?"rgba(var(--gold-rgb), 0.4)":"var(--border)"}`,
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
                          <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", fontFamily: "var(--font-mono)" }}>{o.discord_id}</span>
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{color:"var(--danger)"}} onClick={()=>deleteOverride(o.discord_id)}>🗑️ Retirer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"2rem 0 1rem", flexWrap:"wrap", gap:"0.5rem" }}>
            <div className="section-title">
              Membres connectés ({logins.length})
              {" · "}
              <span style={{ color:"var(--success)", fontWeight:600 }}>🟢 {logins.filter(isOnline).length} en ligne</span>
            </div>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBansList(v => !v)} style={bans.length ? { color:"var(--danger)" } : {}}>
                🚫 Bannis ({bans.length})
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setGroupByRole(v => !v)}
                style={groupByRole ? { color:"var(--gold)", borderColor:"rgba(var(--gold-rgb),0.4)" } : {}}
              >
                {groupByRole ? "📋 Grouper par rôle" : "📄 Liste à plat"}
              </button>
              <input
                value={loginSearch}
                onChange={(e) => setLoginSearch(e.target.value)}
                placeholder="Rechercher un nom, un ID, un rôle..."
                style={{ maxWidth: 260 }}
              />
            </div>
          </div>
          {showBansList && (
            <div style={{ marginBottom:"1.25rem" }}>
              {bans.length === 0 ? (
                <div style={{ fontSize:"0.8rem", color:"var(--text-dim)" }}>Aucun membre banni.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {bans.map(b => (
                    <div key={b.discord_id} className="card" style={{ padding:"0.6rem 0.875rem", borderColor:"rgba(239,68,68,0.3)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:140 }}>
                          <div style={{ fontWeight:600, fontSize:"0.85rem" }}>🚫 {b.nom || b.discord_id}</div>
                          {b.motif && <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>Motif : {b.motif}</div>}
                          <div style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>
                            {b.banned_at ? timeAgo(b.banned_at) : ""}{b.banned_by ? ` — par ${b.banned_by}` : ""}
                          </div>
                        </div>
                        <button className="btn btn-outline btn-sm" disabled={banningId === b.discord_id} onClick={() => unbanUser(b.discord_id, b.nom || "")}>
                          {banningId === b.discord_id ? "…" : "✅ Débannir"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", marginBottom:"1rem" }}>
            Chaque personne qui s'est déjà connectée au site, avec le rôle détecté, sa dernière connexion et si elle est
            actuellement en ligne — utile pour vérifier si quelqu'un qui dit ne pas avoir accès s'est réellement connecté ou non.
          </p>
          {logins.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">Personne ne s'est encore connecté</div></div>
          ) : (() => {
            const filtered = logins.filter(l => {
              const q = loginSearch.toLowerCase().trim();
              if (!q) return true;
              return (l.discord_name||"").toLowerCase().includes(q) || l.discord_id.includes(q) || (l.site_role||"").toLowerCase().includes(q);
            });

            const memberCard = (l: SiteLogin) => {
              const roleData = roles.find(r => r.nom === l.site_role);
              const couleur = roleData?.couleur || "#8A93A6";
              const online = isOnline(l);
              const banned = bannedInfo(l.discord_id);
              return (
                <div key={l.discord_id} className="card" style={{ padding: "0.75rem 1rem", borderColor: banned ? "rgba(239,68,68,0.35)" : undefined }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", flexWrap:"wrap" }}>
                    <div style={{ position:"relative", flexShrink:0 }}>
                      <div style={{ width:36,height:36,borderRadius:"50%", background:couleur+"20",border:`2px solid ${couleur}40`, display:"flex",alignItems:"center",justifyContent:"center", fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"0.9rem",color:couleur }}>
                        {(l.discord_name || l.discord_id).charAt(0).toUpperCase()}
                      </div>
                      <span title={online ? "En ligne" : "Hors ligne"} style={{ position:"absolute", bottom:-1, right:-1, width:10, height:10, borderRadius:"50%", background: online ? "var(--success)" : "var(--text-dim)", border:"2px solid var(--card)", boxShadow: online ? "0 0 6px var(--success)" : "none" }} />
                    </div>
                    <div style={{ flex:1, minWidth:140 }}>
                      <div style={{ fontWeight:600, fontSize:"0.88rem", marginBottom:"0.15rem" }}>{l.discord_name || "(sans nom)"}{banned && <span style={{ marginLeft:6 }} title={`Banni : ${banned.motif || ""}`}>🚫</span>}</div>
                      <div style={{ fontSize:"0.68rem", color:"var(--text-dim)", fontFamily: "var(--font-mono)" }}>{l.discord_id}</div>
                    </div>
                    {!groupByRole && (
                      <span style={{ fontSize:"0.72rem", padding:"0.15rem 0.55rem", borderRadius:999, background:couleur+"18", color:couleur, border:`1px solid ${couleur}30`, fontWeight:600, flexShrink:0 }}>
                        {l.site_role || "(aucun rôle)"}
                      </span>
                    )}
                    <span style={{ fontSize:"0.72rem", color:online?"var(--success)":"var(--text-dim)", flexShrink:0, minWidth: 90, textAlign: "right", fontWeight: online?600:400 }}>
                      {online ? "🟢 en ligne" : (l.last_login ? timeAgo(l.last_login) : "—")}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setOverrideForm({ nom: l.discord_name || "", discord_id: l.discord_id, role: l.site_role || "" }); setCreateError(""); setShowCreateOverride(true); }}
                    >
                      🎭 Forcer un rôle
                    </button>
                    {banned ? (
                      <button className="btn btn-outline btn-sm" disabled={banningId === l.discord_id} onClick={() => unbanUser(l.discord_id, l.discord_name)}>
                        {banningId === l.discord_id ? "…" : "✅ Débannir"}
                      </button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger)" }} onClick={() => { setBanForm({ discord_id: l.discord_id, nom: l.discord_name || "", motif: "" }); setShowBanForm(true); }}>
                        🚫 Bannir
                      </button>
                    )}
                  </div>
                </div>
              );
            };

            if (!groupByRole) {
              return <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>{filtered.map(memberCard)}</div>;
            }

            const groups: Record<string, SiteLogin[]> = {};
            filtered.forEach(l => { const key = l.site_role || "(aucun rôle)"; (groups[key] ??= []).push(l); });
            // Ordonné selon l'ordre des rôles déclarés dans Admin > Rôles, groupe "aucun rôle" en dernier
            const orderedKeys = [...roles.map(r => r.nom).filter(n => groups[n]), ...Object.keys(groups).filter(k => !roles.some(r => r.nom === k))];

            return (
              <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
                {orderedKeys.map(roleName => {
                  const roleData = roles.find(r => r.nom === roleName);
                  const couleur = roleData?.couleur || "#8A93A6";
                  const members = groups[roleName];
                  return (
                    <div key={roleName}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem" }}>
                        <span style={{ width:8,height:8,borderRadius:"50%",background:couleur,flexShrink:0 }} />
                        <span style={{ fontSize:"0.8rem", fontWeight:700, color:couleur }}>{roleName}</span>
                        <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", fontFamily:"var(--font-mono)", background:"var(--surface)", borderRadius:999, padding:"0.05rem 0.5rem" }}>{members.length}</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                        {members.map(memberCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : activeTab === "roles" ? (
        <RolesTab />
      ) : activeTab === "journaux" ? (
        <div>
          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
            <button className={journauxSubTab==="activite" ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm"} onClick={()=>setJournauxSubTab("activite")}>📋 Activité</button>
            <button className={journauxSubTab==="connexions" ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm"} onClick={()=>setJournauxSubTab("connexions")}>🔌 Connexions</button>
          </div>

          {journauxSubTab === "activite" ? (
            <>
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
            </>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"0.75rem" }}>
                <button className="btn btn-outline btn-sm" onClick={loadSessionLog}>↻ Actualiser</button>
              </div>
              {sessionLogLoading ? (
                <div style={{ color:"var(--text-dim)" }}>Chargement…</div>
              ) : sessionLog.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🔌</div><div className="empty-title">Aucune connexion enregistrée</div></div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  {sessionLog.map(item => (
                    <div key={item.id} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.55rem 0", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:"0.9rem" }}>{item.event === "connect" ? "🟢" : "🔴"}</span>
                      <span style={{ fontWeight:600, fontSize:"0.82rem", flex:1 }}>{item.discord_name || item.discord_id}</span>
                      <span style={{ fontSize:"0.72rem", color: item.event === "connect" ? "var(--success)" : "var(--text-dim)" }}>
                        {item.event === "connect" ? "Connexion" : "Déconnexion"}
                      </span>
                      <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", minWidth:90, textAlign:"right" }}>{timeAgo(item.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === "site" ? (
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
                    <input value={siteGoldInput} onChange={e=>setSiteGoldInput(e.target.value)} onBlur={()=>isValidHex(siteGoldInput)&&applySiteGold(siteGoldInput)} placeholder="#a48fff" style={{ flex:1, fontFamily: "var(--font-mono)" }}/>
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

                <div className="card">
                  <div className="section-title" style={{ marginBottom:"0.5rem" }}>🔔 Alertes Discord</div>
                  <p style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginBottom:"0.875rem" }}>
                    Chaque module a son propre webhook, configuré via variable d'environnement sur Vercel (DISCORD_WEBHOOK_STOCKS, _ARMURERIE, _RDV, _CONTRATS, _FICHES). Teste ici que chacun est bien branché.
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                    {["stocks","armurerie","rdv","contrats","fiches"].map(kind => (
                      <div key={kind} style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                        <span style={{ flex:1, fontSize:"0.8rem", textTransform:"capitalize" }}>{kind}</span>
                        {discordTestMsg[kind] && <span style={{ fontSize:"0.68rem", color:"var(--text-dim)" }}>{discordTestMsg[kind]}</span>}
                        <button className="btn btn-outline btn-sm" onClick={()=>testDiscordWebhook(kind)}>Tester</button>
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
      ) : (
        <DiagnosticTab />
      )}

      {/* Modals */}
      {showCreateOverride && (
        <Modal title={<>Forcer un rôle</>} onClose={()=>setShowCreateOverride(false)} footer={<>
              <button className="btn btn-outline" onClick={()=>setShowCreateOverride(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={createOverride} disabled={creatingOverride||!overrideForm.discord_id.trim()||!overrideForm.role}>{creatingOverride?"Enregistrement…":"Forcer le rôle"}</button></>}>
              <div className="form-group"><label>Nom (repère visuel)</label><input placeholder="Ex : Marco Varelli" value={overrideForm.nom} onChange={e=>setOverrideForm(f=>({...f,nom:e.target.value}))} autoFocus/></div>
              <div className="form-group">
                <label>ID Discord *</label>
                <input placeholder="Ex : 460865920278069248" value={overrideForm.discord_id} onChange={e=>setOverrideForm(f=>({...f,discord_id:e.target.value}))} style={{ fontFamily: "var(--font-mono)" }}/>
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.3rem" }}>Mode développeur Discord activé → clic droit sur le pseudo → Copier l'ID</div>
              </div>
              <div className="form-group"><label>Rôle à forcer *</label>
                <select value={overrideForm.role} onChange={e=>setOverrideForm(f=>({...f,role:e.target.value}))}>
                  <option value="">Choisir un rôle…</option>
                  {(roles.length > 0 ? roles.map(r => r.nom) : Object.keys(DEFAULT_PERMISSIONS)).map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {createError&&<div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"var(--radius)",padding:"0.75rem",fontSize:"0.84rem",color:"var(--danger)" }}>⚠️ {createError}</div>}</Modal>
      )}

      {showBanForm && (
        <Modal title={<>🚫 Bannir {banForm.nom || banForm.discord_id}</>} onClose={()=>setShowBanForm(false)} footer={<>
              <button className="btn btn-outline" onClick={()=>setShowBanForm(false)}>Annuler</button>
              <button className="btn btn-gold" style={{ background:"var(--danger)" }} onClick={confirmBan} disabled={banningId===banForm.discord_id}>{banningId===banForm.discord_id?"…":"Confirmer le bannissement"}</button></>}>
              <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", marginBottom:"0.875rem" }}>
                Le membre sera immédiatement redirigé vers une page de bannissement à sa prochaine navigation, et ne pourra plus accéder au site tant que le bannissement n'est pas levé.
              </p>
              <div className="form-group"><label>ID Discord</label><input value={banForm.discord_id} disabled style={{ fontFamily:"var(--font-mono)", opacity:0.7 }}/></div>
              <div className="form-group" style={{ marginBottom:0 }}><label>Motif</label><textarea rows={3} autoFocus value={banForm.motif} onChange={e=>setBanForm(f=>({...f,motif:e.target.value}))} placeholder="Ex : comportement toxique, triche…"/></div>
        </Modal>
      )}

      <UndoToast pending={pendingUndo} onUndo={undoDelete} />
    </div>
  );
}
