"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

// ─── TARIFS ───────────────────────────────────────────────────────────────────
const TARIFS_PENAUX = {
  crime:        { label: "Crime",         base: 15000, icon: "🔴", color: "#7c3aed" },
  delit_majeur: { label: "Délit majeur",  base: 8000,  icon: "🟠", color: "#ef4444" },
  delit_mineur: { label: "Délit mineur",  base: 3000,  icon: "🟡", color: "#f59e0b" },
};

const SERVICES_FIXES = [
  { key: "casier_mineur",  label: "Effacement de casier — Délit mineur", prix: 40000,  icon: "📋", categorie: "Casier" },
  { key: "casier_majeur",  label: "Effacement de casier — Délit majeur", prix: 60000,  icon: "📋", categorie: "Casier" },
  { key: "casier_crime",   label: "Effacement de casier — Crime",        prix: 120000, icon: "📋", categorie: "Casier" },
  { key: "divorce",        label: "Divorce",                             prix: 80000,  icon: "⚖️", categorie: "Civil" },
  { key: "mariage",        label: "Mariage",                             prix: 70000,  icon: "💍", categorie: "Civil" },
  { key: "changement_nom", label: "Changement de nom",                   prix: 100000, icon: "📝", categorie: "Civil" },
  { key: "adoption",       label: "Adoption",                            prix: 70000,  icon: "👶", categorie: "Civil" },
];

type Risque = "Aucun" | "Faible" | "Moyen" | "Élevé" | "Extrême";
const RISQUES: Risque[] = ["Aucun", "Faible", "Moyen", "Élevé", "Extrême"];
const MOD_RISQUE: Record<Risque, number> = { Aucun:1.0, Faible:1.15, Moyen:1.3, Élevé:1.5, Extrême:1.8 };

const OPTIONS = [
  { key: "bon_boulot", label: "Bon boulot",   modif: 1.15, desc: "+15% — affaire bien préparée", icon: "⭐" },
  { key: "proces",     label: "Procès",        modif: 1.25, desc: "+25% — audience & plaidoirie", icon: "⚖️" },
  { key: "plante",     label: "Plante verte",  modif: 0.85, desc: "−15% — client régulier",       icon: "🌿" },
];

type Mode = "penal" | "service";

function genNumFac() {
  return `FAC-${new Date().getFullYear()}-${Math.floor(Math.random()*90000)+10000}`;
}

interface HistEntry {
  mode: Mode;
  label: string;
  total: number;
  date: string;
}

const RISQUE_COLORS: Record<Risque, string> = {
  Aucun:"#64748b", Faible:"#10b981", Moyen:"#f59e0b", Élevé:"#ef4444", Extrême:"#7c3aed"
};

export default function SimulateurPage() {
  const router = useRouter();
  const user = getUser();

  const [mode, setMode] = useState<Mode>("penal");
  const [clientsList, setClientsList] = useState<string[]>([]);

  // Mode pénal
  const [qCrimes, setQCrimes]     = useState(0);
  const [qMajeurs, setQMajeurs]   = useState(0);
  const [qMineurs, setQMineurs]   = useState(0);
  const [risque, setRisque]       = useState<Risque>("Moyen");
  const [opts, setOpts]           = useState<string[]>([]);

  // Mode service
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Facture
  const [showFac, setShowFac]       = useState(false);
  const [clientName, setClientName] = useState("");
  const [creating, setCreating]     = useState(false);
  const [facCreated, setFacCreated] = useState<string|null>(null);

  // Historique session
  const [hist, setHist] = useState<HistEntry[]>([]);

  useEffect(() => {
    if (supabase && user) {
      supabase.from("clients").select("nom_rp").eq("created_by", user.nom).order("nom_rp")
        .then(({ data }) => setClientsList((data||[]).map((c:any)=>c.nom_rp)));
    }
  }, []);

  // ─── CALCULS PÉNAL ──────────────────────────────────────────────────────────
  const baseCrimes  = qCrimes  * TARIFS_PENAUX.crime.base;
  const baseMajeurs = qMajeurs * TARIFS_PENAUX.delit_majeur.base;
  const baseMineurs = qMineurs * TARIFS_PENAUX.delit_mineur.base;
  const baseTotal   = baseCrimes + baseMajeurs + baseMineurs;
  const modRisque   = MOD_RISQUE[risque];
  const modOpts     = opts.reduce((acc,k) => acc * (OPTIONS.find(o=>o.key===k)?.modif||1), 1);
  const honorairesPenal = Math.round(baseTotal * modRisque * modOpts);

  // ─── CALCULS SERVICE ────────────────────────────────────────────────────────
  const serviceActuel = SERVICES_FIXES.find(s=>s.key===selectedService);
  const honorairesService = serviceActuel?.prix || 0;

  const total = mode === "penal" ? honorairesPenal : honorairesService;
  const totalMod = ((modRisque * modOpts) - 1) * 100;

  function toggleOpt(k:string) {
    setOpts(p => p.includes(k) ? p.filter(x=>x!==k) : [...p,k]);
  }

  function addHist() {
    if (total <= 0) return;
    const label = mode === "penal"
      ? `${[qCrimes&&`${qCrimes}cr`,qMajeurs&&`${qMajeurs}dmj`,qMineurs&&`${qMineurs}dm`].filter(Boolean).join(", ")}`
      : serviceActuel?.label || "";
    setHist(h => [{mode, label, total, date: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}, ...h].slice(0,20));
  }

  async function creerFacture() {
    if (!supabase || !user || !clientName.trim() || total <= 0) return;
    setCreating(true);

    let description = "";
    if (mode === "penal") {
      const parts = [];
      if (qCrimes > 0)  parts.push(`${qCrimes} crime${qCrimes>1?"s":""}`);
      if (qMajeurs > 0) parts.push(`${qMajeurs} délit${qMajeurs>1?"s":""} majeur${qMajeurs>1?"s":""}`);
      if (qMineurs > 0) parts.push(`${qMineurs} délit${qMineurs>1?"s":""} mineur${qMineurs>1?"s":""}`);
      parts.push(`Risque: ${risque}`);
      if (opts.length) parts.push(opts.map(k=>OPTIONS.find(o=>o.key===k)?.label).filter(Boolean).join(", "));
      description = parts.join(" · ");
    } else {
      description = serviceActuel?.label || "";
    }

    const numero = genNumFac();
    const { error } = await supabase.from("factures").insert([{
      numero, client: clientName.trim(),
      montant: total, description,
      statut: "En attente", created_by: user.nom,
    }]);

    setCreating(false);
    if (!error) {
      setFacCreated(numero);
      setShowFac(false);
      addHist();
      setTimeout(() => setFacCreated(null), 5000);
    }
  }

  function reset() {
    setQCrimes(0); setQMajeurs(0); setQMineurs(0);
    setRisque("Moyen"); setOpts([]);
    setSelectedService(null);
  }

  const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Simulateur juridique</h1>
          <p className="page-subtitle">Calcul des honoraires · Code pénal FlashBackFA</p>
          <div className="gold-line" />
        </div>
      </div>

      {/* Toggle mode */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {([["penal","⚖️ Défense pénale"],["service","📋 Services civils"]] as const).map(([m,l]) => (
          <button key={m} onClick={()=>{ setMode(m); reset(); }}
            style={{
              padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
              fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight: mode===m ? 700 : 400,
              background: mode===m ? "var(--gold-muted)" : "var(--surface)",
              border:`1px solid ${mode===m ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
              color: mode===m ? "var(--gold)" : "var(--text-muted)",
              transition:"all 0.15s",
            }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>

        {/* ─── GAUCHE ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {mode === "penal" ? (
            <>
              {/* Compteurs chefs */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"1.125rem" }}>Chefs d'inculpation</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                  {(["crime","delit_majeur","delit_mineur"] as const).map(k => {
                    const t = TARIFS_PENAUX[k];
                    const val = k==="crime"?qCrimes:k==="delit_majeur"?qMajeurs:qMineurs;
                    const set = k==="crime"?setQCrimes:k==="delit_majeur"?setQMajeurs:setQMineurs;
                    const base = k==="crime"?baseCrimes:k==="delit_majeur"?baseMajeurs:baseMineurs;
                    return (
                      <div key={k} style={{
                        background:"var(--surface)", borderRadius:"var(--radius)",
                        padding:"0.875rem 1rem",
                        border:`1px solid ${val>0?t.color+"30":"var(--border)"}`,
                        transition:"border-color 0.15s",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.625rem" }}>
                          <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{t.icon} {t.label}</span>
                          <span style={{ fontSize:"0.75rem", color:"var(--text-dim)" }}>{fmt(t.base)} / unité</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                          <button onClick={()=>set(Math.max(0,val-1))} style={{
                            width:32,height:32,borderRadius:8,border:"1px solid var(--border)",
                            background:"var(--card)",color:"var(--text)",cursor:"pointer",
                            fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Inter',sans-serif",flexShrink:0,
                          }}>−</button>
                          <input type="number" min={0} value={val||""} placeholder="0"
                            onChange={e=>set(Math.max(0,Number(e.target.value)||0))}
                            style={{ textAlign:"center", flex:1, fontWeight:700, fontSize:"1.1rem" }}
                          />
                          <button onClick={()=>set(val+1)} style={{
                            width:32,height:32,borderRadius:8,flexShrink:0,
                            border:`1px solid ${val>0?t.color+"50":"var(--border)"}`,
                            background:val>0?t.color+"18":"var(--card)",
                            color:val>0?t.color:"var(--text)",cursor:"pointer",
                            fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:"'Inter',sans-serif",
                          }}>+</button>
                          {val > 0 && (
                            <span style={{ minWidth:80,textAlign:"right",fontWeight:600,color:t.color,fontSize:"0.85rem" }}>
                              {fmt(base)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {baseTotal > 0 && (
                    <div style={{ display:"flex",justifyContent:"space-between",padding:"0.625rem 0.875rem",
                      background:"var(--card)",borderRadius:"var(--radius)",borderLeft:"3px solid var(--gold)" }}>
                      <span style={{ fontSize:"0.8rem",color:"var(--text-dim)" }}>
                        Sous-total ({qCrimes+qMajeurs+qMineurs} chef{qCrimes+qMajeurs+qMineurs!==1?"s":""})
                      </span>
                      <span style={{ fontWeight:700,color:"var(--gold)" }}>{fmt(baseTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Risque */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Niveau de risque</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
                  {RISQUES.map(r => (
                    <button key={r} onClick={()=>setRisque(r)} style={{
                      padding:"0.45rem 0.875rem",borderRadius:8,cursor:"pointer",
                      fontFamily:"'Inter',sans-serif",fontSize:"0.8rem",
                      fontWeight:risque===r?700:400,
                      background:risque===r?RISQUE_COLORS[r]+"18":"var(--surface)",
                      border:`1px solid ${risque===r?RISQUE_COLORS[r]+"50":"var(--border)"}`,
                      color:risque===r?RISQUE_COLORS[r]:"var(--text-muted)",
                      transition:"all 0.12s",
                    }}>
                      {r} <span style={{opacity:0.6,fontSize:"0.72rem"}}>×{MOD_RISQUE[r].toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modificateurs */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Modificateurs</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  {OPTIONS.map(o => {
                    const active = opts.includes(o.key);
                    return (
                      <button key={o.key} onClick={()=>toggleOpt(o.key)} style={{
                        background:active?"var(--gold-muted)":"var(--surface)",
                        border:`1px solid ${active?"rgba(201,168,76,0.4)":"var(--border)"}`,
                        borderRadius:"var(--radius)",padding:"0.75rem 0.875rem",
                        cursor:"pointer",display:"flex",gap:"0.625rem",alignItems:"flex-start",
                        transition:"all 0.12s",textAlign:"left",fontFamily:"'Inter',sans-serif",
                        color:active?"var(--gold)":"var(--text-muted)",
                      }}>
                        <span style={{fontSize:"1rem"}}>{o.icon}</span>
                        <div>
                          <div style={{fontWeight:600,fontSize:"0.825rem",marginBottom:"0.1rem"}}>{o.label}</div>
                          <div style={{fontSize:"0.72rem",opacity:0.7}}>{o.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* ─── MODE SERVICE ─── */
            <div className="card">
              <div className="section-title" style={{ marginBottom:"1rem" }}>Services civils & administratifs</div>
              {["Casier","Civil"].map(cat => (
                <div key={cat} style={{ marginBottom:"1.125rem" }}>
                  <div style={{ fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",
                    color:"var(--text-dim)",marginBottom:"0.5rem",fontWeight:600 }}>{cat}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                    {SERVICES_FIXES.filter(s=>s.categorie===cat).map(s => {
                      const sel = selectedService===s.key;
                      return (
                        <button key={s.key} onClick={()=>setSelectedService(sel?null:s.key)} style={{
                          display:"flex",alignItems:"center",justifyContent:"space-between",
                          padding:"0.75rem 1rem",borderRadius:"var(--radius)",
                          background:sel?"var(--gold-muted)":"var(--surface)",
                          border:`1px solid ${sel?"rgba(201,168,76,0.4)":"var(--border)"}`,
                          cursor:"pointer",fontFamily:"'Inter',sans-serif",
                          transition:"all 0.12s",
                        }}>
                          <div style={{ display:"flex",alignItems:"center",gap:"0.625rem" }}>
                            <span>{s.icon}</span>
                            <span style={{ fontSize:"0.85rem",fontWeight:sel?600:400,
                              color:sel?"var(--gold)":"var(--text-muted)" }}>{s.label}</span>
                          </div>
                          <span style={{ fontWeight:700,color:"var(--gold)",fontSize:"0.875rem" }}>
                            {fmt(s.prix)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── DROITE — RÉSULTAT ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{
            background:"var(--card)",border:"2px solid rgba(201,168,76,0.3)",
            borderRadius:"var(--radius-xl)",padding:"2rem",textAlign:"center",
            position:"relative",overflow:"hidden",
          }}>
            <div style={{ position:"absolute",inset:0,
              background:"radial-gradient(ellipse at top,rgba(201,168,76,0.05) 0%,transparent 60%)",
              pointerEvents:"none" }} />

            <div style={{ fontFamily:"'Cinzel',serif",fontSize:"0.65rem",letterSpacing:"0.2em",
              color:"var(--text-dim)",marginBottom:"0.625rem" }}>HONORAIRES ESTIMÉS</div>

            <div style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:total>999999?"2rem":"2.75rem",
              fontWeight:900,color:total>0?"var(--gold)":"var(--text-dim)",
              lineHeight:1,marginBottom:"0.5rem",
            }}>
              {total > 0 ? fmt(total) : "—"}
            </div>

            {mode==="penal" && baseTotal > 0 && (
              <div style={{ fontSize:"0.78rem",color:"var(--text-muted)",marginBottom:"1.25rem" }}>
                Base {fmt(baseTotal)} · {totalMod>=0?"+":""}{totalMod.toFixed(0)}% modificateurs
              </div>
            )}

            {/* Décomposition pénale */}
            {mode==="penal" && (qCrimes+qMajeurs+qMineurs) > 0 && (
              <div style={{ background:"var(--surface)",borderRadius:"var(--radius)",
                padding:"1rem",textAlign:"left",marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",
                  color:"var(--text-dim)",marginBottom:"0.625rem" }}>Décomposition</div>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.35rem" }}>
                  {qCrimes>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                    <span style={{ color:"var(--text-muted)" }}>🔴 {qCrimes} crime{qCrimes>1?"s":""}</span>
                    <span style={{ color:"#7c3aed",fontWeight:600 }}>{fmt(baseCrimes)}</span>
                  </div>}
                  {qMajeurs>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                    <span style={{ color:"var(--text-muted)" }}>🟠 {qMajeurs} délit{qMajeurs>1?"s":""} majeur{qMajeurs>1?"s":""}</span>
                    <span style={{ color:"#ef4444",fontWeight:600 }}>{fmt(baseMajeurs)}</span>
                  </div>}
                  {qMineurs>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                    <span style={{ color:"var(--text-muted)" }}>🟡 {qMineurs} délit{qMineurs>1?"s":""} mineur{qMineurs>1?"s":""}</span>
                    <span style={{ color:"#f59e0b",fontWeight:600 }}>{fmt(baseMineurs)}</span>
                  </div>}
                  <div style={{ borderTop:"1px solid var(--border)",paddingTop:"0.35rem",
                    display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                    <span style={{ color:"var(--text-dim)" }}>Sous-total</span>
                    <span style={{ fontWeight:600 }}>{fmt(baseTotal)}</span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                    <span style={{ color:"var(--text-dim)" }}>Risque {risque}</span>
                    <span style={{ color:modRisque>1?"var(--warning)":"var(--text-dim)" }}>×{modRisque.toFixed(2)}</span>
                  </div>
                  {opts.map(k=>{
                    const o=OPTIONS.find(x=>x.key===k); if(!o) return null;
                    return <div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem" }}>
                      <span style={{ color:"var(--text-dim)" }}>{o.icon} {o.label}</span>
                      <span style={{ color:o.modif>1?"var(--warning)":"var(--success)" }}>×{o.modif.toFixed(2)}</span>
                    </div>;
                  })}
                  <div style={{ borderTop:"1px solid var(--border)",paddingTop:"0.35rem",
                    display:"flex",justifyContent:"space-between",fontWeight:700,
                    color:"var(--gold)",fontSize:"0.9rem" }}>
                    <span>Total honoraires</span><span>{fmt(total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Service sélectionné */}
            {mode==="service" && serviceActuel && (
              <div style={{ background:"var(--surface)",borderRadius:"var(--radius)",
                padding:"1rem",textAlign:"left",marginBottom:"1.25rem" }}>
                <div style={{ fontSize:"0.78rem",color:"var(--text-muted)" }}>
                  {serviceActuel.icon} {serviceActuel.label}
                </div>
                <div style={{ fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.25rem" }}>
                  Tarif fixe · Catégorie : {serviceActuel.categorie}
                </div>
              </div>
            )}

            {/* Boutons */}
            <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
              <button className="btn btn-gold"
                onClick={()=>{ addHist(); setShowFac(true); }}
                disabled={total<=0}
                style={{ width:"100%",justifyContent:"center",padding:"0.875rem",
                  fontSize:"0.9rem",opacity:total<=0?0.4:1 }}>
                🧾 Créer une facture
              </button>
              <button className="btn btn-outline"
                onClick={addHist} disabled={total<=0}
                style={{ width:"100%",justifyContent:"center",opacity:total<=0?0.4:1 }}>
                📋 Sauvegarder dans l'historique
              </button>
              <button className="btn btn-ghost"
                onClick={reset}
                style={{ width:"100%",justifyContent:"center",fontSize:"0.78rem" }}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historique session */}
      {hist.length > 0 && (
        <div style={{ marginTop:"2rem" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem" }}>
            <div className="section-title">Historique de session</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setHist([])}>Effacer</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Heure</th><th>Type</th><th>Détails</th><th style={{textAlign:"right"}}>Honoraires</th></tr>
              </thead>
              <tbody>
                {hist.map((h,i)=>(
                  <tr key={i}>
                    <td style={{ fontSize:"0.78rem",color:"var(--text-dim)" }}>{h.date}</td>
                    <td><span className={`badge ${h.mode==="penal"?"badge-danger":"badge-info"}`}>{h.mode==="penal"?"Pénal":"Civil"}</span></td>
                    <td style={{ fontSize:"0.8rem",color:"var(--text-muted)" }}>{h.label||"—"}</td>
                    <td style={{ textAlign:"right",fontWeight:700,color:"var(--gold)" }}>{fmt(h.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal facture */}
      {showFac && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowFac(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Créer une facture</h2>
              <button className="modal-close" onClick={()=>setShowFac(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background:"var(--surface)",borderRadius:"var(--radius)",
                padding:"0.875rem 1rem",borderLeft:"3px solid var(--gold)",marginBottom:"0.5rem" }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontWeight:700,color:"var(--gold)" }}>
                  <span>{mode==="penal"?"Défense pénale":serviceActuel?.label}</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Client *</label>
                <input list="fac-clients" placeholder="Choisir parmi vos clients"
                  value={clientName} onChange={e=>setClientName(e.target.value)}
                  autoFocus onKeyDown={e=>e.key==="Enter"&&creerFacture()} />
                <datalist id="fac-clients">
                  {clientsList.map(c=><option key={c} value={c}/>)}
                </datalist>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowFac(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={creerFacture}
                disabled={creating||!clientName.trim()}
                style={{opacity:creating?0.7:1}}>
                {creating?"Création…":"🧾 Émettre la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {facCreated && (
        <div className="toast-container">
          <div className="toast toast-success" style={{cursor:"pointer"}}
            onClick={()=>router.push("/factures")}>
            ✅ Facture {facCreated} créée — <span style={{color:"var(--gold)",textDecoration:"underline"}}>Voir les factures</span>
          </div>
        </div>
      )}
    </div>
  );
}
