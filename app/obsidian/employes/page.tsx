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
import { EmployeeCard, EmployeeCardModalBody, sortByRole, roleKey, roleLabel } from "@/components/EmployeeCard";
import { PhotoPicker } from "@/components/PhotoPicker";
import { EmployeeDossier } from "@/components/EmployeeDossier";
import { ProfilPsy, type Psy } from "@/components/ProfilPsy";

interface Employe {
  id: string; nom: string; role: string; telephone: string; discord: string;
  email: string; notes: string; rib?: string | null; histoire_url?: string | null; histoire_texte?: string | null; profil_psy?: Psy | null; actif: boolean; created_at: string; photo_url?: string | null; genre?: string | null;
}

const EMPTY = { nom: "", role: "", genre: "m", telephone: "", discord: "", email: "", notes: "", rib: "", actif: true };
const GROUPS: { titre: string; keys: string[] }[] = [
  { titre: "👑 Directoire exécutif", keys: ["patron", "ceo", "coo"] }, { titre: "⚖️ Pôle Juridique", keys: ["rj", "aj", "avocat"] }, { titre: "📦 Pôle Logistique", keys: ["rl", "al"] }, { titre: "🛡️ Pôle Sécurité", keys: ["rs", "as"] }, { titre: "🧑‍💼 Membres", keys: ["op", "st"] }, { titre: "🤝 Partenaires externes", keys: ["legal"] },
];
const ROLES_LOGISTIQUE = Object.keys(DEFAULT_PERMISSIONS).filter(r =>
  DEFAULT_PERMISSIONS[r].some(p => p.startsWith("obsidian_") || p === "cahier_vente")
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
  const [strikeId, setStrikeId] = useState<string | null>(null);
  const cardEmp = employes.find(x => x.id === cardId) || null;
  async function savePhoto(url: string | null) {
    if (!cardEmp) return;
    const r = await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cardEmp.id, photo_url: url }) });
    if (!r.ok) { const d = await r.json(); alert("❌ " + d.error); return; }
    setEmployes(l => l.map(x => x.id === cardEmp.id ? { ...x, photo_url: url } : x));
    showToast(url ? "Photo enregistrée" : "Photo retirée");
  }

  const canPromote = /^(CEO|COO|Associé)/.test((user as any)?.role || "");
  const [dTab, setDTab] = useState<"dossier" | "psy" | "histoire">("dossier");
  const [promoRole, setPromoRole] = useState("");
  const [promo, setPromo] = useState<{ nom: string; from: string; to: string; step: number } | null>(null);
  const [histUrl, setHistUrl] = useState("");
  const [histTxt, setHistTxt] = useState("");
  useEffect(() => { setHistUrl(cardEmp?.histoire_url || ""); setHistTxt(cardEmp?.histoire_texte || ""); setPromoRole(""); setDTab("dossier"); }, [cardId]); // eslint-disable-line
  async function saveHistoire() {
    if (!cardEmp) return;
    const r = await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cardEmp.id, histoire_url: histUrl.trim() || null, histoire_texte: histTxt.trim() || null }) });
    if (!r.ok) { const d = await r.json(); alert("❌ " + d.error); return; }
    setEmployes(l => l.map(x => x.id === cardEmp.id ? { ...x, histoire_url: histUrl.trim() || null, histoire_texte: histTxt.trim() || null } : x));
    showToast("Histoire enregistrée");
  }
  async function savePsy(psy: Psy) {
    if (!cardEmp) return;
    const r = await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cardEmp.id, profil_psy: psy }) });
    if (!r.ok) { const d = await r.json(); alert("❌ " + d.error + " (as-tu lancé migration-lot18.sql ?)"); return; }
    setEmployes(l => l.map(x => x.id === cardEmp.id ? { ...x, profil_psy: psy } : x));
    showToast("Profil psy enregistré");
  }
  async function promouvoir() {
    if (!cardEmp || !promoRole || promoRole === cardEmp.role) return;
    const from = cardEmp.role || "—", nom = cardEmp.nom, id = cardEmp.id, to = promoRole;
    const r = await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, role: to }) });
    if (!r.ok) { const d = await r.json(); alert("❌ " + d.error); return; }
    setPromo({ nom, from, to, step: 0 });
    setTimeout(() => setPromo(p => p && { ...p, step: 1 }), 900);
    setTimeout(() => setPromo(null), 3800);
    setEmployes(l => l.map(x => x.id === id ? { ...x, role: to } : x));
    setPromoRole("");
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
    setForm({ nom: e.nom, role: e.role || "", genre: e.genre || "m", telephone: e.telephone || "", discord: e.discord || "", email: e.email || "", notes: e.notes || "", rib: e.rib || "", actif: e.actif !== false });
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
    if (!editId) { try { const created = await res.json(); if (created?.id) { setStrikeId(created.id); setTimeout(() => setStrikeId(null), 2500); } } catch {} }
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

  const visibles = sortByRole(employes.filter(e => showInactifs ? true : e.actif !== false));

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
        <div>
          {GROUPS.map(g => { const list = visibles.filter(e => g.keys.includes(roleKey(e.role))); if (!list.length) return null; return (
            <div key={g.titre} style={{ marginBottom: "1.6rem" }}>
              <div className="section-title" style={{ marginBottom: "0.7rem" }}>{g.titre} <span style={{ opacity: 0.5, fontWeight: 400 }}>({list.length})</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "1rem" }}>
                {list.map(e => (
                  <div key={e.id} style={{ opacity: e.actif === false ? 0.55 : 1 }}>
                    <EmployeeCard e={e} strike={strikeId === e.id} onOpen={() => setCardId(e.id)} onZoom={() => setCardId(e.id)} />
                  </div>
                ))}
              </div>
            </div>); })}
        </div>
      )}

      {showForm && (
        <Modal title={<>{editId ? "Modifier l'employé" : "Nouvel employé"}</>} onClose={() => setShowForm(false)} footer={<>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.nom.trim()}>{saving ? "…" : editId ? "Mettre à jour" : "Ajouter"}</button></>}>
              <div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} disabled={!!editId && !isPatron} title={!!editId && !isPatron ? "Seul le Patron peut renommer" : ""} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />{!!editId && !isPatron && <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 4 }}>Seul le Patron peut renommer un employé.</div>}</div>
              <div className="form-group">
                <label>Rôle</label>
                <select value={form.role} disabled={!!editId && !canPromote} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="">— Choisir un rôle —</option>
                  {form.role && !ROLES_LOGISTIQUE.includes(form.role) && <option value={form.role}>{form.role}</option>}
                  {ROLES_LOGISTIQUE.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {!!editId && !canPromote && <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 4 }}>Seuls le CEO et le COO peuvent changer le rôle (promotion).</div>}
              </div>
              <div className="form-group"><label>Genre (pour « Directeur / Directrice », « Agent / Agente »…)</label><select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}><option value="m">Masculin</option><option value="f">Féminin</option></select></div>
              <div className="form-grid">
                <div className="form-group"><label>Téléphone</label><input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>RIB</label><input value={form.rib} onChange={e => setForm(f => ({ ...f, rib: e.target.value }))} placeholder="Ex: FR76 …" /></div>
              <div className="form-group"><label>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: "0.82rem" }}>Actif</span>
              </label></Modal>
      )}

      {cardEmp && (
        <Modal size="xl" title={`🗂️ Dossier — ${cardEmp.nom}`} onClose={() => setCardId(null)}>
          <div className="fd-emp" style={{ maxHeight: "74vh", overflowY: "auto", padding: "0.4rem" }}>
            <div>
              <EmployeeCard e={cardEmp} />
              <div className="fd-actions">
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => { const e = cardEmp; setCardId(null); openEdit(e); }}>✏️ Modifier</button>
                {isPatron && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => { if (window.confirm(`Supprimer ${cardEmp.nom} ?`)) { const id = cardEmp.id; setCardId(null); remove(id); } }}>🗑️ Supprimer</button>}
              </div>
              <div style={{ marginTop: "0.9rem" }}><PhotoPicker value={cardEmp.photo_url} onChange={savePhoto} /></div>
              {canPromote && (
                <div className="card" style={{ marginTop: "0.9rem", padding: "0.8rem" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: 6 }}>⬆️ Promotion (CEO / COO)</div>
                  <select value={promoRole} onChange={e => setPromoRole(e.target.value)}>
                    <option value="">— Nouveau rôle —</option>
                    {ROLES_LOGISTIQUE.filter(r => r !== cardEmp.role).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="btn btn-gold btn-sm" style={{ width: "100%", marginTop: 6 }} disabled={!promoRole} onClick={promouvoir}>Promouvoir</button>
                </div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {(["dossier", "psy", "histoire"] as const).map(t => <button key={t} className={`btn btn-sm ${dTab === t ? "btn-gold" : "btn-outline"}`} onClick={() => setDTab(t)}>{t === "dossier" ? "🗂️ Dossier" : t === "psy" ? "🧠 Profil psy" : "📖 Histoire"}</button>)}
              </div>
              {dTab === "dossier" ? <EmployeeDossier e={cardEmp} /> : dTab === "psy" ? <ProfilPsy value={cardEmp.profil_psy} canEdit={true} onSave={savePsy} /> : (
                <div className="card">
                  <div className="section-title" style={{ marginBottom: 8 }}>Histoire du personnage</div>
                  <div className="form-group"><label>Texte de l'histoire</label><textarea rows={10} value={histTxt} onChange={e => setHistTxt(e.target.value)} placeholder="Écris ou colle le background du personnage…" /></div>
                  <div className="form-group"><label>Lien Google Doc (optionnel)</label><input value={histUrl} onChange={e => setHistUrl(e.target.value)} placeholder="https://docs.google.com/document/d/…" /></div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    <button className="btn btn-gold btn-sm" onClick={saveHistoire}>Enregistrer</button>
                    {cardEmp.histoire_url && <a className="btn btn-outline btn-sm" href={cardEmp.histoire_url} target="_blank" rel="noreferrer">Ouvrir ↗</a>}
                  </div>
                  {cardEmp.histoire_texte && <div style={{ whiteSpace: "pre-wrap", fontSize: "0.86rem", lineHeight: 1.6, padding: "0.8rem 1rem", borderLeft: "3px solid var(--gold)", background: "var(--surface)", borderRadius: "var(--radius)", marginBottom: 10 }}>{cardEmp.histoire_texte}</div>}
                  {cardEmp.histoire_url ? <iframe src={cardEmp.histoire_url.replace(/\/edit.*$/, "/preview")} style={{ width: "100%", height: 420, border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface)" }} /> : !cardEmp.histoire_texte && <div style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>Aucune histoire enregistrée.</div>}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {promo && (
        <div className="promo-overlay">
          <div className={`promo-stage ${promo.step ? "promo-new" : ""}`}>
            <div className="promo-title">⬆️ PROMOTION</div>
            <EmployeeCard e={{ ...(employes.find(x => x.nom === promo.nom) as any), role: promo.step ? promo.to : promo.from }} flippable={false} />
            <div className="promo-sub">{promo.nom} · {promo.from} → <b>{promo.to}</b></div>
          </div>
        </div>
      )}

      <UndoToast pending={pendingUndo} onUndo={undoDelete} />

      <Toast toast={toast} />
    </div>
  );
}
