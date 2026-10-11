"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { dbw } from "@/lib/dbw";
import { money } from "@/lib/money";
import { useGmAccess, useGroupes, GroupeSelect, Badge, Chip } from "@/components/gm/bits";
import { TAXE_REVENTE_MAX_PCT, TAXE_RECOLTE_MAX_SEMAINE, addDays } from "@/lib/regles";

const TYPES: Record<string, string> = { vente: "Point de vente", recolte: "Point de récolte", autre: "Autre" };
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { groupe: "", groupe_id: null as string | null, raison: "", type: "vente", taux_pct: "" as any, montant: "" as any, periodicite_jours: 7, date_debut: today(), duree_jours: 30, type_argent: "propre", statut: "actif", notes: "" };

export default function TaxesPage() {
  const { canWrite, user } = useGmAccess("obsidian_taxes");
  const { toast, showToast } = useToast();
  const groupes = useGroupes();
  const [taxes, setTaxes] = useState<any[]>([]);
  const [pays, setPays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [payFor, setPayFor] = useState<any>(null);
  const [pay, setPay] = useState({ montant: "" as any, type_argent: "propre", note: "" });
  const [filtre, setFiltre] = useState("actif");

  useEffect(() => { load(); }, []);
  useRealtimeTable(["obsidian_taxes", "obsidian_taxes_paiements"], load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from("obsidian_taxes").select("*").order("created_at", { ascending: false }),
      supabase.from("obsidian_taxes_paiements").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    setTaxes(t || []); setPays(p || []); setLoading(false);
  }

  const payeDe = (id: string) => pays.filter(p => p.taxe_id === id).reduce((s, p) => s + Number(p.montant || 0), 0);
  const info = (t: any) => {
    const fin = addDays(t.date_debut, Number(t.duree_jours) || 0);
    const jours = Math.ceil((fin.getTime() - Date.now()) / 86400_000);
    const periodes = Math.max(1, Math.ceil((Number(t.duree_jours) || 1) / (Number(t.periodicite_jours) || 7)));
    const du = periodes * Number(t.montant || 0);
    const paye = payeDe(t.id);
    return { fin, jours, periodes, du, paye, reste: Math.max(0, du - paye), expire: jours < 0 };
  };
  const visibles = taxes.filter(t => filtre === "tout" || (filtre === "actif" ? t.statut === "actif" : t.statut !== "actif"));
  const totalPaye = pays.reduce((s, p) => s + Number(p.montant || 0), 0);
  const semaine = pays.filter(p => Date.now() - new Date(p.created_at).getTime() <= 7 * 86400_000).reduce((s, p) => s + Number(p.montant || 0), 0);
  const enAttente = useMemo(() => taxes.filter(t => t.statut === "actif").reduce((s, t) => s + info(t).reste, 0), [taxes, pays]);

  function alertes(f: any): string[] {
    const a: string[] = [];
    if (f.type === "vente" && Number(f.taux_pct) > TAXE_REVENTE_MAX_PCT) a.push(`Le règlement plafonne la taxe drogue à ${TAXE_REVENTE_MAX_PCT}% du prix de revente.`);
    if (f.type === "recolte") {
      const sem = (Number(f.montant) || 0) / Math.max(1, Number(f.periodicite_jours) || 7) * 7;
      if (sem > TAXE_RECOLTE_MAX_SEMAINE) a.push(`Taxe de revendication d'un point de récolte plafonnée à ${TAXE_RECOLTE_MAX_SEMAINE.toLocaleString("fr-FR")} $ par semaine (ici ${Math.round(sem).toLocaleString("fr-FR")} $).`);
    }
    return a;
  }

  function openNew() { setEditId(null); setForm({ ...EMPTY, date_debut: today() }); setShow(true); }
  function openEdit(t: any) { setEditId(t.id); setForm({ ...EMPTY, ...t, taux_pct: t.taux_pct ?? "", notes: t.notes || "" }); setShow(true); }
  async function save() {
    if (!form.groupe.trim()) return;
    setSaving(true);
    const g = groupes.find(x => x.nom === form.groupe);
    const row = { groupe: form.groupe.trim(), groupe_id: g?.id || null, raison: form.raison.trim(), type: form.type, taux_pct: form.taux_pct === "" ? null : Number(form.taux_pct), montant: Number(form.montant) || 0, periodicite_jours: Math.max(1, Number(form.periodicite_jours) || 7), date_debut: form.date_debut || today(), duree_jours: Math.max(1, Number(form.duree_jours) || 30), type_argent: form.type_argent, statut: form.statut, notes: form.notes.trim() || null, created_by: (user as any)?.nom || null };
    const r = editId ? await dbw.update("obsidian_taxes", editId, row) : await dbw.insert("obsidian_taxes", row);
    setSaving(false);
    if (r.error) { showToast(`Erreur : ${r.error.message}`, "danger"); return; }
    setShow(false); showToast(editId ? "Taxe modifiée" : "Taxe créée"); load();
  }
  async function del(t: any) {
    if (!window.confirm(`Supprimer la taxe « ${t.groupe} » et ses paiements (retirés aussi de la compta) ?`)) return;
    for (const p of pays.filter(x => x.taxe_id === t.id)) await fetch("/api/obsidian/taxes/paiement", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    const r = await dbw.remove("obsidian_taxes", t.id);
    if (r.error) showToast(`Erreur : ${r.error.message}`, "danger"); else { showToast("Supprimée"); load(); }
  }
  async function encaisser() {
    if (!payFor) return;
    setSaving(true);
    const res = await fetch("/api/obsidian/taxes/paiement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taxe_id: payFor.id, ...pay }) });
    const out = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); return; }
    setPayFor(null); showToast("Paiement enregistré (recette en compta)"); load();
  }
  async function delPay(id: string) {
    const res = await fetch("/api/obsidian/taxes/paiement", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(`Erreur : ${out?.error || res.status}`, "danger"); return; }
    showToast("Paiement supprimé (retiré de la compta)"); load();
  }

  return (
    <div className="page-container">
      <Link className="back-link" href="/">Dashboard</Link>
      <div className="page-header">
        <div><h1 className="page-title">💸 Taxes</h1><p className="page-subtitle">Accords avec les groupes · Paiements · Durée</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouvelle taxe</button>}
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Encaissé (total)</div><div className="stat-value" style={{ color: "var(--success)", fontSize: "1.4rem" }}>{money(totalPaye)}</div></div>
        <div className="stat-card"><div className="stat-label">7 derniers jours</div><div className="stat-value" style={{ fontSize: "1.4rem" }}>{money(semaine)}</div></div>
        <div className="stat-card"><div className="stat-label">Reste à encaisser</div><div className="stat-value" style={{ color: "var(--warning)", fontSize: "1.4rem" }}>{money(enAttente)}</div></div>
        <div className="stat-card"><div className="stat-label">Taxes actives</div><div className="stat-value" style={{ fontSize: "1.4rem" }}>{taxes.filter(t => t.statut === "actif").length}</div></div>
      </div>
      <div style={{ display: "flex", gap: "0.4rem", margin: "0.5rem 0 1rem" }}>
        {[["actif", "Actives"], ["autre", "Terminées / suspendues"], ["tout", "Toutes"]].map(([k, l]) => <Chip key={k} active={filtre === k} onClick={() => setFiltre(k)}>{l}</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visibles.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">Aucune taxe</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {visibles.map(t => {
            const i = info(t); const mine = pays.filter(p => p.taxe_id === t.id);
            const col = t.statut !== "actif" ? "var(--text-dim)" : i.expire ? "var(--danger)" : "var(--gold)";
            return (
              <div key={t.id} className="card" style={{ padding: "0.8rem 1rem", borderLeft: `3px solid ${col}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700 }}>{t.groupe} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {TYPES[t.type] || t.type}</span></div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{t.raison || "Sans raison précisée"}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: 2 }}>
                      {money(Number(t.montant))} / {t.periodicite_jours} j{t.taux_pct != null ? ` · ${t.taux_pct}% du prix de revente` : ""} · du {new Date(t.date_debut).toLocaleDateString("fr-FR")} au {i.fin.toLocaleDateString("fr-FR")} ({t.duree_jours} j) · {t.type_argent === "sale" ? "🕶️ sale" : "💵 propre"}
                    </div>
                  </div>
                  <Badge color={col}>{t.statut !== "actif" ? t.statut : i.expire ? "Durée dépassée" : `${i.jours} j restants`}</Badge>
                  <div style={{ textAlign: "right", fontSize: "0.75rem" }}>
                    <div>Payé <b style={{ color: "var(--success)" }}>{money(i.paye)}</b> / {money(i.du)}</div>
                    <div style={{ color: "var(--text-dim)" }}>reste {money(i.reste)}</div>
                  </div>
                  {canWrite && <button className="btn btn-outline btn-sm" onClick={() => { setPayFor(t); setPay({ montant: t.montant || "", type_argent: t.type_argent || "propre", note: "" }); }}>💰 Encaisser</button>}
                  {canWrite && <><button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(t)}>🗑️</button></>}
                </div>
                {mine.length > 0 && (
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    {mine.slice(0, 8).map(p => (
                      <span key={p.id} style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)" }}>
                        {new Date(p.created_at).toLocaleDateString("fr-FR")} · {money(Number(p.montant))}
                        {canWrite && <button type="button" onClick={() => delPay(p.id)} style={{ marginLeft: 6, background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>✕</button>}
                      </span>
                    ))}
                  </div>
                )}
                {t.notes && <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{t.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {show && (
        <Modal title={editId ? "Modifier la taxe" : "Nouvelle taxe"} size="lg" onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.groupe.trim()} onClick={save}>{saving ? "..." : "Enregistrer"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            <div className="form-grid">
              <div><label>Groupe *</label><GroupeSelect value={form.groupe} groupes={groupes} onChange={v => setForm({ ...form, groupe: v })} /></div>
              <div><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div style={{ gridColumn: "1 / -1" }}><label>Raison</label><input value={form.raison} onChange={e => setForm({ ...form, raison: e.target.value })} placeholder="Ex : zone de vente Grove Street, point de récolte Cocaïne..." /></div>
              <div><label>Taux (% du prix de revente)</label><input type="number" min={0} value={form.taux_pct} onChange={e => setForm({ ...form, taux_pct: e.target.value })} placeholder="20 à 30" /></div>
              <div><label>Prix payé par période ($)</label><input type="number" min={0} value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} /></div>
              <div><label>Période (jours)</label><input type="number" min={1} value={form.periodicite_jours} onChange={e => setForm({ ...form, periodicite_jours: e.target.value })} /></div>
              <div><label>Durée de l'accord (jours)</label><input type="number" min={1} value={form.duree_jours} onChange={e => setForm({ ...form, duree_jours: e.target.value })} /></div>
              <div><label>Début</label><input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} /></div>
              <div><label>Argent</label><select value={form.type_argent} onChange={e => setForm({ ...form, type_argent: e.target.value })}><option value="propre">💵 Propre</option><option value="sale">🕶️ Sale</option></select></div>
              <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}><option value="actif">Actif</option><option value="termine">Terminé</option><option value="suspendu">Suspendu</option></select></div>
            </div>
            <div><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            {alertes(form).map((a, i) => <div key={i} style={{ fontSize: "0.8rem", color: "var(--warning)", marginTop: "0.5rem" }}>⚠️ {a} Tu peux enregistrer quand même.</div>)}
          </div>
        </Modal>
      )}
      {payFor && (
        <Modal title={`💰 Encaisser - ${payFor.groupe}`} onClose={() => setPayFor(null)}
          footer={<><button className="btn btn-outline" onClick={() => setPayFor(null)}>Annuler</button><button className="btn btn-gold" disabled={saving || !Number(pay.montant)} onClick={encaisser}>{saving ? "..." : "Enregistrer"}</button></>}>
          <div className="form-grid">
            <div><label>Montant ($)</label><input type="number" min={0} value={pay.montant} onChange={e => setPay({ ...pay, montant: e.target.value })} /></div>
            <div><label>Argent</label><select value={pay.type_argent} onChange={e => setPay({ ...pay, type_argent: e.target.value })}><option value="propre">💵 Propre</option><option value="sale">🕶️ Sale</option></select></div>
          </div>
          <div><label>Note</label><input value={pay.note} onChange={e => setPay({ ...pay, note: e.target.value })} placeholder="Optionnel" /></div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Ajoute automatiquement une recette « Taxe » en comptabilité.</div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
