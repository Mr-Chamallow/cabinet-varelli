"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { fireConfetti } from "@/lib/confetti";
import { gmWrite } from "@/lib/gmApi";
import { pdfEvenement } from "@/lib/pdfDocs";
import { useGmAccess, useGroupes, GroupeSelect, Chip, Badge, fmtDT, toLocalInput, fromLocalInput, usd } from "@/components/gm/bits";

type Check = { t: string; done: boolean };
const MODELES: Record<string, string[]> = {
  convoi: ["Itinéraire validé", "Escorte briefée", "Véhicules prêts", "Contact partenaire prévenu", "Départ confirmé", "Livraison / débrief"],
  enchere: ["Lieu sécurisé", "Lots catalogués", "Invités confirmés", "Commissaire désigné", "Paiements encaissés", "Débrief"],
  capture: ["Cible localisée", "Équipe Sécurité assignée", "Matériel prêt", "Capture effectuée", "Remise au Tribunal"],
  alerte: ["Source vérifiée", "Groupe en tête informé", "Traque lancée", "Prime versée", "Clôture"],
};
type Lot = { nom: string; mise_depart: number; mise_finale: number; gagnant: string };
const TYPES: Record<string, { label: string; icon: string; montantLabel: string; partenaireLabel: string; statuts: { k: string; label: string; color: string }[] }> = {
  convoi: { label: "Convois", icon: "🚚", montantLabel: "Valeur de la marchandise ($)", partenaireLabel: "Groupe chargé de l'escorte", statuts: [
    { k: "planifie", label: "Planifié", color: "var(--info)" }, { k: "en_route", label: "En route", color: "var(--warning)" }, { k: "livre", label: "Livré", color: "var(--success)" }, { k: "echec", label: "Échec", color: "var(--danger)" }, { k: "annule", label: "Annulé", color: "var(--text-dim)" }] },
  enchere: { label: "Enchères", icon: "🔨", montantLabel: "Total adjugé ($)", partenaireLabel: "Lieu / organisateur", statuts: [
    { k: "annoncee", label: "Annoncée", color: "var(--info)" }, { k: "ouverte", label: "Ouverte", color: "var(--warning)" }, { k: "cloturee", label: "Clôturée", color: "var(--success)" }, { k: "annulee", label: "Annulée", color: "var(--text-dim)" }] },
  capture: { label: "Captures", icon: "🎯", montantLabel: "Prime / enjeu ($)", partenaireLabel: "Organisation de la cible", statuts: [
    { k: "a_faire", label: "À faire", color: "var(--danger)" }, { k: "en_cours", label: "En cours", color: "var(--warning)" }, { k: "capturee", label: "Capturée", color: "var(--success)" }, { k: "annulee", label: "Annulée", color: "var(--text-dim)" }] },
  alerte: { label: "Lanceur d'alerte", icon: "🚨", montantLabel: "Prime ($)", partenaireLabel: "Groupe en tête de la traque", statuts: [
    { k: "ouverte", label: "Ouverte", color: "var(--danger)" }, { k: "traquee", label: "Traquée", color: "var(--warning)" }, { k: "resolue", label: "Résolue", color: "var(--success)" }, { k: "annulee", label: "Annulée", color: "var(--text-dim)" }] },
};
// Statut automatique selon l'avancement de la checklist (jamais écrasé si annulé / échec).
const AUTO: Record<string, [string, string, string]> = { convoi: ["planifie", "en_route", "livre"], enchere: ["annoncee", "ouverte", "cloturee"], capture: ["a_faire", "en_cours", "capturee"], alerte: ["ouverte", "traquee", "resolue"] };
function autoStatut(type: string, cl: Check[], cur: string): string {
  const a = AUTO[type]; if (!a || !cl?.length || /annul|echec/.test(cur)) return cur;
  const n = cl.filter(c => c.done).length; return n === 0 ? (cur === a[2] || cur === a[1] ? a[0] : cur) : n === cl.length ? a[2] : a[1];
}
const empty = (type: string) => ({ type, titre: "", statut: TYPES[type].statuts[0].k, partenaire: "", date_event: "", montant: 0, lots: [] as Lot[], notes: "", checklist: [] as Check[] });

export default function EvenementsPage() {
  const { canWrite } = useGmAccess("gm_evenements");
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState("convoi");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty("convoi"));
  const [saving, setSaving] = useState(false);
  const groupes = useGroupes();
  const T = TYPES[tab];

  useEffect(() => { load(); }, []);
  useRealtimeTable("gm_evenements", load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("gm_evenements").select("*").order("created_at", { ascending: false });
    setList((data || []).map((e: any) => ({ ...e, montant: Number(e.montant) || 0 }))); setLoading(false);
  }
  function openNew() { setEditId(null); setForm(empty(tab)); setShow(true); }
  function openEdit(e: any) { setEditId(e.id); setForm({ ...empty(e.type), ...e, partenaire: e.partenaire || "", notes: e.notes || "", date_event: toLocalInput(e.date_event), lots: e.lots || [], checklist: e.checklist || [] }); setShow(true); }
  async function save() {
    if (!form.titre.trim()) return;
    setSaving(true);
    const total = form.type === "enchere" && form.lots.length ? form.lots.reduce((s: number, l: Lot) => s + (Number(l.mise_finale) || 0), 0) : Number(form.montant) || 0;
    const norm = (x: string) => (x || "").trim().toLowerCase();
    if (!editId && list.some(x => x.type === form.type && norm(x.titre) === norm(form.titre) && !/livre|cloturee|capturee|resolue|annul|echec/.test(x.statut))) { setSaving(false); showToast("Doublon : un événement actif porte déjà ce titre", "danger"); return; }
    const manual = form.statut !== (editId ? (list.find(x => x.id === editId)?.statut) : TYPES[form.type].statuts[0].k);
    const checklist = manual ? checklistFor(form.type, form.checklist, form.statut) : form.checklist;
    const body = { ...form, checklist, statut: manual ? form.statut : autoStatut(form.type, checklist, form.statut), montant: total, date_event: fromLocalInput(form.date_event) };
    const r = await gmWrite("gm_evenements", editId ? "PATCH" : "POST", editId ? { ...body, id: editId } : body);
    setSaving(false);
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); return; }
    setShow(false); showToast("Enregistré"); load();
  }
  // Le statut choisi à la main met aussi la checklist à jour (et inversement via autoStatut) : plus d'incohérence.
  function checklistFor(type: string, cl: Check[], statut: string): Check[] {
    const a = AUTO[type]; if (!a || !cl?.length || /annul|echec/.test(statut)) return cl;
    const n = cl.filter(c => c.done).length;
    if (statut === a[0]) return cl.map(c => ({ ...c, done: false }));
    if (statut === a[2]) return cl.map(c => ({ ...c, done: true }));
    if (n === 0) return cl.map((c, i) => ({ ...c, done: i < Math.ceil(cl.length / 2) }));
    if (n === cl.length) return cl.map((c, i) => ({ ...c, done: i < cl.length - 1 }));
    return cl;
  }
  async function setStatut(e: any, statut: string) {
    const checklist = checklistFor(e.type, e.checklist || [], statut);
    setList(l => l.map(x => (x.id === e.id ? { ...x, statut, checklist } : x)));
    const r = await gmWrite("gm_evenements", "PATCH", { id: e.id, statut, checklist });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else load();
  }
  async function del(e: any) {
    if (!window.confirm(`Supprimer « ${e.titre} » ?`)) return;
    const r = await gmWrite("gm_evenements", "DELETE", { id: e.id });
    if (!r.ok) showToast(`Erreur : ${r.error}`, "danger"); else { showToast("Supprimé"); load(); }
  }
  async function toggleCheck(e: any, i: number) {
    if (!canWrite) return;
    const checklist = (e.checklist || []).map((c: Check, j: number) => (j === i ? { ...c, done: !c.done } : c));
    setList(l => l.map(x => (x.id === e.id ? { ...x, checklist } : x)));
    if (checklist.length > 0 && checklist.every((c: Check) => c.done) && !(e.checklist || []).every((c: Check) => c.done)) fireConfetti();
    const statut = autoStatut(e.type, checklist, e.statut);
    if (statut !== e.statut) { setList(l => l.map(x => (x.id === e.id ? { ...x, statut } : x))); showToast(`Statut -> ${(TYPES[e.type].statuts.find(s => s.k === statut) || { label: statut }).label}`); }
    const r = await gmWrite("gm_evenements", "PATCH", { id: e.id, checklist, statut });
    if (!r.ok) { showToast(`Erreur : ${r.error}`, "danger"); load(); }
  }
  const setLot = (i: number, p: Partial<Lot>) => setForm((f: any) => ({ ...f, lots: f.lots.map((l: Lot, j: number) => (j === i ? { ...l, ...p } : l)) }));
  const visible = list.filter(e => e.type === tab);

  return (
    <div className="page-container">
      <a className="back-link" href="/">Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">🚚 Convois · Enchères · Alertes</h1><p className="page-subtitle">Événements du Maître du Jeu</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ {T.label.replace(/s$/, "")}</button>}
      </div>
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {Object.entries(TYPES).map(([k, t]) => <Chip key={k} active={tab === k} onClick={() => setTab(k)}>{t.icon} {t.label} ({list.filter(e => e.type === k).length})</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon">{T.icon}</div><div className="empty-title">Rien pour le moment</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {visible.map(e => {
            const st = T.statuts.find(s => s.k === e.statut) || T.statuts[0];
            return (
              <div key={e.id} className="card" style={{ padding: "0.8rem 1rem", borderLeft: `3px solid ${st.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700 }}>{e.titre}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{fmtDT(e.date_event)}{e.partenaire ? ` · ${e.partenaire}` : ""}{e.montant ? ` · ${usd(e.montant)}` : ""}{e.created_by ? ` · ${e.created_by}` : ""}</div>
                  </div>
                  <Badge color={st.color}>{st.label}</Badge>
                  {canWrite && <select value={e.statut} onChange={ev => setStatut(e, ev.target.value)} style={{ maxWidth: 130 }}>{T.statuts.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}</select>}
                  <button className="btn btn-ghost btn-sm" title="PDF" onClick={() => pdfEvenement(e)}>📄</button>
                  {canWrite && <><button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(e)}>🗑️</button></>}
                </div>
                {(e.lots || []).length > 0 && (
                  <div style={{ marginTop: "0.6rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    {e.lots.map((l: Lot, i: number) => <div key={i} style={{ fontSize: "0.76rem", display: "flex", gap: "0.6rem" }}><span style={{ flex: 1 }}>🔹 {l.nom}</span><span style={{ color: "var(--text-dim)" }}>départ {usd(l.mise_depart)}</span><b>{l.mise_finale ? usd(l.mise_finale) : " - "}</b><span style={{ color: "var(--gold)" }}>{l.gagnant || ""}</span></div>)}
                  </div>
                )}
                {(e.checklist || []).length > 0 && (() => {
                  const cl: Check[] = e.checklist; const n = cl.filter(c => c.done).length; const pct = Math.round((n / cl.length) * 100);
                  return (
                    <div style={{ marginTop: "0.6rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                        <span>📋 Plan · {n}/{cl.length}</span>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: "var(--surface)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--success)" : "var(--gold)", transition: "width .4s" }} /></div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {cl.map((c, i) => <button key={i} type="button" onClick={() => toggleCheck(e, i)} style={{ cursor: canWrite ? "pointer" : "default", fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: 999, fontFamily: "'Inter',sans-serif", border: `1px solid ${c.done ? "rgba(34,197,94,.4)" : "var(--border)"}`, background: c.done ? "rgba(34,197,94,.12)" : "transparent", color: c.done ? "var(--success)" : "var(--text-muted)", textDecoration: c.done ? "line-through" : "none" }}>{c.done ? "" : "○ "}{c.t}</button>)}
                      </div>
                    </div>
                  );
                })()}
                {e.notes && <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{e.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
      {show && (
        <Modal title={`${TYPES[form.type].icon} ${editId ? "Modifier" : "Nouveau"} - ${TYPES[form.type].label}`} size="lg" onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.titre.trim()} onClick={save}>{saving ? "..." : "Enregistrer"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            <div className="form-grid">
              <div><label>Titre *</label><input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} /></div>
              <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>{TYPES[form.type].statuts.map(s => <option key={s.k} value={s.k}>{s.label}</option>)}</select></div>
              <div><label>{TYPES[form.type].partenaireLabel}</label><GroupeSelect value={form.partenaire} groupes={groupes} onChange={v => setForm({ ...form, partenaire: v })} placeholder=" -  Aucun  - " /></div>
              <div><label>Date</label><input type="datetime-local" value={form.date_event} onChange={e => setForm({ ...form, date_event: e.target.value })} /></div>
              {form.type !== "enchere" && <div><label>{TYPES[form.type].montantLabel}</label><input type="number" min={0} value={form.montant || ""} onChange={e => setForm({ ...form, montant: e.target.value })} /></div>}
            </div>
            {form.type === "enchere" && (
              <div>
                <label>Lots (le total adjugé est calculé)</label>
                {form.lots.map((l: Lot, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.35rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    <input placeholder="Lot" value={l.nom} onChange={e => setLot(i, { nom: e.target.value })} style={{ flex: 2, minWidth: 130 }} />
                    <input type="number" placeholder="Mise départ" value={l.mise_depart || ""} onChange={e => setLot(i, { mise_depart: Number(e.target.value) })} style={{ flex: 1, minWidth: 90 }} />
                    <input type="number" placeholder="Adjugé" value={l.mise_finale || ""} onChange={e => setLot(i, { mise_finale: Number(e.target.value) })} style={{ flex: 1, minWidth: 90 }} />
                    <input placeholder="Gagnant" value={l.gagnant} onChange={e => setLot(i, { gagnant: e.target.value })} style={{ flex: 1, minWidth: 100 }} />
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setForm((f: any) => ({ ...f, lots: f.lots.filter((_: any, j: number) => j !== i) }))}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f: any) => ({ ...f, lots: [...f.lots, { nom: "", mise_depart: 0, mise_finale: 0, gagnant: "" }] }))}>+ Lot</button>
              </div>
            )}
            <div>
              <label>📋 Plan de l'événement (checklist)</label>
              {(form.checklist || []).map((c: Check, i: number) => (
                <div key={i} style={{ display: "flex", gap: "0.35rem", marginBottom: "0.3rem" }}>
                  <input type="checkbox" checked={c.done} onChange={() => setForm((f: any) => ({ ...f, checklist: f.checklist.map((x: Check, j: number) => (j === i ? { ...x, done: !x.done } : x)) }))} style={{ width: 16 }} />
                  <input value={c.t} onChange={ev => setForm((f: any) => ({ ...f, checklist: f.checklist.map((x: Check, j: number) => (j === i ? { ...x, t: ev.target.value } : x)) }))} style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setForm((f: any) => ({ ...f, checklist: f.checklist.filter((_: any, j: number) => j !== i) }))}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f: any) => ({ ...f, checklist: [...(f.checklist || []), { t: "", done: false }] }))}>+ Étape</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm((f: any) => ({ ...f, checklist: [...(f.checklist || []), ...MODELES[f.type].map(t => ({ t, done: false }))] }))}>✨ Modèle {TYPES[form.type].label.toLowerCase()}</button>
              </div>
            </div>
            <div><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            {form.type === "convoi" && <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Convoi « Livré » = réputation du groupe +5 ; « Échec » = -5.</div>}
          </div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
