"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

const PRIX = { propre: 2500, sale: 3125 };
const QUOTA_MAX = 250;

interface Vente {
  id: string;
  client: string;
  organisation: string;
  type_paiement: "propre" | "sale";
  quantite: number;
  prix_unitaire: number;
  total: number;
  semaine_debut: string;
  created_by: string;
  created_at: string;
}

const EMPTY_FORM = { client: "", organisation: "", type_paiement: "propre" as "propre"|"sale", quantite: 1 };

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function formatWeekLabel(mondayISO: string): string {
  const monday = new Date(mondayISO + "T12:00:00");
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
  return `${fmt(monday)} → ${fmt(sunday)}`;
}

export default function H47Page() {
  const user = getUser();
  const currentWeek = toISODate(getMonday(new Date()));

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Vue
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const [tab, setTab] = useState<"semaine"|"historique"|"convertisseur">("semaine");

  // Convertisseur
  const [convMode, setConvMode] = useState<"paquets_vers_prix"|"prix_vers_paquets">("paquets_vers_prix");
  const [convPaquets, setConvPaquets] = useState(10);
  const [convPrix, setConvPrix] = useState(25000);
  const [convType, setConvType] = useState<"propre"|"sale">("propre");

  const [toast, setToast] = useState<string|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vente|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const { data } = await supabase.from("h47_ventes").select("*")
      .eq("created_by", user.nom).order("created_at", { ascending: false });
    setVentes(data || []);
    setLoading(false);
  }

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // Quota déjà consommé cette semaine pour une organisation donnée
  function quotaConsomme(organisation: string, semaine: string): number {
    return ventes
      .filter(v => v.organisation.toLowerCase() === organisation.toLowerCase() && v.semaine_debut === semaine)
      .reduce((s, v) => s + v.quantite, 0);
  }

  const quotaRestantPourForm = form.organisation.trim()
    ? QUOTA_MAX - quotaConsomme(form.organisation.trim(), currentWeek)
    : QUOTA_MAX;

  async function save() {
    if (!supabase || !user) return;
    if (!form.client.trim() || !form.organisation.trim() || form.quantite <= 0) {
      setSaveError("Client, organisation et quantité sont obligatoires.");
      return;
    }
    const dejaConsomme = quotaConsomme(form.organisation.trim(), currentWeek);
    if (dejaConsomme + form.quantite > QUOTA_MAX) {
      setSaveError(`Quota dépassé : ${form.organisation.trim()} a déjà ${dejaConsomme}/${QUOTA_MAX} cette semaine. Il reste ${QUOTA_MAX - dejaConsomme} unité${QUOTA_MAX - dejaConsomme !== 1 ? "s" : ""}.`);
      return;
    }

    setSaving(true);
    setSaveError("");
    const prixUnitaire = PRIX[form.type_paiement];
    const total = prixUnitaire * form.quantite;

    const { error } = await supabase.from("h47_ventes").insert([{
      client: form.client.trim(),
      organisation: form.organisation.trim(),
      type_paiement: form.type_paiement,
      quantite: form.quantite,
      prix_unitaire: prixUnitaire,
      total,
      semaine_debut: currentWeek,
      created_by: user.nom,
    }]);

    if (error) {
      setSaveError("Erreur : " + error.message);
    } else {
      showT("Vente enregistrée ✓");
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
      load();
    }
    setSaving(false);
  }

  async function doDelete() {
    if (!supabase || !confirmDelete) return;
    await supabase.from("h47_ventes").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showT("Entrée supprimée");
    load();
  }

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style:"currency", currency:"USD", maximumFractionDigits:0 });

  // Semaines disponibles (celles où il y a au moins une vente, + la semaine courante toujours dispo)
  const semainesDisponibles = Array.from(new Set([currentWeek, ...ventes.map(v=>v.semaine_debut)])).sort().reverse();

  // Ventes filtrées sur la semaine affichée
  const ventesSemaine = ventes.filter(v => v.semaine_debut === viewWeek);

  // Regroupement par organisation pour la semaine affichée
  const parOrganisation = Array.from(new Set(ventesSemaine.map(v=>v.organisation))).map(org => {
    const vOrg = ventesSemaine.filter(v=>v.organisation===org);
    const qPropre = vOrg.filter(v=>v.type_paiement==="propre").reduce((s,v)=>s+v.quantite,0);
    const qSale = vOrg.filter(v=>v.type_paiement==="sale").reduce((s,v)=>s+v.quantite,0);
    const totalQ = qPropre + qSale;
    const totalPropre = vOrg.filter(v=>v.type_paiement==="propre").reduce((s,v)=>s+v.total,0);
    const totalSale = vOrg.filter(v=>v.type_paiement==="sale").reduce((s,v)=>s+v.total,0);
    return { organisation: org, qPropre, qSale, totalQ, totalPropre, totalSale, totalGeneral: totalPropre+totalSale, clients: new Set(vOrg.map(v=>v.client)).size };
  }).sort((a,b) => b.totalQ - a.totalQ);

  // Totaux globaux semaine affichée
  const totalSemaineQ = ventesSemaine.reduce((s,v)=>s+v.quantite,0);
  const totalSemaineMontant = ventesSemaine.reduce((s,v)=>s+v.total,0);

  // Convertisseur calculs
  const convResultPrix = convPaquets * PRIX[convType];
  const convResultPaquets = Math.floor(convPrix / PRIX[convType]);
  const convResultReste = convPrix - (convResultPaquets * PRIX[convType]);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">H-47 — Suivi des ventes</h1>
          <p className="page-subtitle">Quotas hebdomadaires par organisation · 250 u/semaine max</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({ ...EMPTY_FORM }); setSaveError(""); setShowForm(true); }}>
          + Nouvelle vente
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {[["semaine","📅 Semaine en cours"],["historique","🗂 Historique"],["convertisseur","🔄 Convertisseur"]].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k as any); if (k==="semaine") setViewWeek(currentWeek); }} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight: tab===k?700:400,
            background: tab===k?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${tab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,
            color: tab===k?"var(--gold)":"var(--text-muted)", transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {(tab === "semaine" || tab === "historique") && (
        <>
          {/* Sélecteur de semaine pour historique */}
          {tab === "historique" && (
            <div className="form-group" style={{ marginBottom:"1.25rem", maxWidth:280 }}>
              <label>Semaine</label>
              <select value={viewWeek} onChange={e => setViewWeek(e.target.value)}>
                {semainesDisponibles.map(s => (
                  <option key={s} value={s}>
                    {formatWeekLabel(s)} {s === currentWeek ? "(en cours)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tab === "semaine" && (
            <div style={{ fontSize:"0.85rem", color:"var(--text-muted)", marginBottom:"1.25rem" }}>
              Semaine du <strong style={{ color:"var(--gold)" }}>{formatWeekLabel(currentWeek)}</strong>
            </div>
          )}

          {/* Stats globales */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ color:"var(--gold)" }}>📦</div>
              <div className="stat-value">{totalSemaineQ}</div>
              <div className="stat-label">Unités vendues</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color:"var(--gold)" }}>💰</div>
              <div className="stat-value" style={{ fontSize:"1.4rem" }}>{fmt(totalSemaineMontant)}</div>
              <div className="stat-label">Total encaissé</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color:"var(--info)" }}>🏢</div>
              <div className="stat-value">{parOrganisation.length}</div>
              <div className="stat-label">Organisations actives</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color:"var(--success)" }}>🧾</div>
              <div className="stat-value">{ventesSemaine.length}</div>
              <div className="stat-label">Transactions</div>
            </div>
          </div>

          {/* Liste par organisation avec quotas */}
          <div style={{ marginTop:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Quotas par organisation</div>

            {loading ? (
              <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">Chargement…</div></div>
            ) : parOrganisation.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <div className="empty-title">Aucune vente cette semaine</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                {parOrganisation.map(org => {
                  const pct = Math.min(100, (org.totalQ / QUOTA_MAX) * 100);
                  const isFull = org.totalQ >= QUOTA_MAX;
                  const isNear = org.totalQ >= QUOTA_MAX * 0.8;
                  return (
                    <div key={org.organisation} className="card">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem", flexWrap:"wrap", gap:"0.5rem" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:"1rem" }}>{org.organisation}</div>
                          <div style={{ fontSize:"0.75rem", color:"var(--text-dim)" }}>{org.clients} client{org.clients!==1?"s":""}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.2rem", color:"var(--gold)" }}>
                            {fmt(org.totalGeneral)}
                          </div>
                          <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>
                            {org.qPropre>0 && <span>🟢 {org.qPropre}u propre</span>}
                            {org.qPropre>0 && org.qSale>0 && " · "}
                            {org.qSale>0 && <span>🔴 {org.qSale}u sale</span>}
                          </div>
                        </div>
                      </div>

                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>
                        <span>Quota utilisé</span>
                        <span style={{ fontWeight:700, color: isFull?"var(--danger)":isNear?"var(--warning)":"var(--text-muted)" }}>
                          {org.totalQ}/{QUOTA_MAX}
                        </span>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{
                          width:`${pct}%`,
                          background: isFull ? "var(--danger)" : isNear ? "var(--warning)" : "linear-gradient(90deg, var(--gold), var(--gold-dark))",
                        }} />
                      </div>
                      {isFull && (
                        <div style={{ fontSize:"0.72rem", color:"var(--danger)", marginTop:"0.4rem" }}>⚠ Quota atteint pour cette semaine</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Détail des transactions */}
          {ventesSemaine.length > 0 && (
            <div style={{ marginTop:"1.75rem" }}>
              <div className="section-title" style={{ marginBottom:"1rem" }}>Détail des transactions</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Client</th><th>Organisation</th><th>Type</th>
                      <th>Qté</th><th>Prix/u</th><th>Total</th><th>Date</th>
                      <th style={{ textAlign:"right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventesSemaine.map(v => (
                      <tr key={v.id}>
                        <td style={{ fontWeight:500 }}>{v.client}</td>
                        <td>{v.organisation}</td>
                        <td>
                          <span className={`badge ${v.type_paiement==="propre"?"badge-success":"badge-danger"}`}>
                            {v.type_paiement === "propre" ? "🟢 Propre" : "🔴 Sale"}
                          </span>
                        </td>
                        <td>{v.quantite}</td>
                        <td>{fmt(v.prix_unitaire)}</td>
                        <td style={{ color:"var(--gold)", fontWeight:600 }}>{fmt(v.total)}</td>
                        <td style={{ fontSize:"0.78rem", color:"var(--text-dim)" }}>
                          {new Date(v.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" })}
                        </td>
                        <td>
                          <div style={{ display:"flex", justifyContent:"flex-end" }}>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(v)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "convertisseur" && (
        <div className="card" style={{ maxWidth:560 }}>
          <div className="section-title" style={{ marginBottom:"1.25rem" }}>Convertisseur H-47</div>

          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem" }}>
            {[["propre","🟢 Propre — 2 500$/u"],["sale","🔴 Sale — 3 125$/u"]].map(([k,l]) => (
              <button key={k} onClick={() => setConvType(k as any)} style={{
                flex:1, padding:"0.6rem", borderRadius:"var(--radius)", cursor:"pointer",
                fontFamily:"'Inter',sans-serif", fontSize:"0.82rem", fontWeight: convType===k?700:400,
                background: convType===k ? (k==="propre"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)") : "var(--surface)",
                border:`1px solid ${convType===k ? (k==="propre"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)") : "var(--border)"}`,
                color: convType===k ? (k==="propre"?"var(--success)":"var(--danger)") : "var(--text-muted)",
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
            {[["paquets_vers_prix","Paquets → Prix"],["prix_vers_paquets","Prix → Paquets"]].map(([k,l]) => (
              <button key={k} onClick={() => setConvMode(k as any)} style={{
                flex:1, padding:"0.5rem", borderRadius:"var(--radius)", cursor:"pointer",
                fontFamily:"'Inter',sans-serif", fontSize:"0.78rem", fontWeight: convMode===k?700:400,
                background: convMode===k?"var(--gold-muted)":"var(--surface)",
                border:`1px solid ${convMode===k?"rgba(201,168,76,0.4)":"var(--border)"}`,
                color: convMode===k?"var(--gold)":"var(--text-dim)",
              }}>{l}</button>
            ))}
          </div>

          {convMode === "paquets_vers_prix" ? (
            <>
              <div className="form-group" style={{ marginBottom:"1.25rem" }}>
                <label>Nombre de paquets</label>
                <input type="number" min={1} value={convPaquets} onChange={e => setConvPaquets(Math.max(1, Number(e.target.value)||1))} />
              </div>
              <div style={{
                background:"var(--gold-muted)", border:"1px solid rgba(201,168,76,0.3)",
                borderRadius:"var(--radius)", padding:"1.25rem", textAlign:"center",
              }}>
                <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginBottom:"0.4rem" }}>
                  {convPaquets} paquet{convPaquets>1?"s":""} {convType==="propre"?"en propre":"en sale"}
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"2rem", color:"var(--gold)" }}>
                  {fmt(convResultPrix)}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom:"1.25rem" }}>
                <label>Montant disponible ($)</label>
                <input type="number" min={0} value={convPrix} onChange={e => setConvPrix(Math.max(0, Number(e.target.value)||0))} />
              </div>
              <div style={{
                background:"var(--gold-muted)", border:"1px solid rgba(201,168,76,0.3)",
                borderRadius:"var(--radius)", padding:"1.25rem", textAlign:"center",
              }}>
                <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginBottom:"0.4rem" }}>
                  Avec {fmt(convPrix)} {convType==="propre"?"en propre":"en sale"}
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"2rem", color:"var(--gold)" }}>
                  {convResultPaquets} paquet{convResultPaquets!==1?"s":""}
                </div>
                {convResultReste > 0 && (
                  <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.4rem" }}>
                    + {fmt(convResultReste)} restant (insuffisant pour un paquet de plus)
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ marginTop:"1.25rem", fontSize:"0.72rem", color:"var(--text-dim)", textAlign:"center" }}>
            Tarifs : 2 500$/u en propre · 3 125$/u en sale · Quota 250u/semaine/organisation
          </div>
        </div>
      )}

      {/* Modal nouvelle vente */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouvelle vente H-47</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Client *</label>
                  <input placeholder="Nom RP" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label>Organisation *</label>
                  <input placeholder="Nom du gang / groupe" value={form.organisation} onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label>Type de paiement</label>
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  {[["propre","🟢 Propre — 2 500$/u"],["sale","🔴 Sale — 3 125$/u"]].map(([k,l]) => (
                    <button key={k} onClick={() => setForm(f => ({ ...f, type_paiement: k as any }))} style={{
                      flex:1, padding:"0.6rem", borderRadius:"var(--radius)", cursor:"pointer",
                      fontFamily:"'Inter',sans-serif", fontSize:"0.8rem", fontWeight: form.type_paiement===k?700:400,
                      background: form.type_paiement===k ? (k==="propre"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)") : "var(--surface)",
                      border:`1px solid ${form.type_paiement===k ? (k==="propre"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)") : "var(--border)"}`,
                      color: form.type_paiement===k ? (k==="propre"?"var(--success)":"var(--danger)") : "var(--text-muted)",
                    }}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Quantité (unités)</label>
                <input type="number" min={1} value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: Math.max(1, Number(e.target.value)||1) }))} />
              </div>

              {form.organisation.trim() && (
                <div style={{
                  background: quotaRestantPourForm - form.quantite < 0 ? "rgba(239,68,68,0.08)" : "var(--surface)",
                  border: `1px solid ${quotaRestantPourForm - form.quantite < 0 ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
                  borderRadius:"var(--radius)", padding:"0.75rem 1rem", fontSize:"0.8rem",
                }}>
                  Quota restant pour <strong>{form.organisation.trim()}</strong> cette semaine : {" "}
                  <strong style={{ color: quotaRestantPourForm < 50 ? "var(--warning)" : "var(--text)" }}>
                    {quotaRestantPourForm}/{QUOTA_MAX}
                  </strong>
                </div>
              )}

              <div style={{
                background:"var(--gold-muted)", border:"1px solid rgba(201,168,76,0.3)",
                borderRadius:"var(--radius)", padding:"0.875rem 1rem",
                display:"flex", justifyContent:"space-between", alignItems:"center",
              }}>
                <span style={{ fontSize:"0.82rem", color:"var(--text-muted)" }}>Total à payer</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.2rem", color:"var(--gold)" }}>
                  {fmt(PRIX[form.type_paiement] * form.quantite)}
                </span>
              </div>

              {saveError && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:"var(--radius)", padding:"0.75rem", fontSize:"0.84rem", color:"var(--danger)" }}>
                  ⚠️ {saveError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving} style={{ opacity: saving?0.7:1 }}>
                {saving ? "Enregistrement…" : "Enregistrer la vente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette vente ?</div>
            <div className="confirm-msg">
              {confirmDelete.client} — {confirmDelete.quantite}u {confirmDelete.type_paiement} — {fmt(confirmDelete.total)}
            </div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">✅ {toast}</div>
        </div>
      )}
    </div>
  );
}
