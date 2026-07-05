"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

/* ─── CODE PÉNAL complet ──────────────────────────────────────────────────── */
import { CHEFS_PENAL, PLAFONDS_PENAL as PLAFONDS, HONORAIRES_PAR_CAT as HON_PAR_CAT } from "../lib/code-penal";

const TAUX_TENTATIVE   = 0.9;
const TAUX_COMPLICITE  = 0.8;
const TAUX_ATTENUATION = 0.8;

/* ─── Conversion amende → prison : 1$ au-delà de 10 000$ = 0,008 min ──────── */
const SEUIL_CONVERSION = 10000;
const TAUX_CONVERSION  = 0.008;

/* ─── Defcon ──────────────────────────────────────────────────────────────── */
const DEFCON_DATA = {
  5: { label:"Situation de base",                    couleur:"#3b82f6", modGlobal:1,    modCible:1,   note:"RAS"                        },
  4: { label:"Potentielle menace sécurité publique", couleur:"#22c55e", modGlobal:1,    modCible:1,   note:"RAS"                        },
  3: { label:"Menace sécurité publique en cours",    couleur:"#f59e0b", modGlobal:1,    modCible:1.5, note:"×1.5 sur chefs ciblés"       },
  2: { label:"Sécurité publique sous haute tension", couleur:"#f97316", modGlobal:1.25, modCible:2,   note:"×2 ciblés · ×1.25 reste"    },
  1: { label:"L'état est en guerre",                 couleur:"#ef4444", modGlobal:2,    modCible:3.5, note:"×3.5 ciblés · ×2 reste"     },
} as const;

/* ─── Retenues (coefficients réels du sheet) ─────────────────────────────── */
const RETENUES = [
  { key:"MIN1",    label:"MIN 1",   coeff:0.25, color:"#22c55e", tier:"min",     desc:"Vice de procédure ou accord DOA/CS/Justice",                                    note:"Appréciation agents de police" },
  { key:"MIN2",    label:"MIN 2",   coeff:0.5,  color:"#86efac", tier:"min",     desc:"Individu très coopératif et/ou informations utiles à la DOA",                   note:"Appréciation agents de police" },
  { key:"MIN3",    label:"MIN 3",   coeff:0.75, color:"#fde047", tier:"min",     desc:"Individu coopératif et/ou donne quelques informations à la DOA",                note:"Appréciation agents de police" },
  { key:"NOMINAL", label:"NOMINAL", coeff:1,    color:"#f59e0b", tier:"nominal", desc:"Peu coopératif ou situation de base",                                            note:"Situation de base"             },
  { key:"MAX1",    label:"MAX 1",   coeff:1.25, color:"#f97316", tier:"max",     desc:"Multiple récidiviste",                                                           note:"Approbation CS/SGT2 ou Juge"   },
  { key:"MAX2",    label:"MAX 2",   coeff:1.5,  color:"#ef4444", tier:"max",     desc:"Non coopératif, essaie de nuire et ralentir les procédures",                    note:"Approbation CS/SGT2 ou Juge"   },
  { key:"MAX3",    label:"MAX 3",   coeff:1.75, color:"#dc2626", tier:"max",     desc:"Absolument pas coopératif, dans le but de déranger et de nuire à la procédure", note:"Approbation CS/SGT2 ou Juge"   },
  { key:"MAX4",    label:"MAX 4",   coeff:2,    color:"#7c3aed", tier:"max",     desc:"Individu nocif, menace + insulte + tentative d'agression/d'évasion",            note:"Approbation CS/SGT2 ou Juge"   },
] as const;
type RetenueKey = typeof RETENUES[number]["key"];

/* ─── Honoraires ──────────────────────────────────────────────────────────── */
const TARIFS_PENAUX = {
  crime:        { label:"Crime",        base:15000, color:"#7c3aed" },
  delit_majeur: { label:"Délit majeur", base:8000,  color:"#ef4444" },
  delit_mineur: { label:"Délit mineur", base:3000,  color:"#f59e0b" },
};
const SERVICES_FIXES = [
  { key:"casier_mineur",  label:"Effacement de casier — Délit mineur", prix:40000,  icon:"📋", categorie:"Casier" },
  { key:"casier_majeur",  label:"Effacement de casier — Délit majeur", prix:60000,  icon:"📋", categorie:"Casier" },
  { key:"casier_crime",   label:"Effacement de casier — Crime",        prix:120000, icon:"📋", categorie:"Casier" },
  { key:"divorce",        label:"Divorce",                             prix:80000,  icon:"⚖️", categorie:"Civil"  },
  { key:"mariage",        label:"Mariage",                             prix:70000,  icon:"💍", categorie:"Civil"  },
  { key:"changement_nom", label:"Changement de nom",                   prix:100000, icon:"📝", categorie:"Civil"  },
  { key:"adoption",       label:"Adoption",                            prix:70000,  icon:"👶", categorie:"Civil"  },
];
type Risque = "Aucun"|"Faible"|"Moyen"|"Élevé"|"Extrême";
const RISQUES: Risque[] = ["Aucun","Faible","Moyen","Élevé","Extrême"];
const MOD_RISQUE: Record<Risque,number> = { Aucun:1.0, Faible:1.15, Moyen:1.3, Élevé:1.5, Extrême:1.8 };
const RISQUE_COLORS: Record<Risque,string> = { Aucun:"#64748b",Faible:"#10b981",Moyen:"#f59e0b",Élevé:"#ef4444",Extrême:"#7c3aed" };
const OPTIONS = [
  { key:"bon_boulot", label:"Bon boulot",  modif:1.15, desc:"+15% — affaire bien préparée", icon:"⭐" },
  { key:"proces",     label:"Procès",       modif:1.25, desc:"+25% — audience & plaidoirie", icon:"⚖️" },
  { key:"plante",     label:"Plante verte", modif:0.85, desc:"−15% — client régulier",       icon:"🌿" },
];
const CAT_COLORS: Record<string,string> = { "Contravention":"#64748b","Délit mineur":"#f59e0b","Délit majeur":"#ef4444","Crime":"#7c3aed" };
const CATEGORIES = ["Contravention","Délit mineur","Délit majeur","Crime"];

type Mode = "penal"|"service"|"formulaire";
type DefconLevel = 1|2|3|4|5;

interface LigneChef {
  id: string;
  chef: typeof CHEFS_PENAL[0]|null;
  search: string;
  showPicker: boolean;
  quantite: number;
  tentative: boolean;
  complicite: boolean;
  attenuation: boolean;
}
interface HistEntry { mode:Mode; label:string; total:number; date:string; }

function genId() { return Math.random().toString(36).slice(2,9); }
function genNumFac() { return `FAC-${new Date().getFullYear()}-${Math.floor(Math.random()*90000)+10000}`; }
function newLigne(): LigneChef { return { id:genId(), chef:null, search:"", showPicker:false, quantite:1, tentative:false, complicite:false, attenuation:false }; }
const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});

export default function SimulateurPage() {
  const router = useRouter();
  const user = getUser();
  const nowRef = useRef(new Date());

  const [mode, setMode]           = useState<Mode>("penal");
  const [clientsList, setClientsList] = useState<string[]>([]);

  /* Pénal honoraires */
  const [qCrimes, setQCrimes]   = useState(0);
  const [qMajeurs, setQMajeurs] = useState(0);
  const [qMineurs, setQMineurs] = useState(0);
  const [risque, setRisque]     = useState<Risque>("Moyen");
  const [opts, setOpts]         = useState<string[]>([]);

  /* Service */
  const [selectedService, setSelectedService] = useState<string|null>(null);

  /* Formulaire */
  const [defcon, setDefcon]             = useState<DefconLevel>(5);
  const [prenomPrev, setPrenomPrev]     = useState("");
  const [nomPrev, setNomPrev]           = useState("");
  const [matricule, setMatricule]       = useState("");
  const [droitSoins, setDroitSoins]     = useState(false);
  const [droitNourriture, setDroitNourriture] = useState(false);
  const [droitPlaide, setDroitPlaide]   = useState(false);
  const [intervenant, setIntervenant]   = useState<"avocat"|"procureur"|"cs">("avocat");
  const [retenue, setRetenue]           = useState<RetenueKey>("NOMINAL");
  const [lignes, setLignes]             = useState<LigneChef[]>([newLigne()]);
  const [filterCat, setFilterCat]       = useState("");

  /* Facture */
  const [showFac, setShowFac]       = useState(false);
  const [clientName, setClientName] = useState("");
  const [creating, setCreating]     = useState(false);
  const [facCreated, setFacCreated] = useState<string|null>(null);
  const [hist, setHist]             = useState<HistEntry[]>([]);
  const [toast, setToast]           = useState<string|null>(null);

  useEffect(() => {
    if (supabase && user) {
      supabase.from("clients").select("nom_rp").eq("created_by",user.nom).order("nom_rp")
        .then(({ data }) => setClientsList((data||[]).map((c:any)=>c.nom_rp)));
    }
  }, []);

  function showT(msg:string) { setToast(msg); setTimeout(()=>setToast(null),4000); }

  /* ─── Calculs honoraires pénal ──────────────────────────────────────────── */
  const baseCrimes  = qCrimes  * TARIFS_PENAUX.crime.base;
  const baseMajeurs = qMajeurs * TARIFS_PENAUX.delit_majeur.base;
  const baseMineurs = qMineurs * TARIFS_PENAUX.delit_mineur.base;
  const baseTotal   = baseCrimes + baseMajeurs + baseMineurs;
  const modRisque   = MOD_RISQUE[risque];
  const modOpts     = opts.reduce((acc,k)=>acc*(OPTIONS.find(o=>o.key===k)?.modif||1),1);
  const honorairesPenal   = Math.round(baseTotal*modRisque*modOpts);
  const serviceActuel     = SERVICES_FIXES.find(s=>s.key===selectedService);
  const honorairesService = serviceActuel?.prix||0;
  const totalHon = mode==="penal"?honorairesPenal:mode==="service"?honorairesService:0;

  /* ─── Calculs formulaire ────────────────────────────────────────────────── */
  const hasCrime = lignes.some(l=>l.chef?.categorie==="Crime");
  const retenueData = RETENUES.find(r=>r.key===retenue)!;

  const formulaireCalc = useMemo(() => {
    const dc = DEFCON_DATA[defcon];
    const ret = RETENUES.find(r=>r.key===retenue)!;

    let detentionBase = 0;
    let amendeParCat: Record<string, number> = {};

    for (const l of lignes) {
      if (!l.chef) continue;
      const q   = Math.max(1, l.quantite||1);
      const cat = l.chef.categorie;

      /* ── Détention de base ── */
      let det = l.chef.detentionMin;
      if (l.tentative)  det = Math.round(det * TAUX_TENTATIVE);
      if (l.complicite) det = Math.round(det * TAUX_COMPLICITE);
      if (l.attenuation) det = Math.round(det * TAUX_ATTENUATION);
      detentionBase += det * q;

      /* ── Amende brute ligne ── */
      const isCible = l.chef.cible;
      const modDefcon = isCible ? dc.modCible : dc.modGlobal;
      let am = l.chef.amendeNum;
      if (l.tentative)   am = Math.round(am * TAUX_TENTATIVE);
      if (l.complicite)  am = Math.round(am * TAUX_COMPLICITE);
      if (l.attenuation) am = Math.round(am * TAUX_ATTENUATION);
      am = Math.round(am * modDefcon);

      amendeParCat[cat] = (amendeParCat[cat]||0) + am * q;
    }

    /* ── Plafonnement par catégorie ── */
    let amendeAvantRetenue = 0;
    const capsAppliquees: string[] = [];
    for (const [cat, total] of Object.entries(amendeParCat)) {
      const cap = PLAFONDS[cat] || 10000;
      if (total > cap) capsAppliquees.push(cat);
      amendeAvantRetenue += Math.min(total, cap);
    }

    /* ── Application retenue ── */
    const amendeFinale = Math.round(amendeAvantRetenue * ret.coeff);

    /* ── Conversion excès en prison ── */
    const exces = Math.max(0, amendeFinale - SEUIL_CONVERSION);
    const detentionConversion = Math.round(exces * TAUX_CONVERSION * 10) / 10;
    const detentionTotale = detentionBase + Math.floor(detentionConversion);

    /* ── Honoraires ── */
    const honBase = lignes
      .filter(l=>l.chef)
      .reduce((s,l)=>(HON_PAR_CAT[l.chef!.categorie]||0)*(l.quantite||1)+s, 0);

    return {
      detentionBase, detentionConversion, detentionTotale,
      amendeAvantRetenue, amendeFinale,
      capsAppliquees, amendeParCat, honBase,
    };
  }, [lignes, defcon, retenue]);

  /* ─── Helpers lignes ─────────────────────────────────────────────────────── */
  function updateLigne(id:string, upd:Partial<LigneChef>) {
    setLignes(ls=>ls.map(l=>l.id===id?{...l,...upd}:l));
  }
  function selectChef(id:string, chef:typeof CHEFS_PENAL[0]) {
    setLignes(ls=>ls.map(l=>l.id===id?{...l,chef,search:"",showPicker:false}:l));
  }
  function removeLigne(id:string) { setLignes(ls=>ls.length>1?ls.filter(l=>l.id!==id):ls); }
  function toggleOpt(k:string) { setOpts(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]); }

  /* ─── Export ─────────────────────────────────────────────────────────────── */
  function exportFormulaire() {
    const d = nowRef.current;
    const dt = d.toLocaleDateString("fr-FR")+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    const dc = DEFCON_DATA[defcon];
    const lines = [
      "╔════════════════════════════════════════════════════╗",
      "║    FORMULAIRE D'INCULPATION — CABINET BULLHEAD    ║",
      `║    DEFCON ${defcon} — ${dc.label.slice(0,40).padEnd(40)} ║`,
      "╚════════════════════════════════════════════════════╝",
      `Date : ${dt}`,
      `Prévenu : ${prenomPrev} ${nomPrev}`.trim()||"Prévenu : Non renseigné",
      matricule?`Matricule(s) : ${matricule}`:"",
      `Intervenant : ${intervenant==="avocat"?(user?.nom||"Cabinet BullHead"):intervenant==="procureur"?"Procureur / Juge":"CS / Sgt. II"}`,
      "",
      `Droits : Soins [${droitSoins?"✓":" "}]  Nourriture [${droitNourriture?"✓":" "}]  Plaider coupable [${(!hasCrime&&droitPlaide)?"✓":" "}]`,
      "",
      "────────────────────────────────────────────────────",
      "  CHEFS D'INCULPATION",
      "────────────────────────────────────────────────────",
      ...lignes.filter(l=>l.chef).map(l=>
        `  ${l.chef!.infraction}`+
        (l.quantite>1?` × ${l.quantite}`:"")+
        (l.tentative?` (Tent. ×${TAUX_TENTATIVE})`:"")+(l.complicite?` (Comp. ×${TAUX_COMPLICITE})`:"")+(l.attenuation?` (Atté. ×${TAUX_ATTENUATION})`:"")+
        (l.chef!.cible?" ⚑ ciblé":"")
      ),
      "",
      "────────────────────────────────────────────────────",
      "  RÉSULTATS",
      "────────────────────────────────────────────────────",
      `  Retenue : ${retenue} (×${retenueData.coeff}) — ${retenueData.desc}`,
      `  Amende avant retenue : ${fmt(formulaireCalc.amendeAvantRetenue)}`,
      `  Amende finale : ${fmt(formulaireCalc.amendeFinale)}`,
      formulaireCalc.detentionConversion>0?`  Prison conversion ($>${fmt(SEUIL_CONVERSION)}) : +${formulaireCalc.detentionConversion} min`:"",
      `  Détention totale : ${formulaireCalc.detentionTotale} min`,
      "",
      `  Honoraires Cabinet BullHead : ${fmt(formulaireCalc.honBase)}`,
      "",
      "Cabinet BullHead — "+new Date().toLocaleDateString("fr-FR"),
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    showT("Formulaire copié !");
  }

  /* ─── Facture ────────────────────────────────────────────────────────────── */
  async function creerFacture(montant:number, description:string) {
    if (!supabase||!user||!clientName.trim()||montant<=0) return;
    setCreating(true);
    const numero = genNumFac();
    const { error } = await supabase.from("factures").insert([{ numero, client:clientName.trim(), montant, description, statut:"En attente", created_by:user.nom }]);
    setCreating(false);
    if (!error) { setFacCreated(numero); setShowFac(false); showT(`Facture ${numero} créée`); setTimeout(()=>setFacCreated(null),5000); }
  }

  function openFacPenal() {
    const parts:string[]=[];
    if(qCrimes>0)  parts.push(`${qCrimes} crime${qCrimes>1?"s":""}`);
    if(qMajeurs>0) parts.push(`${qMajeurs} délit${qMajeurs>1?"s":""} majeur${qMajeurs>1?"s":""}`);
    if(qMineurs>0) parts.push(`${qMineurs} délit${qMineurs>1?"s":""} mineur${qMineurs>1?"s":""}`);
    parts.push(`Risque: ${risque}`);
    if(opts.length) parts.push(opts.map(k=>OPTIONS.find(o=>o.key===k)?.label).filter(Boolean).join(", "));
    (window as any).__facDesc=parts.join(" · ");
    (window as any).__facMontant=totalHon;
    setClientName(""); setShowFac(true);
  }

  const hasCharges = lignes.some(l=>l.chef!==null);
  const dc = DEFCON_DATA[defcon];

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="page-container">

      <style>{`
        @media print {
          .sidebar, .back-link, .btn, .modal-overlay, button:not(.print-only),
          .page-header > div:last-child { display: none !important; }
          .page-container { padding: 0 !important; max-width: none !important; }
          body { background: white !important; color: black !important; }
          .formulaire-preview { break-inside: avoid; }
        }
      `}</style>
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Simulateur juridique</h1>
          <p className="page-subtitle">Honoraires · Formulaire d'inculpation · Code pénal FlashBackFA</p>
          <div className="gold-line"/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.5rem",flexWrap:"wrap"}}>
        {([["penal","⚖️ Défense pénale"],["service","📋 Services civils"],["formulaire","📄 Formulaire d'inculpation"]] as [Mode,string][]).map(([m,l])=>(
          <button key={m} onClick={()=>setMode(m)} style={{ padding:"0.55rem 1.25rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.85rem",fontWeight:mode===m?700:400,background:mode===m?"var(--gold-muted)":"var(--surface)",border:`1px solid ${mode===m?"rgba(201,168,76,0.4)":"var(--border)"}`,color:mode===m?"var(--gold)":"var(--text-muted)",transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── PÉNAL & SERVICE ── */}
      {(mode==="penal"||mode==="service")&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
            {mode==="penal"?(
              <>
                <div className="card">
                  <div className="section-title" style={{marginBottom:"1.125rem"}}>Chefs d'inculpation</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"0.875rem"}}>
                    {(["crime","delit_majeur","delit_mineur"] as const).map(k=>{
                      const t=TARIFS_PENAUX[k];
                      const val=k==="crime"?qCrimes:k==="delit_majeur"?qMajeurs:qMineurs;
                      const set=k==="crime"?setQCrimes:k==="delit_majeur"?setQMajeurs:setQMineurs;
                      const base=k==="crime"?baseCrimes:k==="delit_majeur"?baseMajeurs:baseMineurs;
                      return(
                        <div key={k} style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.875rem 1rem",border:`1px solid ${val>0?t.color+"30":"var(--border)"}`,transition:"border-color 0.15s"}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.625rem"}}><span style={{fontWeight:600,fontSize:"0.875rem"}}>{t.label}</span><span style={{fontSize:"0.75rem",color:"var(--text-dim)"}}>{fmt(t.base)} / unité</span></div>
                          <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
                            <button onClick={()=>set(Math.max(0,val-1))} style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",flexShrink:0}}>−</button>
                            <input type="number" min={0} value={val||""} placeholder="0" onChange={e=>set(Math.max(0,Number(e.target.value)||0))} style={{textAlign:"center",flex:1,fontWeight:700,fontSize:"1.1rem"}}/>
                            <button onClick={()=>set(val+1)} style={{width:32,height:32,borderRadius:8,flexShrink:0,border:`1px solid ${val>0?t.color+"50":"var(--border)"}`,background:val>0?t.color+"18":"var(--card)",color:val>0?t.color:"var(--text)",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>+</button>
                            {val>0&&<span style={{minWidth:80,textAlign:"right",fontWeight:600,color:t.color,fontSize:"0.85rem"}}>{fmt(base)}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {baseTotal>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"0.625rem 0.875rem",background:"var(--card)",borderRadius:"var(--radius)",borderLeft:"3px solid var(--gold)"}}><span style={{fontSize:"0.8rem",color:"var(--text-dim)"}}>Sous-total ({qCrimes+qMajeurs+qMineurs} chef{qCrimes+qMajeurs+qMineurs!==1?"s":""})</span><span style={{fontWeight:700,color:"var(--gold)"}}>{fmt(baseTotal)}</span></div>}
                  </div>
                </div>
                <div className="card">
                  <div className="section-title" style={{marginBottom:"0.875rem"}}>Niveau de risque</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                    {RISQUES.map(r=><button key={r} onClick={()=>setRisque(r)} style={{padding:"0.45rem 0.875rem",borderRadius:8,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.8rem",fontWeight:risque===r?700:400,background:risque===r?RISQUE_COLORS[r]+"18":"var(--surface)",border:`1px solid ${risque===r?RISQUE_COLORS[r]+"50":"var(--border)"}`,color:risque===r?RISQUE_COLORS[r]:"var(--text-muted)",transition:"all 0.12s"}}>{r} <span style={{opacity:0.6,fontSize:"0.72rem"}}>×{MOD_RISQUE[r].toFixed(2)}</span></button>)}
                  </div>
                </div>
                <div className="card">
                  <div className="section-title" style={{marginBottom:"0.875rem"}}>Modificateurs</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                    {OPTIONS.map(o=>{const active=opts.includes(o.key);return(<button key={o.key} onClick={()=>toggleOpt(o.key)} style={{background:active?"var(--gold-muted)":"var(--surface)",border:`1px solid ${active?"rgba(201,168,76,0.4)":"var(--border)"}`,borderRadius:"var(--radius)",padding:"0.75rem 0.875rem",cursor:"pointer",display:"flex",gap:"0.625rem",alignItems:"flex-start",transition:"all 0.12s",textAlign:"left",fontFamily:"'Inter',sans-serif",color:active?"var(--gold)":"var(--text-muted)"}}><span style={{fontSize:"1rem"}}>{o.icon}</span><div><div style={{fontWeight:600,fontSize:"0.825rem",marginBottom:"0.1rem"}}>{o.label}</div><div style={{fontSize:"0.72rem",opacity:0.7}}>{o.desc}</div></div></button>);})}
                  </div>
                </div>
              </>
            ):(
              <div className="card">
                <div className="section-title" style={{marginBottom:"1rem"}}>Services civils & administratifs</div>
                {["Casier","Civil"].map(cat=>(
                  <div key={cat} style={{marginBottom:"1.125rem"}}>
                    <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.5rem",fontWeight:600}}>{cat}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>
                      {SERVICES_FIXES.filter(s=>s.categorie===cat).map(s=>{const sel=selectedService===s.key;return(<button key={s.key} onClick={()=>setSelectedService(sel?null:s.key)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",borderRadius:"var(--radius)",background:sel?"var(--gold-muted)":"var(--surface)",border:`1px solid ${sel?"rgba(201,168,76,0.4)":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.12s"}}><div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}><span>{s.icon}</span><span style={{fontSize:"0.85rem",fontWeight:sel?600:400,color:sel?"var(--gold)":"var(--text-muted)"}}>{s.label}</span></div><span style={{fontWeight:700,color:"var(--gold)",fontSize:"0.875rem"}}>{fmt(s.prix)}</span></button>);})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div style={{background:"var(--card)",border:"2px solid rgba(201,168,76,0.3)",borderRadius:"var(--radius-xl)",padding:"2rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at top,rgba(201,168,76,0.05) 0%,transparent 60%)",pointerEvents:"none"}}/>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:"0.65rem",letterSpacing:"0.2em",color:"var(--text-dim)",marginBottom:"0.625rem"}}>HONORAIRES ESTIMÉS</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:totalHon>999999?"2rem":"2.75rem",fontWeight:900,color:totalHon>0?"var(--gold)":"var(--text-dim)",lineHeight:1,marginBottom:"0.5rem"}}>{totalHon>0?fmt(totalHon):"—"}</div>
              {mode==="penal"&&baseTotal>0&&<div style={{fontSize:"0.78rem",color:"var(--text-muted)",marginBottom:"1.25rem"}}>Base {fmt(baseTotal)} · {((modRisque*modOpts-1)*100)>=0?"+":""}{((modRisque*modOpts-1)*100).toFixed(0)}% modificateurs</div>}
              {mode==="penal"&&(qCrimes+qMajeurs+qMineurs)>0&&(
                <div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"1rem",textAlign:"left",marginBottom:"1.25rem"}}>
                  <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-dim)",marginBottom:"0.625rem"}}>Décomposition</div>
                  {qCrimes>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem"}}><span style={{color:"var(--text-muted)"}}>🔴 {qCrimes} crime{qCrimes>1?"s":""}</span><span style={{color:"#7c3aed",fontWeight:600}}>{fmt(baseCrimes)}</span></div>}
                  {qMajeurs>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem"}}><span style={{color:"var(--text-muted)"}}>🟠 {qMajeurs} délit{qMajeurs>1?"s":""} majeur{qMajeurs>1?"s":""}</span><span style={{color:"#ef4444",fontWeight:600}}>{fmt(baseMajeurs)}</span></div>}
                  {qMineurs>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem"}}><span style={{color:"var(--text-muted)"}}>🟡 {qMineurs} délit{qMineurs>1?"s":""} mineur{qMineurs>1?"s":""}</span><span style={{color:"#f59e0b",fontWeight:600}}>{fmt(baseMineurs)}</span></div>}
                  <div style={{borderTop:"1px solid var(--border)",paddingTop:"0.35rem",marginTop:"0.35rem"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.2rem"}}><span style={{color:"var(--text-dim)"}}>Risque {risque}</span><span style={{color:modRisque>1?"var(--warning)":"var(--text-dim)"}}>×{modRisque.toFixed(2)}</span></div>
                    {opts.map(k=>{const o=OPTIONS.find(x=>x.key===k);if(!o)return null;return<div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.2rem"}}><span style={{color:"var(--text-dim)"}}>{o.icon} {o.label}</span><span style={{color:o.modif>1?"var(--warning)":"var(--success)"}}>×{o.modif.toFixed(2)}</span></div>;})}
                    <div style={{borderTop:"1px solid var(--border)",paddingTop:"0.35rem",display:"flex",justifyContent:"space-between",fontWeight:700,color:"var(--gold)",fontSize:"0.9rem"}}><span>Total honoraires</span><span>{fmt(totalHon)}</span></div>
                  </div>
                </div>
              )}
              {mode==="service"&&serviceActuel&&<div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"1rem",textAlign:"left",marginBottom:"1.25rem"}}><div style={{fontSize:"0.78rem",color:"var(--text-muted)"}}>{serviceActuel.icon} {serviceActuel.label}</div><div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.25rem"}}>Tarif fixe · {serviceActuel.categorie}</div></div>}
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                <button className="btn btn-gold" onClick={openFacPenal} disabled={totalHon<=0} style={{width:"100%",justifyContent:"center",padding:"0.875rem",fontSize:"0.9rem",opacity:totalHon<=0?0.4:1}}>🧾 Créer une facture</button>
                <button className="btn btn-ghost" onClick={()=>{setQCrimes(0);setQMajeurs(0);setQMineurs(0);setRisque("Moyen");setOpts([]);setSelectedService(null);}} style={{width:"100%",justifyContent:"center",fontSize:"0.78rem"}}>Réinitialiser</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FORMULAIRE D'INCULPATION
          ══════════════════════════════════════════════════════════════════════ */}
      {mode==="formulaire"&&(
        <>
          {/* Bandeau Defcon */}
          <div style={{background:"var(--card)",border:`2px solid ${dc.couleur}50`,borderRadius:"var(--radius-lg)",padding:"1rem 1.25rem",marginBottom:"1.25rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"1.25rem",flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:dc.couleur,boxShadow:`0 0 8px ${dc.couleur}`}}/>
                <span style={{fontWeight:900,fontSize:"1rem",color:dc.couleur,letterSpacing:"0.1em"}}>DEFCON {defcon}</span>
                <span style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text-muted)"}}>{dc.label}</span>
              </div>
              <div style={{display:"flex",gap:"0.875rem",marginLeft:"auto",alignItems:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:"0.58rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.15rem"}}>GLOBAL</div><div style={{fontWeight:900,fontSize:"1.1rem",color:dc.modGlobal>1?dc.couleur:"var(--text-dim)"}}>×{dc.modGlobal}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:"0.58rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.15rem"}}>CIBLÉ</div><div style={{fontWeight:900,fontSize:"1.1rem",color:dc.modCible>1?dc.couleur:"var(--text-dim)"}}>×{dc.modCible}</div></div>
              </div>
              <div style={{display:"flex",gap:"0.3rem"}}>
                {([5,4,3,2,1] as DefconLevel[]).map(n=>{const col=DEFCON_DATA[n].couleur;return(<button key={n} onClick={()=>setDefcon(n)} title={DEFCON_DATA[n].label} style={{padding:"0.3rem 0.7rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.78rem",fontWeight:defcon===n?900:400,background:defcon===n?col+"20":"var(--surface)",border:`1px solid ${defcon===n?col+"60":"var(--border)"}`,color:defcon===n?col:"var(--text-dim)",transition:"all 0.15s"}}>{n}</button>);})}
              </div>
            </div>
            {(dc.modGlobal>1||dc.modCible>1)&&<div style={{marginTop:"0.5rem",fontSize:"0.72rem",color:dc.couleur,paddingLeft:"1.625rem"}}>⚠ Amende police : {dc.note}</div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"270px 1fr",gap:"1.25rem",alignItems:"start"}}>

            {/* ─── GAUCHE ─── */}
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

              {/* Prévenu */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"0.875rem"}}>Le Prévenu</div>
                <div className="form-group"><label>Prénom</label><input placeholder="Prénom…" value={prenomPrev} onChange={e=>setPrenomPrev(e.target.value)}/></div>
                <div className="form-group"><label>Nom</label><input placeholder="Nom de famille…" value={nomPrev} onChange={e=>setNomPrev(e.target.value)}/></div>
                <div className="form-group" style={{marginBottom:0}}><label>Matricule(s) agents</label><input placeholder="Ex: 113/193" value={matricule} onChange={e=>setMatricule(e.target.value)}/></div>
              </div>

              {/* Droits */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"0.875rem"}}>Droits du prévenu</div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {[
                    {label:"Soins médicaux",  val:droitSoins,      set:setDroitSoins,      col:"#22c55e",disabled:false},
                    {label:"Nourriture",       val:droitNourriture, set:setDroitNourriture, col:"#f59e0b",disabled:false},
                    {label:"Plaider coupable", val:droitPlaide&&!hasCrime, set:setDroitPlaide, col:"#3b82f6",disabled:hasCrime},
                  ].map(d=>(
                    <label key={d.label} style={{display:"flex",alignItems:"center",gap:"0.625rem",cursor:d.disabled?"not-allowed":"pointer",padding:"0.4rem 0.5rem",borderRadius:"var(--radius)",background:d.disabled?"var(--surface)":d.val?d.col+"10":"var(--surface)",border:`1px solid ${d.disabled?"var(--border)":d.val?d.col+"40":"var(--border)"}`,opacity:d.disabled?0.4:1,transition:"all 0.15s"}}>
                      <div onClick={()=>!d.disabled&&d.set(!d.val)} style={{width:18,height:18,borderRadius:4,flexShrink:0,border:`2px solid ${d.val&&!d.disabled?d.col:"var(--border-light)"}`,background:d.val&&!d.disabled?d.col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:d.disabled?"not-allowed":"pointer",transition:"all 0.15s"}}>
                        {d.val&&!d.disabled&&<span style={{color:"#08090d",fontSize:"0.65rem",fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{fontSize:"0.8rem",fontWeight:d.val&&!d.disabled?600:400,color:d.val&&!d.disabled?d.col:"var(--text-muted)"}}>{d.label}</span>
                      {d.disabled&&<span style={{fontSize:"0.6rem",color:"var(--text-dim)",marginLeft:"auto"}}>N/A crime</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Intervenant */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"0.875rem"}}>Intervenant</div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                  {([{key:"avocat",label:`Avocat — ${user?.nom||"Cabinet BullHead"}`,col:"var(--gold)"},{key:"procureur",label:"Procureur / Juge",col:"var(--info)"},{key:"cs",label:"CS / Sgt. II (Absence procureur)",col:"var(--text-dim)"}] as const).map(opt=>(
                    <button key={opt.key} onClick={()=>setIntervenant(opt.key)} style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.5rem 0.625rem",borderRadius:"var(--radius)",background:intervenant===opt.key?opt.col+"12":"var(--surface)",border:`1px solid ${intervenant===opt.key?opt.col+"50":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s"}}>
                      <div style={{width:14,height:14,borderRadius:"50%",flexShrink:0,border:`2px solid ${intervenant===opt.key?opt.col:"var(--border-light)"}`,background:intervenant===opt.key?opt.col:"transparent",transition:"all 0.15s"}}/>
                      <span style={{fontSize:"0.775rem",fontWeight:intervenant===opt.key?600:400,color:intervenant===opt.key?opt.col:"var(--text-muted)"}}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Retenue — 8 niveaux */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"0.75rem"}}>Retenue</div>

                {/* Légende coefficients */}
                <div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.5rem 0.75rem",marginBottom:"0.75rem",fontSize:"0.68rem",color:"var(--text-dim)"}}>
                  Coefficient appliqué à l'amende finale · ×{retenueData.coeff}
                  {retenueData.tier==="max"&&<span style={{color:"var(--warning)",marginLeft:"0.5rem"}}>⚠ Approbation requise</span>}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                  {RETENUES.map(r=>{
                    const active=retenue===r.key;
                    return(
                      <button key={r.key} onClick={()=>setRetenue(r.key)} style={{display:"flex",alignItems:"flex-start",gap:"0.625rem",padding:"0.45rem 0.625rem",borderRadius:"var(--radius)",background:active?r.color+"18":"var(--surface)",border:`1px solid ${active?r.color+"55":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.12s"}}>
                        <div style={{minWidth:28,height:18,borderRadius:3,background:active?r.color:"var(--surface)",border:`1px solid ${r.color}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.12s"}}>
                          <span style={{fontSize:"0.55rem",fontWeight:900,color:active?"#08090d":r.color,letterSpacing:"0.02em"}}>{r.label}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"0.72rem",color:active?r.color:"var(--text-muted)",fontWeight:active?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</div>
                        </div>
                        <div style={{fontSize:"0.7rem",fontWeight:700,color:active?r.color:"var(--text-dim)",flexShrink:0}}>×{r.coeff}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Résultats */}
              <div className="card" style={{border:"1px solid rgba(201,168,76,0.25)"}}>
                <div className="section-title" style={{marginBottom:"0.875rem"}}>Résultats</div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
                  {/* Amende */}
                  <div style={{padding:"0.75rem",borderRadius:"var(--radius)",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)"}}>
                    <div style={{fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.25rem"}}>Amende</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.25rem",color:formulaireCalc.amendeFinale>0?"var(--gold)":"var(--text-dim)",lineHeight:1.1}}>
                      {formulaireCalc.amendeFinale>0?fmt(formulaireCalc.amendeFinale):"—"}
                    </div>
                    {formulaireCalc.amendeAvantRetenue!==formulaireCalc.amendeFinale&&formulaireCalc.amendeAvantRetenue>0&&(
                      <div style={{fontSize:"0.62rem",color:"var(--text-dim)",marginTop:"0.25rem"}}>
                        Avant retenue : {fmt(formulaireCalc.amendeAvantRetenue)} → ×{retenueData.coeff}
                      </div>
                    )}
                    {formulaireCalc.capsAppliquees.length>0&&(
                      <div style={{fontSize:"0.62rem",color:"var(--warning)",marginTop:"0.2rem"}}>
                        ⚑ Plafond appliqué : {formulaireCalc.capsAppliquees.join(", ")}
                      </div>
                    )}
                    {(dc.modGlobal>1||dc.modCible>1)&&hasCharges&&(
                      <div style={{fontSize:"0.62rem",color:dc.couleur,marginTop:"0.2rem"}}>Defcon {defcon} inclus</div>
                    )}
                  </div>
                  {/* Détention */}
                  <div style={{padding:"0.75rem",borderRadius:"var(--radius)",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)"}}>
                    <div style={{fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem"}}>Détention totale</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:"0.4rem"}}>
                      <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.8rem",color:formulaireCalc.detentionTotale>0?"var(--danger)":"var(--text-dim)",lineHeight:1}}>{formulaireCalc.detentionTotale||"—"}</span>
                      {formulaireCalc.detentionTotale>0&&<span style={{fontSize:"0.8rem",color:"var(--text-dim)",fontWeight:500}}>min</span>}
                    </div>
                    {formulaireCalc.detentionConversion>0&&(
                      <div style={{marginTop:"0.35rem",fontSize:"0.62rem",color:"var(--text-dim)"}}>
                        Base {formulaireCalc.detentionBase} min + conversion {formulaireCalc.detentionConversion} min
                        <span style={{color:"var(--text-dim)",marginLeft:"0.25rem"}}>(excès amende ×0,008)</span>
                      </div>
                    )}
                  </div>
                  {/* Retenue active */}
                  {hasCharges&&(
                    <div style={{padding:"0.5rem 0.75rem",borderRadius:"var(--radius)",background:retenueData.color+"12",border:`1px solid ${retenueData.color}30`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>{retenueData.desc}</div>
                      <div style={{fontWeight:900,fontSize:"0.875rem",color:retenueData.color,letterSpacing:"0.06em",marginLeft:"0.5rem",flexShrink:0}}>{retenue}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                <button className="btn btn-outline" onClick={exportFormulaire} style={{justifyContent:"center"}}>📋 Copier le formulaire</button>
                <button className="btn btn-outline" onClick={()=>window.print()} style={{justifyContent:"center"}}>🖨️ Imprimer</button>
                <button className="btn btn-gold" disabled={!hasCharges} onClick={()=>{setClientName(`${prenomPrev} ${nomPrev}`.trim());(window as any).__facMontant=formulaireCalc.honBase;(window as any).__facDesc=`Inculpation Defcon ${defcon} — Retenue ${retenue} — ${lignes.filter(l=>l.chef).map(l=>l.chef!.infraction.slice(0,30)).join(", ")}`;setShowFac(true);}} style={{justifyContent:"center",opacity:!hasCharges?0.4:1}}>🧾 Émettre la facture</button>
                <button className="btn btn-ghost" onClick={()=>{setLignes([newLigne()]);setPrenomPrev("");setNomPrev("");setMatricule("");setDroitSoins(false);setDroitNourriture(false);setDroitPlaide(false);setIntervenant("avocat");setRetenue("NOMINAL");setDefcon(5);}} style={{justifyContent:"center",fontSize:"0.78rem"}}>Réinitialiser</button>
              </div>
            </div>

            {/* ─── TABLEAU CHEFS ─── */}
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                  <div>
                    <div className="section-title" style={{marginBottom:"0.2rem"}}>Chefs d'inculpation</div>
                    <div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>
                      {lignes.filter(l=>l.chef).length} chef{lignes.filter(l=>l.chef).length!==1?"s":""} retenus
                      {formulaireCalc.detentionBase>0&&` · ${formulaireCalc.detentionBase} min base`}
                      {hasCrime&&<span style={{color:"#7c3aed",marginLeft:"0.4rem"}}>· Crime présent (plafond 35 000$)</span>}
                    </div>
                  </div>
                  <button className="btn btn-gold btn-sm" onClick={()=>setLignes(ls=>[...ls,newLigne()])}>+ Ajouter</button>
                </div>

                {/* Filtre + légende */}
                <div style={{display:"flex",gap:"0.35rem",marginBottom:"0.875rem",flexWrap:"wrap",alignItems:"center"}}>
                  {["", ...CATEGORIES].map(cat=>(
                    <button key={cat||"all"} onClick={()=>setFilterCat(cat)} style={{padding:"0.2rem 0.65rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.7rem",fontWeight:filterCat===cat?700:400,background:filterCat===cat?(cat?CAT_COLORS[cat]+"18":"var(--gold-muted)"):"var(--surface)",border:`1px solid ${filterCat===cat?(cat?CAT_COLORS[cat]+"40":"rgba(201,168,76,0.4)"):"var(--border)"}`,color:filterCat===cat?(cat?CAT_COLORS[cat]:"var(--gold)"):"var(--text-muted)"}}>
                      {cat||"Toutes"}{cat&&` (${fmt(PLAFONDS[cat]||0)})`}
                    </button>
                  ))}
                  <span style={{fontSize:"0.6rem",color:"var(--text-dim)",marginLeft:"auto"}}>⚑ = chef ciblé Defcon · Tent.×{TAUX_TENTATIVE} · Comp.×{TAUX_COMPLICITE} · Atté.×{TAUX_ATTENUATION}</span>
                </div>

                {/* En-têtes */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px 60px 20px",gap:"0.4rem",padding:"0 0.5rem 0.5rem",borderBottom:"1px solid var(--border)",marginBottom:"0.5rem"}}>
                  {["Infraction","Tent.","Comp.","Atté.","Qté",""].map(h=>(
                    <div key={h} style={{fontSize:"0.6rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:h==="Tent."||h==="Comp."||h==="Atté."||h==="Qté"?"center":"left"}}>{h}</div>
                  ))}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                  {lignes.map((ligne,idx)=>{
                    const col=ligne.chef?CAT_COLORS[ligne.chef.categorie]:"var(--border)";
                    const chefsFiltres=CHEFS_PENAL.filter(c=>(!filterCat||c.categorie===filterCat)&&c.infraction.toLowerCase().includes(ligne.search.toLowerCase()));
                    return(
                      <div key={ligne.id} style={{borderRadius:"var(--radius)",border:`1px solid ${col}30`,borderLeft:`3px solid ${col}`,position:"relative"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 52px 52px 52px 60px 20px",gap:"0.4rem",padding:"0.5rem"}}>
                          {/* Infraction */}
                          <div style={{position:"relative"}}>
                            {ligne.chef?(
                              <button onClick={()=>updateLigne(ligne.id,{chef:null,search:"",showPicker:false})} style={{display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left",fontFamily:"'Inter',sans-serif"}}>
                                {ligne.chef.cible&&<span title="Chef ciblé Defcon" style={{fontSize:"0.6rem",color:dc.couleur,flexShrink:0}}>⚑</span>}
                                <span style={{fontSize:"0.78rem",fontWeight:500,color:"var(--text)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ligne.chef.infraction}</span>
                                <span style={{fontSize:"0.6rem",color:"var(--text-dim)",flexShrink:0}}>×</span>
                              </button>
                            ):(
                              <input placeholder="Rechercher une infraction…" value={ligne.search} onChange={e=>updateLigne(ligne.id,{search:e.target.value,showPicker:true})} onFocus={()=>updateLigne(ligne.id,{showPicker:true})} style={{width:"100%",fontSize:"0.78rem",padding:"0.3rem 0.5rem",color:"var(--text)",background:"var(--surface)"}} autoFocus={idx===lignes.length-1&&idx>0}/>
                            )}
                            {ligne.showPicker&&!ligne.chef&&ligne.search&&(
                              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",zIndex:50,maxHeight:220,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
                                {CATEGORIES.map(cat=>{
                                  const items=chefsFiltres.filter(c=>c.categorie===cat);
                                  if(!items.length)return null;
                                  return(
                                    <div key={cat}>
                                      <div style={{fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:CAT_COLORS[cat],padding:"0.4rem 0.75rem 0.2rem",fontWeight:700,position:"sticky",top:0,background:"var(--card)"}}>{cat} — plafond {fmt(PLAFONDS[cat]||0)}</div>
                                      {items.map(c=>(
                                        <button key={c.infraction} onMouseDown={()=>selectChef(ligne.id,c)} style={{display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",padding:"0.4rem 0.75rem",background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left"}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                                          {c.cible&&<span style={{fontSize:"0.58rem",color:dc.couleur,flexShrink:0}} title="Chef ciblé">⚑</span>}
                                          <span style={{fontSize:"0.76rem",flex:1}}>{c.infraction}</span>
                                          <span style={{fontSize:"0.62rem",color:"var(--text-dim)",flexShrink:0}}>{c.detentionMin>0?`${c.detentionMin}min`:"—"}</span>
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })}
                                {chefsFiltres.length===0&&<div style={{padding:"0.75rem",color:"var(--text-dim)",fontSize:"0.78rem",textAlign:"center"}}>Aucun résultat</div>}
                              </div>
                            )}
                          </div>
                          {/* Tentative */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>updateLigne(ligne.id,{tentative:!ligne.tentative})} title="Tentative ×0.9" style={{width:22,height:22,borderRadius:4,border:`2px solid ${ligne.tentative?"var(--warning)":"var(--border-light)"}`,background:ligne.tentative?"rgba(245,158,11,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:900,color:"var(--warning)",transition:"all 0.15s"}}>{ligne.tentative&&"✓"}</button>
                          </div>
                          {/* Complicité */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>updateLigne(ligne.id,{complicite:!ligne.complicite})} title="Complicité ×0.8" style={{width:22,height:22,borderRadius:4,border:`2px solid ${ligne.complicite?"var(--info)":"var(--border-light)"}`,background:ligne.complicite?"rgba(99,102,241,0.12)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:900,color:"var(--info)",transition:"all 0.15s"}}>{ligne.complicite&&"✓"}</button>
                          </div>
                          {/* Atténuation */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>updateLigne(ligne.id,{attenuation:!ligne.attenuation})} title="Atténuation ×0.8" style={{width:22,height:22,borderRadius:4,border:`2px solid ${ligne.attenuation?"#22c55e":"var(--border-light)"}`,background:ligne.attenuation?"rgba(34,197,94,0.12)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:900,color:"#22c55e",transition:"all 0.15s"}}>{ligne.attenuation&&"✓"}</button>
                          </div>
                          {/* Quantité */}
                          <div style={{display:"flex",alignItems:"center"}}>
                            <input type="number" min={1} max={9999} value={ligne.quantite} onChange={e=>updateLigne(ligne.id,{quantite:Math.max(1,parseInt(e.target.value)||1)})} style={{width:"100%",textAlign:"center",padding:"0.3rem 0.2rem",fontSize:"0.8rem"}}/>
                          </div>
                          {/* Supprimer */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>removeLigne(ligne.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)",fontSize:"0.9rem",lineHeight:1,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>×</button>
                          </div>
                        </div>
                        {ligne.chef&&(
                          <div style={{display:"flex",gap:"0.75rem",padding:"0.25rem 0.5rem 0.4rem",borderTop:"1px solid var(--border)",flexWrap:"wrap",alignItems:"center"}}>
                            <span style={{fontSize:"0.63rem",color:col}}>{ligne.chef.categorie}</span>
                            {ligne.chef.detentionMin>0&&<span style={{fontSize:"0.63rem",color:"var(--text-dim)"}}>⏱ {ligne.chef.detentionMin}min{ligne.tentative?` →×${TAUX_TENTATIVE}`:""}{ligne.complicite?` →×${TAUX_COMPLICITE}`:""}{ligne.attenuation?` →×${TAUX_ATTENUATION}`:""}{ligne.quantite>1?` ×${ligne.quantite}`:""}</span>}
                            {ligne.chef.amendeNum>0&&(
                              <span style={{fontSize:"0.63rem",color:"var(--text-dim)"}}>
                                💰 {fmt(ligne.chef.amendeNum)}
                                {ligne.chef.cible&&dc.modCible>1?` ⚑→×${dc.modCible}`:dc.modGlobal>1?` →×${dc.modGlobal}`:""}
                                {` (plaf. ${fmt(PLAFONDS[ligne.chef.categorie]||0)})`}
                              </span>
                            )}
                            <span style={{fontSize:"0.63rem",color:"var(--gold)",marginLeft:"auto"}}>Hon.: {fmt(HON_PAR_CAT[ligne.chef.categorie]||0)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-outline" onClick={()=>setLignes(ls=>[...ls,newLigne()])} style={{width:"100%",justifyContent:"center",marginTop:"0.75rem",fontSize:"0.8rem"}}>+ Ajouter un chef</button>
              </div>

              {/* Récap honoraires */}
              {hasCharges&&(
                <div className="card" style={{border:"1px solid rgba(201,168,76,0.2)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.625rem"}}>
                    <div className="section-title" style={{marginBottom:0}}>Honoraires estimés</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.4rem",color:"var(--gold)"}}>{fmt(formulaireCalc.honBase)}</div>
                  </div>
                  <div style={{display:"flex",gap:"0.875rem",flexWrap:"wrap",marginBottom:"0.5rem"}}>
                    {CATEGORIES.map(cat=>{
                      const n=lignes.filter(l=>l.chef?.categorie===cat).reduce((s,l)=>s+(l.quantite||1),0);
                      if(!n)return null;
                      return<span key={cat} style={{fontSize:"0.72rem",color:CAT_COLORS[cat]}}>{n}× {cat} = {fmt((HON_PAR_CAT[cat]||0)*n)}</span>;
                    })}
                  </div>
                  <div style={{fontSize:"0.7rem",color:"var(--text-dim)"}}>Modificateurs de risque configurables dans l'onglet "Défense pénale"</div>
                </div>
              )}

              {/* ─── APERÇU FORMULAIRE DE PRISON ─── */}
              {/* print-target: formulaire-preview */
              <div style={{ fontWeight:700, fontSize:"0.78rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:"0.5rem" }}>
                Aperçu — Formulaire de Prison
              </div>
              <div style={{
                background:"rgba(10,22,40,0.95)", border:`2px solid rgba(201,168,76,0.4)`,
                borderRadius:"var(--radius-lg)", overflow:"hidden", fontSize:"0.72rem", fontFamily:"'Inter',sans-serif",
              }}>
                {/* Header */}
                <div style={{ background:"rgba(13,31,60,0.9)", borderBottom:"1px solid rgba(201,168,76,0.3)", padding:"0.55rem 1rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontWeight:900, fontSize:"0.85rem", color:"#c9a84c", letterSpacing:"0.04em" }}>FORMULAIRE DE PRISON — San Andreas</div>
                  <div style={{ border:`2px solid ${dc.couleur}60`, borderRadius:4, padding:"0.2rem 0.75rem", fontWeight:900, fontSize:"0.8rem", color:dc.couleur }}>Defcon {defcon}</div>
                </div>
                {/* Ligne prévenu */}
                <div style={{ display:"grid", gridTemplateColumns:"auto auto auto 1fr", borderBottom:"1px solid rgba(201,168,76,0.15)" }}>
                  {[
                    ["En Date du", new Date().toLocaleDateString("fr-FR")+" à "+new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})],
                    ["Le Prévenu",  prenomPrev||nomPrev?`${prenomPrev} ${nomPrev}`.trim():"—"],
                    ["Matricule(s)", matricule||"—"],
                  ].map(([label, val], i)=>(
                    <div key={i} style={{ padding:"0.3rem 0.75rem", background:i%2===0?"rgba(13,31,60,0.7)":"rgba(17,34,64,0.7)", borderRight:"1px solid rgba(201,168,76,0.12)", display:"flex", alignItems:"center", gap:"0.4rem", whiteSpace:"nowrap" }}>
                      <span style={{ color:"rgba(139,167,199,0.7)", fontSize:"0.6rem", flexShrink:0 }}>{label}</span>
                      <span style={{ color:"#e0e8f0", fontWeight:600, fontSize:"0.7rem" }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ padding:"0.3rem", background:"rgba(13,31,60,0.5)" }}/>
                </div>
                {/* Corps */}
                <div style={{ display:"grid", gridTemplateColumns:"195px 1fr" }}>
                  {/* Gauche */}
                  <div style={{ borderRight:"1px solid rgba(201,168,76,0.15)", padding:"0.625rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    {/* Droits */}
                    <div style={{ background:"rgba(13,31,60,0.5)", borderRadius:4, padding:"0.5rem", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.58rem", marginBottom:"0.35rem" }}>Droits du prévenu</div>
                      <div style={{ display:"flex", gap:"0.75rem" }}>
                        {([["Soins",droitSoins],["Nourriture",droitNourriture],["Plaider",droitPlaide&&!hasCrime]] as [string,boolean][]).map(([l,v])=>(
                          <div key={l} style={{ textAlign:"center" }}>
                            <div style={{ width:14,height:14,border:`2px solid ${v?"rgba(34,197,94,0.6)":"rgba(201,168,76,0.25)"}`,borderRadius:3,background:v?"rgba(34,197,94,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 0.2rem" }}>
                              {v&&<span style={{color:"#22c55e",fontSize:"0.55rem",fontWeight:900}}>✓</span>}
                            </div>
                            <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.58rem" }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Intervenant */}
                    <div style={{ background:"rgba(13,31,60,0.5)", borderRadius:4, padding:"0.5rem", border:"1px solid rgba(201,168,76,0.12)" }}>
                      <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.58rem", marginBottom:"0.35rem" }}>Intervenant</div>
                      {([{key:"avocat",label:"Avocat",col:"rgba(34,197,94,0.7)"},{key:"procureur",label:"Procureur/Juge",col:"rgba(59,130,246,0.7)"},{key:"cs",label:"CS/Sgt.II",col:"rgba(100,116,139,0.7)"}] as const).map(o=>(
                        <div key={o.key} style={{ display:"flex",alignItems:"center",gap:"0.4rem",marginBottom:"0.25rem" }}>
                          <div style={{ width:14,height:14,border:`2px solid ${intervenant===o.key?o.col:"rgba(201,168,76,0.2)"}`,borderRadius:3,background:intervenant===o.key?o.col.replace("0.7","0.12"):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                            {intervenant===o.key&&<span style={{color:o.col,fontSize:"0.55rem",fontWeight:900}}>✓</span>}
                          </div>
                          <span style={{ color:intervenant===o.key?"#e0e8f0":"rgba(139,167,199,0.5)", fontSize:"0.68rem", fontWeight:intervenant===o.key?600:400 }}>{o.label}</span>
                        </div>
                      ))}
                      {/* Nom avocat libre */}
                      <div style={{ marginTop:"0.35rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                        <span style={{ fontSize:"0.6rem", color:"rgba(139,167,199,0.5)", flexShrink:0 }}>Nom :</span>
                        <input
                          placeholder={user?.nom||"Nom avocat…"}
                          defaultValue={user?.nom||""}
                          style={{ flex:1,fontSize:"0.65rem",padding:"0.15rem 0.35rem",background:"rgba(17,34,64,0.7)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:3,color:"#e0e8f0" }}
                        />
                      </div>
                    </div>
                    {/* Résultats */}
                    <div style={{ background:"rgba(13,31,60,0.5)", borderRadius:4, padding:"0.5rem", border:"1px solid rgba(201,168,76,0.18)" }}>
                      <div style={{ marginBottom:"0.4rem" }}>
                        <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.6rem" }}>Le Prévenu doit être mis en Prison :</div>
                        <div style={{ display:"flex",alignItems:"center",gap:"0.4rem",marginTop:"0.2rem" }}>
                          <div style={{ background:"rgba(17,34,64,0.8)",border:"1px solid rgba(201,168,76,0.25)",borderRadius:3,padding:"0.15rem 0.625rem",color:formulaireCalc.detentionTotale>0?"#e0e8f0":"rgba(139,167,199,0.4)",fontWeight:700,fontSize:"0.8rem",minWidth:44,textAlign:"center" }}>
                            {formulaireCalc.detentionTotale||"—"}
                          </div>
                          <span style={{ background:"rgba(245,158,11,0.75)",color:"#000",fontWeight:700,fontSize:"0.6rem",padding:"0.1rem 0.4rem",borderRadius:3 }}>Minutes</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.6rem" }}>Pour une Amende totale de :</div>
                        <div style={{ background:"rgba(17,34,64,0.8)",border:"1px solid rgba(201,168,76,0.25)",borderRadius:3,padding:"0.15rem 0.625rem",color:formulaireCalc.amendeFinale>0?"#c9a84c":"rgba(139,167,199,0.4)",fontWeight:700,fontSize:"0.78rem",marginTop:"0.2rem",display:"inline-block" }}>
                          {formulaireCalc.amendeFinale>0?fmt(formulaireCalc.amendeFinale):"—"}
                        </div>
                      </div>
                    </div>
                    {/* Retenue */}
                    <div style={{ background:"rgba(13,31,60,0.5)", borderRadius:4, padding:"0.5rem", border:`1px solid ${retenueData.color}35` }}>
                      <div style={{ display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.35rem" }}>
                        <span style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.6rem", flexShrink:0 }}>Retenue :</span>
                        <span style={{ background:retenueData.color,color:"#000",fontWeight:900,fontSize:"0.68rem",padding:"0.1rem 0.55rem",borderRadius:3,letterSpacing:"0.05em" }}>{retenue}</span>
                        <span style={{ color:retenueData.color, fontSize:"0.6rem", fontWeight:700 }}>×{retenueData.coeff}</span>
                      </div>
                      <div style={{ background:`${retenueData.color}10`,border:`1px solid ${retenueData.color}30`,borderRadius:4,padding:"0.35rem 0.5rem" }}>
                        <div style={{ color:"rgba(139,167,199,0.6)", fontSize:"0.58rem", marginBottom:"0.15rem" }}>Conditions :</div>
                        <div style={{ color:retenueData.color, fontSize:"0.63rem", fontStyle:"italic", lineHeight:1.4 }}>{retenueData.desc}</div>
                        {retenueData.tier==="max"&&<div style={{ fontSize:"0.58rem",color:"rgba(239,68,68,0.6)",marginTop:"0.2rem" }}>⚠ Approbation CS/SGT2 ou Juge requise</div>}
                      </div>
                    </div>
                  </div>
                  {/* Tableau charges */}
                  <div style={{ overflowX:"auto" }}>
                    <div style={{ display:"grid",gridTemplateColumns:"90px 55px 60px 45px 1fr 60px",background:"rgba(26,58,92,0.5)",borderBottom:"1px solid rgba(201,168,76,0.2)",minWidth:380 }}>
                      {["Catégorie","Tentative","Complicité","Qté","Charge retenue","Atténuat."].map(h=>(
                        <div key={h} style={{ padding:"0.3rem 0.35rem",fontSize:"0.57rem",fontWeight:700,color:"rgba(201,168,76,0.85)",textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{h}</div>
                      ))}
                    </div>
                    {lignes.filter(l=>l.chef).length===0?(
                      <div style={{ padding:"2rem",textAlign:"center",color:"rgba(139,167,199,0.4)",fontSize:"0.72rem" }}>Aucun chef renseigné</div>
                    ):lignes.filter(l=>l.chef).map((l,i)=>{
                      const cat=l.chef!.categorie;
                      const catBg:Record<string,string>={"Crime":"rgba(139,26,26,0.5)","Délit majeur":"rgba(180,80,26,0.5)","Délit mineur":"rgba(150,115,10,0.45)","Contravention":"rgba(42,74,107,0.5)"};
                      const catCol:Record<string,string>={"Crime":"#ffa0a0","Délit majeur":"#ffc090","Délit mineur":"#ffe090","Contravention":"#90c8e8"};
                      return(
                        <div key={l.id} style={{ display:"grid",gridTemplateColumns:"90px 55px 60px 45px 1fr 60px",background:i%2===0?"rgba(13,31,60,0.4)":"rgba(17,34,64,0.4)",borderBottom:"1px solid rgba(201,168,76,0.08)",alignItems:"center",minWidth:380 }}>
                          <div style={{ padding:"0.3rem 0.35rem",background:catBg[cat]||"rgba(26,58,92,0.4)",textAlign:"center" }}>
                            <span style={{ fontSize:"0.58rem",fontWeight:700,color:catCol[cat]||"#fff",whiteSpace:"nowrap" }}>{cat}</span>
                          </div>
                          <div style={{ textAlign:"center",fontSize:"0.65rem",padding:"0.3rem" }}>{l.tentative?<span style={{color:"rgba(245,158,11,0.85)",fontWeight:700}}>✓</span>:<span style={{color:"rgba(139,167,199,0.2)"}}>—</span>}</div>
                          <div style={{ textAlign:"center",fontSize:"0.65rem",padding:"0.3rem" }}>{l.complicite?<span style={{color:"rgba(99,130,246,0.85)",fontWeight:700}}>✓</span>:<span style={{color:"rgba(139,167,199,0.2)"}}>—</span>}</div>
                          <div style={{ textAlign:"center",fontWeight:700,color:"#e0e8f0",fontSize:"0.7rem",padding:"0.3rem" }}>{l.quantite}</div>
                          <div style={{ padding:"0.3rem 0.5rem",color:"rgba(200,216,232,0.9)",fontSize:"0.67rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.chef!.infraction}</div>
                          <div style={{ textAlign:"center",fontSize:"0.63rem",color:l.attenuation?"rgba(34,197,94,0.75)":"rgba(139,167,199,0.3)",padding:"0.3rem" }}>{l.attenuation?"Oui":"Non"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Tableau de référence des taux */}
              <div className="card" style={{background:"var(--surface)"}}>
                <div className="section-title" style={{marginBottom:"0.75rem"}}>Référence — Taux des charges</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 60px 60px",gap:"0.3rem"}}>
                  <div style={{fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em"}}>Type</div>
                  <div style={{fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"center"}}>OUI</div>
                  <div style={{fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:"center"}}>NON</div>
                  {[{label:"Tentative",v:TAUX_TENTATIVE},{label:"Complicité",v:TAUX_COMPLICITE},{label:"Atténuation",v:TAUX_ATTENUATION},{label:"Appel avocat",v:1}].map(r=>(
                    <>
                      <div key={r.label+"l"} style={{fontSize:"0.75rem",color:"var(--text-muted)",padding:"0.2rem 0"}}>{r.label}</div>
                      <div key={r.label+"o"} style={{fontSize:"0.75rem",fontWeight:700,color:r.v<1?"var(--success)":"var(--text-dim)",textAlign:"center"}}>{r.v}</div>
                      <div key={r.label+"n"} style={{fontSize:"0.75rem",color:"var(--text-dim)",textAlign:"center"}}>1</div>
                    </>
                  ))}
                </div>
                <div style={{marginTop:"0.75rem",padding:"0.5rem",background:"var(--card)",borderRadius:"var(--radius)",fontSize:"0.7rem",color:"var(--text-dim)"}}>
                  <span style={{color:"var(--gold)",fontWeight:600}}>Conversion amende → prison</span> · 1$ au-delà de {fmt(SEUIL_CONVERSION)} = {TAUX_CONVERSION} min de détention supplémentaire
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal facture */}
      {showFac&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowFac(false)}>
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">Émettre une facture</h2><button className="modal-close" onClick={()=>setShowFac(false)}>×</button></div>
            <div className="modal-body">
              <div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.875rem 1rem",borderLeft:"3px solid var(--gold)",marginBottom:"1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:"var(--gold)"}}>
                  <span>{mode==="formulaire"?`Formulaire — Defcon ${defcon} — ${retenue}`:mode==="penal"?"Défense pénale":serviceActuel?.label}</span>
                  <span>{fmt(mode==="formulaire"?formulaireCalc.honBase:totalHon)}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Client *</label>
                <input list="fac-clients" placeholder="Choisir parmi vos clients" value={clientName} onChange={e=>setClientName(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&creerFacture(mode==="formulaire"?formulaireCalc.honBase:totalHon,(window as any).__facDesc||"")}/>
                <datalist id="fac-clients">{clientsList.map(c=><option key={c} value={c}/>)}</datalist>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowFac(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={()=>creerFacture(mode==="formulaire"?formulaireCalc.honBase:totalHon,(window as any).__facDesc||"")} disabled={creating||!clientName.trim()} style={{opacity:creating?0.7:1}}>{creating?"Création…":"🧾 Émettre la facture"}</button>
            </div>
          </div>
        </div>
      )}

      {toast&&(
        <div className="toast-container">
          <div className="toast toast-success" style={{cursor:facCreated?"pointer":"default"}} onClick={()=>facCreated&&router.push("/factures")}>
            ✅ {toast}{facCreated&&<span style={{color:"var(--gold)",marginLeft:"0.5rem",textDecoration:"underline"}}>→ Voir les factures</span>}
          </div>
        </div>
      )}
    </div>
  );
}
