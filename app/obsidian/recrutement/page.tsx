"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { dbw } from "@/lib/dbw";
import { useGmAccess, Badge, Chip } from "@/components/gm/bits";
import { DEFAUTS } from "@/lib/regles";
import { problemes, formatDiscord, STATUTS_RECRUTEMENT as STATUTS } from "@/lib/recrutement";

const POSTES = ["Agent juridique", "Agent logistique", "Agent de sécurité", "Opérateur", "Opérateur stagiaire", "Responsable juridique", "Responsable logistique", "Responsable sécurité", "COO", "CEO"];
const EMPTY = { nom_rp: "", age_ok: false, discord: "", discord_id: "", unique_id: "", poste: "Opérateur", wipe_fait: false, heures_jeu: "" as any, ancien_groupe: "", date_depart_ancien: "", sanctions_verifiees: false, sanctions_notes: "", statut: "candidat", gdoc_url: "", histoire: "" };

export default function RecrutementPage() {
  const { canWrite, user } = useGmAccess("obsidian_recrutement");
  const { toast, showToast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filtre, setFiltre] = useState("tout");
  const [effectif, setEffectif] = useState<number | null>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [effMax, setEffMax] = useState<number>(DEFAUTS.effectifMax);

  useEffect(() => { load(); }, []);
  useRealtimeTable(["obsidian_recrutement", "obsidian_recrutement_votes", "obsidian_employes"], load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data }, { count }, { data: st }, { data: vt }] = await Promise.all([
      supabase.from("obsidian_recrutement").select("*").order("created_at", { ascending: false }),
      supabase.from("obsidian_employes").select("id", { count: "exact", head: true }),
      supabase.from("obsidian_settings").select("effectif_max").eq("id", "default").maybeSingle(),
      supabase.from("obsidian_recrutement_votes").select("recrutement_id,voter_id,voter_nom,vote"),
    ]);
    setVotes(vt || []);
    setList(data || []); setEffectif(count ?? null);
    if (st?.effectif_max) setEffMax(Number(st.effectif_max));
    setLoading(false);
  }
  const nbDossier = list.filter(l => l.statut === "valide" || l.statut === "dossier").length;
  const visibles = list.filter(l => filtre === "tout" || l.statut === filtre);

  function openNew() { setEditId(null); setForm({ ...EMPTY }); setShow(true); }
  function openEdit(r: any) { setEditId(r.id); setForm({ ...EMPTY, ...r, heures_jeu: r.heures_jeu ?? "", date_depart_ancien: r.date_depart_ancien || "", discord: r.discord || "", discord_id: r.discord_id || "", unique_id: r.unique_id || "", ancien_groupe: r.ancien_groupe || "", sanctions_notes: r.sanctions_notes || "", gdoc_url: r.gdoc_url || "", histoire: r.histoire || "" }); setShow(true); }
  async function save() {
    if (!form.nom_rp.trim()) return;
    setSaving(true);
    const row = { nom_rp: form.nom_rp.trim(), age_ok: !!form.age_ok, discord: form.discord.trim() || null, discord_id: form.discord_id.trim() || null, unique_id: form.unique_id.trim() || null, poste: form.poste, wipe_fait: !!form.wipe_fait, heures_jeu: Number(form.heures_jeu) || 0, ancien_groupe: form.ancien_groupe.trim() || null, date_depart_ancien: form.date_depart_ancien || null, sanctions_verifiees: !!form.sanctions_verifiees, sanctions_notes: form.sanctions_notes.trim() || null, statut: form.statut, gdoc_url: form.gdoc_url.trim() || null, histoire: form.histoire.trim() || null, created_by: (user as any)?.nom || null };
    const r = editId ? await dbw.update("obsidian_recrutement", editId, row) : await dbw.insert("obsidian_recrutement", row);
    setSaving(false);
    if (r.error) { showToast(`Erreur : ${r.error.message}`, "danger"); return; }
    setShow(false); showToast(editId ? "Fiche modifiée" : "Fiche créée"); load();
  }
  async function del(r: any) {
    if (!window.confirm(`Supprimer la fiche de ${r.nom_rp} ?`)) return;
    const x = await dbw.remove("obsidian_recrutement", r.id);
    if (x.error) showToast(`Erreur : ${x.error.message}`, "danger"); else { showToast("Supprimée"); load(); }
  }
  async function setStatut(r: any, statut: string) {
    setList(l => l.map(x => (x.id === r.id ? { ...x, statut } : x)));
    const x = await dbw.update("obsidian_recrutement", r.id, { statut });
    if (x.error) { showToast(`Erreur : ${x.error.message}`, "danger"); load(); }
  }
  const myId = String((user as any)?.id || "");
  const nbMembres = effectif ?? 0;
  async function voter(r: any, vote: string | null) {
    const res = vote
      ? await fetch("/api/obsidian/recrutement/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recrutement_id: r.id, vote }) })
      : await fetch(`/api/obsidian/recrutement/vote?recrutement_id=${r.id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`Erreur : ${j.error || res.status}`, "danger"); return; }
    showToast(j.statut === "valide" ? "Vote pris en compte : candidat validé !" : j.statut === "refuse" ? "Vote pris en compte : candidat refusé" : vote ? "Vote enregistré" : "Vote retiré");
    load();
  }
  async function copier(r: any) {
    try { await navigator.clipboard.writeText(formatDiscord(r)); showToast("Copié, colle-le dans Discord"); }
    catch { window.prompt("Copie ce texte :", formatDiscord(r)); }
  }
  async function copierTout() {
    const txt = visibles.map(formatDiscord).join("\n\n");
    try { await navigator.clipboard.writeText(txt); showToast(`${visibles.length} fiches copiées`); } catch { window.prompt("Copie ce texte :", txt); }
  }

  const checkRow = (label: string, key: string) => (
    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", cursor: "pointer" }}>
      <input type="checkbox" checked={!!form[key]} style={{ width: "auto" }} onChange={e => setForm({ ...form, [key]: e.target.checked })} /> {label}
    </label>
  );

  return (
    <div className="page-container">
      <Link className="back-link" href="/">Dashboard</Link>
      <div className="page-header">
        <div><h1 className="page-title">📝 Recrutement</h1><p className="page-subtitle">Fiches candidats · Conditions du règlement · Format Discord</p><div className="gold-line" /></div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-outline" onClick={copierTout} disabled={visibles.length === 0}>📋 Tout copier</button>
          {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouvelle fiche</button>}
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Effectif actuel</div><div className="stat-value" style={{ fontSize: "1.4rem", color: effectif != null && effectif > effMax ? "var(--danger)" : "var(--text)" }}>{effectif ?? "?"} / {effMax}</div></div>
        <div className="stat-card"><div className="stat-label">Dossier (min. {DEFAUTS.dossierMin})</div><div className="stat-value" style={{ fontSize: "1.4rem", color: nbDossier >= DEFAUTS.dossierMin ? "var(--success)" : "var(--warning)" }}>{nbDossier} / {DEFAUTS.dossierMin}</div><div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>fiches validées ou dans le dossier</div></div>
        <div className="stat-card"><div className="stat-label">Candidats</div><div className="stat-value" style={{ fontSize: "1.4rem" }}>{list.filter(l => l.statut === "candidat").length}</div></div>
      </div>
      {nbDossier < DEFAUTS.dossierMin && <div style={{ fontSize: "0.78rem", color: "var(--warning)", margin: "0.4rem 0" }}>⚠️ Le règlement demande {DEFAUTS.dossierMin} membres minimum (ID + Discord) dans le dossier de création.</div>}
      <div style={{ display: "flex", gap: "0.4rem", margin: "0.5rem 0 1rem", flexWrap: "wrap" }}>
        <Chip active={filtre === "tout"} onClick={() => setFiltre("tout")}>Tous ({list.length})</Chip>
        {Object.entries(STATUTS).map(([k, s]) => <Chip key={k} active={filtre === k} onClick={() => setFiltre(k)}>{s.label} ({list.filter(l => l.statut === k).length})</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visibles.length === 0 ? <div className="empty-state"><div className="empty-icon">📝</div><div className="empty-title">Aucune fiche</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {visibles.map(r => {
            const pr = problemes(r); const st = STATUTS[r.statut] || STATUTS.candidat;
            return (
              <div key={r.id} className="card" style={{ padding: "0.8rem 1rem", borderLeft: `3px solid ${pr.length ? "var(--warning)" : "var(--success)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 190 }}>
                    <div style={{ fontWeight: 700 }}>{r.nom_rp} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {r.poste}</span></div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>ID {r.unique_id || "?"} · {r.discord || "Discord ?"}{r.discord_id ? ` (${r.discord_id})` : ""} · {r.heures_jeu || 0} h{r.ancien_groupe ? ` · ex-${r.ancien_groupe}` : ""}</div>
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                  {canWrite && <select value={r.statut} onChange={e => setStatut(r, e.target.value)} style={{ maxWidth: 140 }}>{Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>}
                  <button className="btn btn-outline btn-sm" onClick={() => copier(r)}>📋 Discord</button>
                  {canWrite && <><button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(r)}>🗑️</button></>}
                </div>
                {r.gdoc_url && <div style={{ marginTop: "0.4rem", fontSize: "0.76rem" }}>📄 <a href={/^https?:\/\//i.test(r.gdoc_url) ? r.gdoc_url : `https://${r.gdoc_url}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>Gdoc du personnage</a></div>}
                {r.histoire && <div style={{ marginTop: "0.3rem", fontSize: "0.74rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>📖 {r.histoire.length > 220 ? r.histoire.slice(0, 220) + "…" : r.histoire}</div>}
                {(() => {
                  const vs = votes.filter(v => v.recrutement_id === r.id);
                  const ok = vs.filter(v => v.vote === "approuve"), ko = vs.filter(v => v.vote === "refuse");
                  const mine = vs.find(v => v.voter_id === myId);
                  const open = r.statut === "candidat";
                  return (
                    <div style={{ marginTop: "0.55rem", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", fontSize: "0.76rem" }}>
                      <span style={{ color: "var(--success)", fontWeight: 700 }}>👍 {ok.length}</span>
                      <span style={{ color: "var(--danger)", fontWeight: 700 }}>👎 {ko.length}</span>
                      <span style={{ color: "var(--text-dim)" }}>sur {nbMembres || "?"} membres · majorité requise</span>
                      {open && <>
                        <button className="btn btn-sm" style={{ background: mine?.vote === "approuve" ? "var(--success)" : "transparent", border: "1px solid var(--success)", color: mine?.vote === "approuve" ? "#fff" : "var(--success)" }} onClick={() => voter(r, "approuve")}>✅ Approuver</button>
                        <button className="btn btn-sm" style={{ background: mine?.vote === "refuse" ? "var(--danger)" : "transparent", border: "1px solid var(--danger)", color: mine?.vote === "refuse" ? "#fff" : "var(--danger)" }} onClick={() => voter(r, "refuse")}>❌ Refuser</button>
                        {mine && <button className="btn btn-ghost btn-sm" onClick={() => voter(r, null)}>Retirer mon vote</button>}
                      </>}
                      {!open && mine && <span style={{ color: "var(--text-dim)" }}>Ton vote : {mine.vote === "approuve" ? "approuvé" : "refusé"}</span>}
                      {vs.length > 0 && <span style={{ color: "var(--text-dim)", fontSize: "0.68rem" }}>({vs.map(v => `${v.voter_nom} ${v.vote === "approuve" ? "👍" : "👎"}`).join(", ")})</span>}
                    </div>
                  );
                })()}
                {pr.length > 0 && <div style={{ marginTop: "0.45rem", fontSize: "0.74rem", color: "var(--warning)" }}>⚠️ {pr.join(" · ")}</div>}
              </div>
            );
          })}
        </div>
      )}
      {show && (
        <Modal title={editId ? "Modifier la fiche" : "Nouvelle fiche de recrutement"} size="lg" onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.nom_rp.trim()} onClick={save}>{saving ? "..." : "Enregistrer"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            <div className="form-grid">
              <div><label>Nom RP *</label><input value={form.nom_rp} onChange={e => setForm({ ...form, nom_rp: e.target.value })} /></div>
              <div><label>Poste visé</label><select value={form.poste} onChange={e => setForm({ ...form, poste: e.target.value })}>{POSTES.map(p => <option key={p}>{p}</option>)}</select></div>
              <div><label>ID unique</label><input value={form.unique_id} onChange={e => setForm({ ...form, unique_id: e.target.value })} /></div>
              <div><label>Discord (pseudo)</label><input value={form.discord} onChange={e => setForm({ ...form, discord: e.target.value })} /></div>
              <div><label>ID Discord</label><input value={form.discord_id} onChange={e => setForm({ ...form, discord_id: e.target.value })} /></div>
              <div><label>Heures de jeu</label><input type="number" min={0} value={form.heures_jeu} onChange={e => setForm({ ...form, heures_jeu: e.target.value })} /></div>
              <div><label>Ancien groupe</label><input value={form.ancien_groupe} onChange={e => setForm({ ...form, ancien_groupe: e.target.value })} placeholder="Vide si aucun" /></div>
              <div><label>Date de départ de l'ancien groupe</label><input type="date" value={form.date_depart_ancien} onChange={e => setForm({ ...form, date_depart_ancien: e.target.value })} /></div>
              <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select></div>
            </div>
            <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
              {checkRow("18 ans ou plus", "age_ok")}{checkRow("Wipe effectué", "wipe_fait")}{checkRow("Sanctions vérifiées", "sanctions_verifiees")}
            </div>
            <div><label>Notes sur les sanctions</label><input value={form.sanctions_notes} onChange={e => setForm({ ...form, sanctions_notes: e.target.value })} /></div>
            <div><label>Lien du Gdoc (histoire du personnage)</label><input value={form.gdoc_url} onChange={e => setForm({ ...form, gdoc_url: e.target.value })} placeholder="https://docs.google.com/document/d/..." /></div>
            <div><label>Histoire du personnage</label><textarea rows={4} value={form.histoire} onChange={e => setForm({ ...form, histoire: e.target.value })} placeholder="Résumé de l'histoire du personnage" /></div>
            {problemes(form).length > 0 && <div style={{ fontSize: "0.8rem", color: "var(--warning)", marginTop: "0.5rem" }}>⚠️ {problemes(form).join(" · ")}. Tu peux enregistrer quand même.</div>}
          </div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
