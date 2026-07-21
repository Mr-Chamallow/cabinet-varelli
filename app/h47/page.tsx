"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canAccess } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const QUOTA_MAX_DEFAULT = 250;

interface Config {
  id: string;
  nom_produit: string;
  prix_propre: number;
  prix_sale: number;
  quota_max: number;
}

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
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const currentWeek = toISODate(getMonday(new Date()));

  const [authorized, setAuthorized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [config, setConfig] = useState<Config | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const PRIX = config ? { propre: config.prix_propre, sale: config.prix_sale } : { propre: 2500, sale: 3125 };
  const QUOTA_MAX = config?.quota_max ?? QUOTA_MAX_DEFAULT;
  const NOM_PRODUIT = config?.nom_produit || "H-47";

  // Édition config
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [configForm, setConfigForm] = useState({ nom_produit: "H-47", prix_propre: 2500, prix_sale: 3125, quota_max: 250 });
  const [savingConfig, setSavingConfig] = useState(false);

  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Vue
  const [viewWeek, setViewWeek] = useState(currentWeek);
  const [tab, setTab] = useState<"semaine"|"historique"|"convertisseur"|"config">("semaine");

  // Convertisseur
  const [convMode, setConvMode] = useState<"paquets_vers_prix"|"prix_vers_paquets">("paquets_vers_prix");
  const [convPaquets, setConvPaquets] = useState(10);
  const [convPrix, setConvPrix] = useState(25000);
  const [convType, setConvType] = useState<"propre"|"sale">("propre");

  const [toast, setToast] = useState<string|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Vente|null>(null);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!canAccess(user.role, "h47")) { setAuthorized(false); setAuthChecked(true); setLoading(false); return; }
    setAuthorized(true);
    setAuthChecked(true);
    load();
    loadConfig();
  }, []);

  async function loadConfig() {
    if (!supabase) { setConfigLoaded(true); return; }
    const { data, error } = await supabase.from("h47_config").select("*").limit(1).maybeSingle();
    if (data) {
      setConfig(data);
      setConfigForm({ nom_produit: data.nom_produit, prix_propre: data.prix_propre, prix_sale: data.prix_sale, quota_max: data.quota_max });
    } else if (!data && !error) {
      // Aucune ligne en base : on insère des valeurs par défaut
      const defaults = { nom_produit: "H-47", prix_propre: 2500, prix_sale: 3125, quota_max: 250 };
      const { data: created } = await supabase.from("h47_config").insert([defaults]).select().single();
      if (created) {
        setConfig(created);
        setConfigForm({ nom_produit: created.nom_produit, prix_propre: created.prix_propre, prix_sale: created.prix_sale, quota_max: created.quota_max });
      }
    }
    setConfigLoaded(true);
  }

  async function saveConfig() {
    if (!supabase || !config) return;
    setSavingConfig(true);
    const { error } = await supabase.from("h47_config").update({
      nom_produit: configForm.nom_produit.trim() || "H-47",
      prix_propre: configForm.prix_propre,
      prix_sale: configForm.prix_sale,
      quota_max: configForm.quota_max,
      updated_at: new Date().toISOString(),
    }).eq("id", config.id);
    if (!error) {
      showT("Configuration mise à jour ✓");
      setShowConfigEdit(false);
      loadConfig();
    } else {
      showT("Erreur : " + error.message);
    }
    setSavingConfig(false);
  }

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

  if (!authChecked) return null;

  if (!authorized) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Accès réservé</div>
          <p style={{ fontSize:"0.875rem", marginTop:"0.5rem" }}>Vous n'avez pas la permission d'accéder au module H-47.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">{NOM_PRODUIT} — Suivi des ventes</h1>
          <p className="page-subtitle">Quotas hebdomadaires par organisation · {QUOTA_MAX} u/semaine max</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({ ...EMPTY_FORM }); setSaveError(""); setShowForm(true); }}>
          + Nouvelle vente
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {([
          ["semaine","📅 Semaine en cours"],
          ["historique","🗂 Historique"],
          ["convertisseur","🔄 Convertisseur"],
          ...(user && canAccess(user.role, "admin") ? [["config","⚙️ Configuration"]] : []),
        ] as [string,string][]).map(([k,l]) => (
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
            Tarifs : {fmt(PRIX.propre)}/u en propre · {fmt(PRIX.sale)}/u en sale · Quota {QUOTA_MAX}u/semaine/organisation
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="card" style={{ maxWidth:560 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <div className="section-title" style={{ marginBottom:0 }}>Configuration du module</div>
            {!showConfigEdit && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowConfigEdit(true)}>✏️ Modifier</button>
            )}
          </div>

          {!configLoaded ? (
            <div style={{ color:"var(--text-dim)", fontSize:"0.85rem" }}>Chargement de la configuration…</div>
          ) : !showConfigEdit ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
              {[
                { label:"Nom du produit", value: config.nom_produit },
                { label:"Prix unitaire — Propre", value: fmt(config.prix_propre) },
                { label:"Prix unitaire — Sale", value: fmt(config.prix_sale) },
                { label:"Quota max / semaine / organisation", value: `${config.quota_max} unités` },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.85rem", paddingBottom:"0.5rem", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ color:"var(--text-dim)" }}>{r.label}</span>
                  <span style={{ fontWeight:600 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.5rem" }}>
                Dernière mise à jour visible une fois modifiée.
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div className="form-group">
                <label>Nom du produit</label>
                <input value={configForm.nom_produit} onChange={e => setConfigForm(f => ({ ...f, nom_produit: e.target.value }))} placeholder="H-47" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Prix unitaire — Propre ($)</label>
                  <input type="number" min={0} value={configForm.prix_propre} onChange={e => setConfigForm(f => ({ ...f, prix_propre: Math.max(0, Number(e.target.value)||0) }))} />
                </div>
                <div className="form-group">
                  <label>Prix unitaire — Sale ($)</label>
                  <input type="number" min={0} value={configForm.prix_sale} onChange={e => setConfigForm(f => ({ ...f, prix_sale: Math.max(0, Number(e.target.value)||0) }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Quota max par semaine et par organisation</label>
                <input type="number" min={1} value={configForm.quota_max} onChange={e => setConfigForm(f => ({ ...f, quota_max: Math.max(1, Number(e.target.value)||1) }))} />
              </div>

              <div style={{ background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.25)", borderRadius:"var(--radius)", padding:"0.75rem 1rem", fontSize:"0.78rem", color:"var(--warning)" }}>
                ⚠️ Ces changements s'appliquent immédiatement aux nouvelles ventes et au calcul des quotas. Les ventes déjà enregistrées gardent leur prix d'origine.
              </div>

              <div style={{ display:"flex", gap:"0.625rem", justifyContent:"flex-end" }}>
                <button className="btn btn-outline" onClick={() => { setShowConfigEdit(false); setConfigForm({ nom_produit:config.nom_produit, prix_propre:config.prix_propre, prix_sale:config.prix_sale, quota_max:config.quota_max }); }}>
                  Annuler
                </button>
                <button className="btn btn-gold" onClick={saveConfig} disabled={savingConfig} style={{ opacity: savingConfig?0.7:1 }}>
                  {savingConfig ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          )}
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
