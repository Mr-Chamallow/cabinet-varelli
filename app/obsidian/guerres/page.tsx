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
import { useGmAccess, useGroupes, GroupeSelect, Badge, Chip } from "@/components/gm/bits";
import { TREVE_JOURS, COOLDOWN_ZONE_JOURS, COOLDOWN_BUSINESS_JOURS, addDays, joursRestants } from "@/lib/regles";

const TYPES = ["GDT", "Guerre ouverte", "Conflit"];
const ISSUES: Record<string, string> = { victoire: "🏆 Victoire", defaite: "💀 Défaite", reddition: "🏳️ Reddition", nulle: "🤝 Nulle" };
const PERTES: Record<string, string> = { aucune: "Aucune", zone: "Perte d'une zone", business: "Perte d'un business" };
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { adversaire: "", type: "GDT", enjeu: "", date_debut: today(), date_fin: "", statut: "en_cours", issue: "", perte: "aucune", notes: "" };

// Dates derivees (reglement) : treve apres reddition, cooldown apres perte.
function derives(g: any) {
  if (g.statut !== "terminee" || !g.date_fin) return [];
  const out: { label: string; fin: Date }[] = [];
  if (g.issue === "reddition") out.push({ label: "Trêve", fin: addDays(g.date_fin, TREVE_JOURS) });
  if (g.perte === "zone") out.push({ label: "Cooldown zone", fin: addDays(g.date_fin, COOLDOWN_ZONE_JOURS) });
  if (g.perte === "business") out.push({ label: "Cooldown business", fin: addDays(g.date_fin, COOLDOWN_BUSINESS_JOURS) });
  return out.map(o => ({ ...o, j: joursRestants(o.fin) })).filter((o: any) => o.j > 0) as any;
}

export default function GuerresPage() {
  const { canWrite, user } = useGmAccess("obsidian_guerres");
  const { toast, showToast } = useToast();
  const groupes = useGroupes();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [filtre, setFiltre] = useState("tout");

  useEffect(() => { load(); }, []);
  useRealtimeTable("obsidian_guerres", load);
  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("obsidian_guerres").select("*").order("date_debut", { ascending: false });
    setList(data || []); setLoading(false);
  }
  const enCours = list.filter(g => g.statut === "en_cours");
  const visibles = list.filter(g => filtre === "tout" || g.statut === filtre);

  function openNew() { setEditId(null); setForm({ ...EMPTY, date_debut: today() }); setShow(true); }
  function openEdit(g: any) { setEditId(g.id); setForm({ ...EMPTY, ...g, enjeu: g.enjeu || "", date_fin: g.date_fin || "", issue: g.issue || "", perte: g.perte || "aucune", notes: g.notes || "" }); setShow(true); }
  async function save() {
    if (!form.adversaire.trim()) return;
    setSaving(true);
    const g = groupes.find(x => x.nom === form.adversaire);
    const terminee = form.statut === "terminee";
    const row = { adversaire: form.adversaire.trim(), groupe_id: g?.id || null, type: form.type, enjeu: form.enjeu.trim() || null, date_debut: form.date_debut || today(), date_fin: terminee ? (form.date_fin || today()) : null, statut: form.statut, issue: terminee ? (form.issue || null) : null, perte: terminee ? form.perte : "aucune", notes: form.notes.trim() || null, created_by: (user as any)?.nom || null };
    const r = editId ? await dbw.update("obsidian_guerres", editId, row) : await dbw.insert("obsidian_guerres", row);
    setSaving(false);
    if (r.error) { showToast(`Erreur : ${r.error.message}`, "danger"); return; }
    setShow(false); showToast(editId ? "Guerre modifiée" : "Guerre ouverte"); load();
  }
  async function del(g: any) {
    if (!window.confirm(`Supprimer la guerre contre ${g.adversaire} ?`)) return;
    const r = await dbw.remove("obsidian_guerres", g.id);
    if (r.error) showToast(`Erreur : ${r.error.message}`, "danger"); else { showToast("Supprimée"); load(); }
  }

  return (
    <div className="page-container">
      <Link className="back-link" href="/">Dashboard</Link>
      <div className="page-header">
        <div><h1 className="page-title">⚔️ Guerres & GDT</h1><p className="page-subtitle">Conflits · Trêves · Cooldowns</p><div className="gold-line" /></div>
        {canWrite && <button className="btn btn-gold" onClick={openNew}>+ Nouvelle guerre</button>}
      </div>
      {enCours.length > 0 && (
        <div className="card" style={{ padding: "0.7rem 1rem", marginBottom: "1rem", borderLeft: "3px solid var(--danger)", fontSize: "0.8rem" }}>
          🚨 <b>{enCours.length} conflit{enCours.length > 1 ? "s" : ""} en cours.</b> Pendant une guerre : <b>pas de recrutement</b> (pas de F7), <b>pas de taxe</b>.
        </div>
      )}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
        {[["tout", "Toutes"], ["en_cours", "En cours"], ["terminee", "Terminées"]].map(([k, l]) => <Chip key={k} active={filtre === k} onClick={() => setFiltre(k)}>{l}</Chip>)}
      </div>
      {loading ? <LoadingBlock /> : visibles.length === 0 ? <div className="empty-state"><div className="empty-icon">⚔️</div><div className="empty-title">Aucune guerre enregistrée</div></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {visibles.map(g => {
            const d: any[] = derives(g); const col = g.statut === "en_cours" ? "var(--danger)" : "var(--text-dim)";
            return (
              <div key={g.id} className="card" style={{ padding: "0.8rem 1rem", borderLeft: `3px solid ${col}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700 }}>{g.adversaire} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {g.type}</span></div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      Début {new Date(g.date_debut).toLocaleDateString("fr-FR")}{g.date_fin ? ` · fin ${new Date(g.date_fin).toLocaleDateString("fr-FR")}` : ""}{g.enjeu ? ` · ${g.enjeu}` : ""}
                    </div>
                  </div>
                  <Badge color={col}>{g.statut === "en_cours" ? "En cours" : (ISSUES[g.issue] || "Terminée")}</Badge>
                  {d.map(x => <Badge key={x.label} color="var(--warning)">{x.label} : {x.j} j</Badge>)}
                  {g.perte && g.perte !== "aucune" && <Badge color="var(--danger)">{PERTES[g.perte]}</Badge>}
                  {canWrite && <><button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}>✏️</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => del(g)}>🗑️</button></>}
                </div>
                {g.notes && <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{g.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
      <div className="card" style={{ padding: "0.8rem 1rem", marginTop: "1.2rem", fontSize: "0.76rem", color: "var(--text-muted)" }}>
        <b>Rappels du règlement (organisation)</b><br />
        Armes en guerre : 3 lourdes, 2 pistolets mitrailleurs, armes de poing et légères illimitées · UMP ou fusil lourd : 1 seul par guerre, 100 munitions max · 2 armes portées max.<br />
        Véhicules : 5 + 1 moto (guerre ouverte), convoi 6 + 1 moto · pas de gros CVC · drive-by interdit en direct aux organisations.<br />
        Otages : rançon jusqu'à 50.000 $ pour un lead, 30.000 $ pour un membre · reddition = rendez-vous en jeu puis trêve de {TREVE_JOURS} jours.<br />
        Cooldowns : {COOLDOWN_ZONE_JOURS} jours après perte d'une zone, {COOLDOWN_BUSINESS_JOURS} jours après perte d'un business.
      </div>
      {show && (
        <Modal title={editId ? "Modifier la guerre" : "Nouvelle guerre"} size="lg" onClose={() => setShow(false)}
          footer={<><button className="btn btn-outline" onClick={() => setShow(false)}>Annuler</button><button className="btn btn-gold" disabled={saving || !form.adversaire.trim()} onClick={save}>{saving ? "..." : "Enregistrer"}</button></>}>
          <div style={{ maxHeight: "62vh", overflowY: "auto" }}>
            <div className="form-grid">
              <div><label>Adversaire *</label><GroupeSelect value={form.adversaire} groupes={groupes} onChange={v => setForm({ ...form, adversaire: v })} /></div>
              <div><label>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label>Enjeu</label><input value={form.enjeu} onChange={e => setForm({ ...form, enjeu: e.target.value })} placeholder="Zone, point de récolte..." /></div>
              <div><label>Début</label><input type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} /></div>
              <div><label>Statut</label><select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}><option value="en_cours">En cours</option><option value="terminee">Terminée</option></select></div>
              {form.statut === "terminee" && <>
                <div><label>Fin</label><input type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} /></div>
                <div><label>Issue</label><select value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })}><option value="">-</option>{Object.entries(ISSUES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                <div><label>Perte</label><select value={form.perte} onChange={e => setForm({ ...form, perte: e.target.value })}>{Object.entries(PERTES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              </>}
            </div>
            <div><label>Notes</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Une reddition lance une trêve de {TREVE_JOURS} jours ; une perte de zone {COOLDOWN_ZONE_JOURS} jours de cooldown, de business {COOLDOWN_BUSINESS_JOURS} jours.</div>
          </div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
