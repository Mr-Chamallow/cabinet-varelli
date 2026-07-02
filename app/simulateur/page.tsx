"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

/* ─── CODE PÉNAL complet avec détentions ──────────────────────────────────── */
const CHEFS_PENAL = [
  { code:"C-5",    infraction:"Conduite dangereuse",                 categorie:"Contravention", amende:2700,   detention:0,  cible:false },
  { code:"C-7",    infraction:"Excès de vitesse",                    categorie:"Contravention", amende:1800,   detention:0,  cible:false },
  { code:"C-9",    infraction:"Holster interdit",                    categorie:"Contravention", amende:1350,   detention:0,  cible:false },
  { code:"C-18",   infraction:"Consommation de drogue",              categorie:"Contravention", amende:450,    detention:0,  cible:false },
  { code:"DM-1",   infraction:"Agression sur citoyen",               categorie:"Délit mineur",  amende:4500,   detention:30, cible:false },
  { code:"DM-6",   infraction:"Braquage de supérette",               categorie:"Délit mineur",  amende:3600,   detention:20, cible:true  },
  { code:"DM-7",   infraction:"Braquage/piratage ATM",               categorie:"Délit mineur",  amende:2250,   detention:15, cible:true  },
  { code:"DM-8",   infraction:"Cambriolage",                         categorie:"Délit mineur",  amende:1350,   detention:15, cible:false },
  { code:"DM-12",  infraction:"Délit de fuite",                      categorie:"Délit mineur",  amende:1350,   detention:15, cible:false },
  { code:"DM-13",  infraction:"Entrave à une opération police",      categorie:"Délit mineur",  amende:3500,   detention:30, cible:false },
  { code:"DM-15",  infraction:"Exhibition d'armes de poing",         categorie:"Délit mineur",  amende:1350,   detention:15, cible:false },
  { code:"DM-16",  infraction:"Exhibition d'armes lourdes",          categorie:"Délit mineur",  amende:4500,   detention:30, cible:false },
  { code:"DM-20",  infraction:"Utilisation d'une arme à feu",        categorie:"Délit mineur",  amende:1350,   detention:15, cible:false },
  { code:"DM-21",  infraction:"Intrusion zone restreinte",           categorie:"Délit mineur",  amende:3200,   detention:30, cible:false },
  { code:"DM-22",  infraction:"Menace/intimidation envers civil",    categorie:"Délit mineur",  amende:3500,   detention:15, cible:false },
  { code:"DM-23",  infraction:"Mise en danger de la vie d'autrui",   categorie:"Délit mineur",  amende:5800,   detention:15, cible:false },
  { code:"DM-26",  infraction:"Non présentation à convocation",      categorie:"Délit mineur",  amende:6750,   detention:20, cible:false },
  { code:"DM-47",  infraction:"Possession de pistolet",              categorie:"Délit mineur",  amende:15000,  detention:20, cible:false },
  { code:"DM-78",  infraction:"Possession de cannabis (par unité)",  categorie:"Délit mineur",  amende:32,     detention:10, cible:false },
  { code:"DM-79",  infraction:"Possession de cocaïne (par unité)",   categorie:"Délit mineur",  amende:45,     detention:10, cible:false },
  { code:"DM-84",  infraction:"Possession d'héroïne (par unité)",    categorie:"Délit mineur",  amende:72,     detention:10, cible:false },
  { code:"DM-124", infraction:"Vente de drogue",                     categorie:"Délit mineur",  amende:3750,   detention:10, cible:false },
  { code:"DM-127", infraction:"Refus d'obtempérer",                  categorie:"Délit mineur",  amende:900,    detention:15, cible:false },
  { code:"DM-133", infraction:"Vol",                                  categorie:"Délit mineur",  amende:1350,   detention:15, cible:false },
  { code:"DM-144", infraction:"Évasion du poste de police",          categorie:"Délit mineur",  amende:7500,   detention:20, cible:false },
  { code:"DMJ-9",  infraction:"Agression sur agent / police",        categorie:"Délit majeur",  amende:8500,   detention:60, cible:false },
  { code:"DMJ-11", infraction:"Menaces de mort / menaces graves",    categorie:"Délit majeur",  amende:8500,   detention:45, cible:false },
  { code:"DMJ-13", infraction:"Homicide involontaire",               categorie:"Délit majeur",  amende:12500,  detention:25, cible:false },
  { code:"DMJ-14", infraction:"Association de malfaiteurs",          categorie:"Délit majeur",  amende:4500,   detention:30, cible:false },
  { code:"DMJ-17", infraction:"Braquage bijouterie/supermarché",     categorie:"Délit majeur",  amende:9000,   detention:30, cible:true  },
  { code:"DMJ-18", infraction:"Braquage banque centrale",            categorie:"Délit majeur",  amende:25000,  detention:60, cible:true  },
  { code:"DMJ-21", infraction:"Braquage banque (Fleeca)",            categorie:"Délit majeur",  amende:15000,  detention:25, cible:true  },
  { code:"DMJ-28", infraction:"Faux témoignage",                     categorie:"Délit majeur",  amende:9000,   detention:30, cible:false },
  { code:"DMJ-36", infraction:"Participation à une fusillade",       categorie:"Délit majeur",  amende:3500,   detention:30, cible:false },
  { code:"DMJ-54", infraction:"Possession de fusil d'assaut",        categorie:"Délit majeur",  amende:35000,  detention:25, cible:false },
  { code:"DMJ-83", infraction:"Prise d'otage sur civil",             categorie:"Délit majeur",  amende:4500,   detention:15, cible:true  },
  { code:"DMJ-91", infraction:"Vol à main armée",                    categorie:"Délit majeur",  amende:5000,   detention:30, cible:true  },
  { code:"DMJ-100",infraction:"Corruption",                          categorie:"Délit majeur",  amende:22500,  detention:30, cible:false },
  { code:"DMJ-101",infraction:"Fraude fiscale",                      categorie:"Délit majeur",  amende:90000,  detention:30, cible:false },
  { code:"CR-2",   infraction:"Blanchiment",                         categorie:"Crime",         amende:0,      detention:15, cible:true  },
  { code:"CR-4",   infraction:"Assassinat prémédité (MORT RP)",      categorie:"Crime",         amende:225000, detention:60, cible:true  },
  { code:"CR-8",   infraction:"Meurtre (MORT RP)",                   categorie:"Crime",         amende:100800, detention:60, cible:true  },
  { code:"CR-11",  infraction:"Cavale",                              categorie:"Crime",         amende:9000,   detention:60, cible:true  },
  { code:"CR-15",  infraction:"Meurtre représentant État (MORT RP)", categorie:"Crime",         amende:300000, detention:30, cible:true  },
  { code:"CR-17",  infraction:"Meurtre (COMA)",                      categorie:"Crime",         amende:18000,  detention:30, cible:true  },
  { code:"CR-19",  infraction:"Possession de grenade",               categorie:"Crime",         amende:135000, detention:30, cible:true  },
  { code:"CR-21",  infraction:"Prise d'otage représentant État",     categorie:"Crime",         amende:18000,  detention:30, cible:true  },
  { code:"CR-22",  infraction:"Séquestration",                       categorie:"Crime",         amende:15500,  detention:30, cible:true  },
  { code:"CR-23",  infraction:"Terrorisme",                          categorie:"Crime",         amende:45000,  detention:60, cible:true  },
  { code:"CR-31",  infraction:"Violation du secret professionnel",   categorie:"Crime",         amende:22500,  detention:30, cible:true  },
];

/* ─── Defcon ──────────────────────────────────────────────────────────────── */
const DEFCON_DATA = {
  5: { label:"Situation de base",                    desc:"Rien à signaler sur le territoire",           couleur:"#3b82f6", modGlobal:1,    modCible:1,   amendePolicePhrasing:"RAS"         },
  4: { label:"Potentielle menace sécurité publique", desc:"Risque accru à la sécurité publique",         couleur:"#22c55e", modGlobal:1,    modCible:1,   amendePolicePhrasing:"RAS"         },
  3: { label:"Menace sécurité publique en cours",    desc:"Menaces avec attaques ciblées",               couleur:"#f59e0b", modGlobal:1,    modCible:1.5, amendePolicePhrasing:"×1.5 ciblé"  },
  2: { label:"Sécurité publique sous haute tension", desc:"Multiples attaques sur le territoire",        couleur:"#f97316", modGlobal:1.25, modCible:2,   amendePolicePhrasing:"×2 ciblé, ×1.25 reste" },
  1: { label:"L'état est en guerre",                 desc:"Guérilla urbaine / guerre",                   couleur:"#ef4444", modGlobal:2,    modCible:3.5, amendePolicePhrasing:"×3.5 ciblé, ×2 reste"  },
} as const;

/* ─── Retenue ─────────────────────────────────────────────────────────────── */
const RETENUES = [
  { key:"NOMINAL",   label:"NOMINAL",   color:"#f59e0b", desc:"Situation de base / peu coopératif" },
  { key:"MODEREE",   label:"MODÉRÉE",   color:"#f97316", desc:"Comportement partiellement coopératif" },
  { key:"SEVERE",    label:"SÉVÈRE",    color:"#ef4444", desc:"Non coopératif / circonstances aggravantes" },
  { key:"MAXIMALE",  label:"MAXIMALE",  color:"#7c3aed", desc:"Refus total / récidive lourde" },
] as const;

/* ─── Honoraires existants ────────────────────────────────────────────────── */
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

const CAT_COLORS: Record<string,string> = {
  "Contravention":"#64748b","Délit mineur":"#f59e0b","Délit majeur":"#ef4444","Crime":"#7c3aed",
};
const CATEGORIES = ["Contravention","Délit mineur","Délit majeur","Crime"];
const HON_PAR_CAT: Record<string,number> = { "Contravention":1500,"Délit mineur":3000,"Délit majeur":8000,"Crime":15000 };

type Mode = "penal"|"service"|"formulaire";
type DefconLevel = 1|2|3|4|5;
type Retenue = "NOMINAL"|"MODEREE"|"SEVERE"|"MAXIMALE";

interface LigneChef {
  id: string;
  chef: typeof CHEFS_PENAL[0]|null;
  search: string;
  showPicker: boolean;
  quantite: number;
  tentative: boolean;
  complicite: boolean;
  attenuation: string;
}
interface HistEntry { mode:Mode; label:string; total:number; date:string; }

function genId() { return Math.random().toString(36).slice(2,9); }
function genNumFac() { return `FAC-${new Date().getFullYear()}-${Math.floor(Math.random()*90000)+10000}`; }
function newLigne(): LigneChef { return { id:genId(), chef:null, search:"", showPicker:false, quantite:1, tentative:false, complicite:false, attenuation:"" }; }

const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});

export default function SimulateurPage() {
  const router = useRouter();
  const user = getUser();
  const nowRef = useRef(new Date());

  const [mode, setMode] = useState<Mode>("penal");
  const [clientsList, setClientsList] = useState<string[]>([]);

  /* ── Mode pénal honoraires ── */
  const [qCrimes, setQCrimes]   = useState(0);
  const [qMajeurs, setQMajeurs] = useState(0);
  const [qMineurs, setQMineurs] = useState(0);
  const [risque, setRisque]     = useState<Risque>("Moyen");
  const [opts, setOpts]         = useState<string[]>([]);

  /* ── Mode service ── */
  const [selectedService, setSelectedService] = useState<string|null>(null);

  /* ── Formulaire d'inculpation ── */
  const [defcon, setDefcon]         = useState<DefconLevel>(5);
  const [prenomPrev, setPrenomPrev] = useState("");
  const [nomPrev, setNomPrev]       = useState("");
  const [matricule, setMatricule]   = useState("");
  const [droitSoins, setDroitSoins]           = useState(false);
  const [droitNourriture, setDroitNourriture] = useState(false);
  const [droitPlaide, setDroitPlaide]         = useState(false);
  const [intervenant, setIntervenant] = useState<"avocat"|"procureur"|"cs">("avocat");
  const [retenue, setRetenue]         = useState<Retenue>("NOMINAL");
  const [lignes, setLignes]           = useState<LigneChef[]>([newLigne()]);
  const [filterCat, setFilterCat]     = useState("");

  /* ── Facture ── */
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

  /* ─── CALCULS HONORAIRES pénal ─────────────────────────────────────────── */
  const baseCrimes  = qCrimes  * TARIFS_PENAUX.crime.base;
  const baseMajeurs = qMajeurs * TARIFS_PENAUX.delit_majeur.base;
  const baseMineurs = qMineurs * TARIFS_PENAUX.delit_mineur.base;
  const baseTotal   = baseCrimes + baseMajeurs + baseMineurs;
  const modRisque   = MOD_RISQUE[risque];
  const modOpts     = opts.reduce((acc,k) => acc*(OPTIONS.find(o=>o.key===k)?.modif||1), 1);
  const honorairesPenal = Math.round(baseTotal * modRisque * modOpts);
  const serviceActuel   = SERVICES_FIXES.find(s=>s.key===selectedService);
  const honorairesService = serviceActuel?.prix || 0;
  const totalHon = mode==="penal" ? honorairesPenal : mode==="service" ? honorairesService : 0;

  /* ─── CALCULS FORMULAIRE ────────────────────────────────────────────────── */
  const hasCrime = lignes.some(l => l.chef?.categorie === "Crime");

  const formulaireCalc = useMemo(() => {
    const d = DEFCON_DATA[defcon];
    let detention = 0;
    let amendeRaw = 0;
    let honBase   = 0;

    for (const l of lignes) {
      if (!l.chef) continue;
      const q = Math.max(1, l.quantite||1);
      const isCible = l.chef.cible;

      /* Detention */
      let det = l.chef.detention;
      if (l.tentative)  det = Math.round(det * 0.5);
      if (l.complicite) det = Math.round(det * 0.75);
      detention += det * q;

      /* Amende brute avec Defcon */
      let am = l.chef.amende;
      if (l.tentative)  am = Math.round(am * 0.5);
      if (l.complicite) am = Math.round(am * 0.75);
      const mod = isCible ? d.modCible : d.modGlobal;
      amendeRaw += Math.round(am * mod) * q;

      /* Honoraires */
      honBase += (HON_PAR_CAT[l.chef.categorie]||0) * q;
    }

    /* Cap amende */
    const cap = hasCrime ? 25000 : 15000;
    const amende = Math.min(amendeRaw, cap);
    const cappee = amendeRaw > cap;

    return { detention, amende, amendeRaw, cappee, cap, honBase };
  }, [lignes, defcon, hasCrime]);

  /* ─── Lignes helpers ────────────────────────────────────────────────────── */
  function updateLigne(id:string, upd:Partial<LigneChef>) {
    setLignes(ls => ls.map(l => l.id===id ? {...l,...upd} : l));
  }
  function selectChef(id:string, chef:typeof CHEFS_PENAL[0]) {
    setLignes(ls => ls.map(l => l.id===id ? {...l,chef,search:"",showPicker:false} : l));
  }
  function removeLigne(id:string) {
    setLignes(ls => ls.length>1 ? ls.filter(l=>l.id!==id) : ls);
  }
  function toggleOpt(k:string) { setOpts(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]); }

  /* ─── Export formulaire ─────────────────────────────────────────────────── */
  function exportFormulaire() {
    const d = nowRef.current;
    const dt = d.toLocaleDateString("fr-FR")+" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
    const dc = DEFCON_DATA[defcon];
    const lines = [
      "╔═══════════════════════════════════════════════════╗",
      "║    FORMULAIRE D'INCULPATION — CABINET BULLHEAD    ║",
      `║    DEFCON ${defcon} — ${dc.label.padEnd(40).slice(0,40)}║`,
      "╚═══════════════════════════════════════════════════╝",
      `Date : ${dt}`,
      `Prévenu : ${prenomPrev} ${nomPrev}`.trim()||"Prévenu : Non renseigné",
      matricule ? `Matricule(s) : ${matricule}` : "",
      `Intervenant : ${intervenant==="avocat"?(user?.nom||"Avocat"):intervenant==="procureur"?"Procureur / Juge":"CS / Sgt. II"}`,
      "",
      `Droits :  Soins [${droitSoins?"✓":" "}]   Nourriture [${droitNourriture?"✓":" "}]   Plaider coupable [${(!hasCrime&&droitPlaide)?"✓":" "}]`,
      "",
      "───────────────────────────────────────────────────",
      "  CHEFS D'INCULPATION",
      "───────────────────────────────────────────────────",
      ...lignes.filter(l=>l.chef).map(l =>
        `  [${l.chef!.code}] ${l.chef!.infraction}`+
        (l.quantite>1?` × ${l.quantite}`:"")+
        (l.tentative?" (Tentative −50%)":"")+
        (l.complicite?" (Complicité −25%)":"")+
        (l.chef!.cible?" ⚑ ciblé":"")+
        (l.attenuation?`\n         Atténuation : ${l.attenuation}`:"")
      ),
      "",
      "───────────────────────────────────────────────────",
      "  RÉSULTATS",
      "───────────────────────────────────────────────────",
      `  Détention : ${formulaireCalc.detention} minute${formulaireCalc.detention!==1?"s":""}`,
      `  Amende totale : ${fmt(formulaireCalc.amende)}${formulaireCalc.cappee?" (plafond "+fmt(formulaireCalc.cap)+")":""}`,
      `  Retenue : ${retenue}`,
      "",
      "Cabinet BullHead — "+new Date().toLocaleDateString("fr-FR"),
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    showT("Formulaire copié !");
  }

  /* ─── Créer facture ─────────────────────────────────────────────────────── */
  async function creerFacture(montant:number, description:string) {
    if (!supabase||!user||!clientName.trim()||montant<=0) return;
    setCreating(true);
    const numero = genNumFac();
    const { error } = await supabase.from("factures").insert([{
      numero, client:clientName.trim(), montant, description,
      statut:"En attente", created_by:user.nom,
    }]);
    setCreating(false);
    if (!error) {
      setFacCreated(numero);
      setShowFac(false);
      showT(`Facture ${numero} créée`);
      setTimeout(()=>setFacCreated(null),5000);
    }
  }

  function openFacPenal() {
    const parts = [];
    if (qCrimes>0)  parts.push(`${qCrimes} crime${qCrimes>1?"s":""}`);
    if (qMajeurs>0) parts.push(`${qMajeurs} délit${qMajeurs>1?"s":""} majeur${qMajeurs>1?"s":""}`);
    if (qMineurs>0) parts.push(`${qMineurs} délit${qMineurs>1?"s":""} mineur${qMineurs>1?"s":""}`);
    parts.push(`Risque: ${risque}`);
    if (opts.length) parts.push(opts.map(k=>OPTIONS.find(o=>o.key===k)?.label).filter(Boolean).join(", "));
    setClientName(""); setShowFac(true);
    (window as any).__facDesc = parts.join(" · ");
    (window as any).__facMontant = totalHon;
  }

  const dc = DEFCON_DATA[defcon];
  const hasCharges = lignes.some(l=>l.chef!==null);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Simulateur juridique</h1>
          <p className="page-subtitle">Honoraires · Formulaire d'inculpation · Code pénal FlashBackFA</p>
          <div className="gold-line"/>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {([
          ["penal",      "⚖️ Défense pénale"],
          ["service",    "📋 Services civils"],
          ["formulaire", "📄 Formulaire d'inculpation"],
        ] as [Mode,string][]).map(([m,l]) => (
          <button key={m} onClick={()=>setMode(m)} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight:mode===m?700:400,
            background:mode===m?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${mode===m?"rgba(201,168,76,0.4)":"var(--border)"}`,
            color:mode===m?"var(--gold)":"var(--text-muted)", transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODE PÉNAL & SERVICE (inchangés)
          ══════════════════════════════════════════════════════════════════════ */}
      {(mode==="penal"||mode==="service") && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            {mode==="penal" ? (
              <>
                <div className="card">
                  <div className="section-title" style={{ marginBottom:"1.125rem" }}>Chefs d'inculpation</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                    {(["crime","delit_majeur","delit_mineur"] as const).map(k => {
                      const t=TARIFS_PENAUX[k];
                      const val=k==="crime"?qCrimes:k==="delit_majeur"?qMajeurs:qMineurs;
                      const set=k==="crime"?setQCrimes:k==="delit_majeur"?setQMajeurs:setQMineurs;
                      const base=k==="crime"?baseCrimes:k==="delit_majeur"?baseMajeurs:baseMineurs;
                      return (
                        <div key={k} style={{ background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.875rem 1rem",border:`1px solid ${val>0?t.color+"30":"var(--border)"}`,transition:"border-color 0.15s" }}>
                          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"0.625rem" }}>
                            <span style={{ fontWeight:600,fontSize:"0.875rem" }}>{t.label}</span>
                            <span style={{ fontSize:"0.75rem",color:"var(--text-dim)" }}>{fmt(t.base)} / unité</span>
                          </div>
                          <div style={{ display:"flex",alignItems:"center",gap:"0.625rem" }}>
                            <button onClick={()=>set(Math.max(0,val-1))} style={{ width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",flexShrink:0 }}>−</button>
                            <input type="number" min={0} value={val||""} placeholder="0" onChange={e=>set(Math.max(0,Number(e.target.value)||0))} style={{ textAlign:"center",flex:1,fontWeight:700,fontSize:"1.1rem" }}/>
                            <button onClick={()=>set(val+1)} style={{ width:32,height:32,borderRadius:8,flexShrink:0,border:`1px solid ${val>0?t.color+"50":"var(--border)"}`,background:val>0?t.color+"18":"var(--card)",color:val>0?t.color:"var(--text)",cursor:"pointer",fontSize:"1.1rem",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif" }}>+</button>
                            {val>0&&<span style={{ minWidth:80,textAlign:"right",fontWeight:600,color:t.color,fontSize:"0.85rem" }}>{fmt(base)}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {baseTotal>0&&<div style={{ display:"flex",justifyContent:"space-between",padding:"0.625rem 0.875rem",background:"var(--card)",borderRadius:"var(--radius)",borderLeft:"3px solid var(--gold)" }}>
                      <span style={{ fontSize:"0.8rem",color:"var(--text-dim)" }}>Sous-total ({qCrimes+qMajeurs+qMineurs} chef{qCrimes+qMajeurs+qMineurs!==1?"s":""})</span>
                      <span style={{ fontWeight:700,color:"var(--gold)" }}>{fmt(baseTotal)}</span>
                    </div>}
                  </div>
                </div>
                <div className="card">
                  <div className="section-title" style={{ marginBottom:"0.875rem" }}>Niveau de risque</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:"0.4rem" }}>
                    {RISQUES.map(r=>(
                      <button key={r} onClick={()=>setRisque(r)} style={{ padding:"0.45rem 0.875rem",borderRadius:8,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.8rem",fontWeight:risque===r?700:400,background:risque===r?RISQUE_COLORS[r]+"18":"var(--surface)",border:`1px solid ${risque===r?RISQUE_COLORS[r]+"50":"var(--border)"}`,color:risque===r?RISQUE_COLORS[r]:"var(--text-muted)",transition:"all 0.12s" }}>
                        {r} <span style={{opacity:0.6,fontSize:"0.72rem"}}>×{MOD_RISQUE[r].toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="section-title" style={{ marginBottom:"0.875rem" }}>Modificateurs</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:"0.4rem" }}>
                    {OPTIONS.map(o=>{
                      const active=opts.includes(o.key);
                      return (
                        <button key={o.key} onClick={()=>toggleOpt(o.key)} style={{ background:active?"var(--gold-muted)":"var(--surface)",border:`1px solid ${active?"rgba(201,168,76,0.4)":"var(--border)"}`,borderRadius:"var(--radius)",padding:"0.75rem 0.875rem",cursor:"pointer",display:"flex",gap:"0.625rem",alignItems:"flex-start",transition:"all 0.12s",textAlign:"left",fontFamily:"'Inter',sans-serif",color:active?"var(--gold)":"var(--text-muted)" }}>
                          <span style={{fontSize:"1rem"}}>{o.icon}</span>
                          <div><div style={{fontWeight:600,fontSize:"0.825rem",marginBottom:"0.1rem"}}>{o.label}</div><div style={{fontSize:"0.72rem",opacity:0.7}}>{o.desc}</div></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="card">
                <div className="section-title" style={{ marginBottom:"1rem" }}>Services civils & administratifs</div>
                {["Casier","Civil"].map(cat=>(
                  <div key={cat} style={{ marginBottom:"1.125rem" }}>
                    <div style={{ fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.5rem",fontWeight:600 }}>{cat}</div>
                    <div style={{ display:"flex",flexDirection:"column",gap:"0.375rem" }}>
                      {SERVICES_FIXES.filter(s=>s.categorie===cat).map(s=>{
                        const sel=selectedService===s.key;
                        return (
                          <button key={s.key} onClick={()=>setSelectedService(sel?null:s.key)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 1rem",borderRadius:"var(--radius)",background:sel?"var(--gold-muted)":"var(--surface)",border:`1px solid ${sel?"rgba(201,168,76,0.4)":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all 0.12s" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:"0.625rem" }}><span>{s.icon}</span><span style={{ fontSize:"0.85rem",fontWeight:sel?600:400,color:sel?"var(--gold)":"var(--text-muted)" }}>{s.label}</span></div>
                            <span style={{ fontWeight:700,color:"var(--gold)",fontSize:"0.875rem" }}>{fmt(s.prix)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Résultat honoraires */}
          <div style={{ display:"flex",flexDirection:"column",gap:"1rem" }}>
            <div style={{ background:"var(--card)",border:"2px solid rgba(201,168,76,0.3)",borderRadius:"var(--radius-xl)",padding:"2rem",textAlign:"center",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at top,rgba(201,168,76,0.05) 0%,transparent 60%)",pointerEvents:"none" }}/>
              <div style={{ fontFamily:"'Cinzel',serif",fontSize:"0.65rem",letterSpacing:"0.2em",color:"var(--text-dim)",marginBottom:"0.625rem" }}>HONORAIRES ESTIMÉS</div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:totalHon>999999?"2rem":"2.75rem",fontWeight:900,color:totalHon>0?"var(--gold)":"var(--text-dim)",lineHeight:1,marginBottom:"0.5rem" }}>
                {totalHon>0?fmt(totalHon):"—"}
              </div>
              {mode==="penal"&&baseTotal>0&&(
                <div style={{ fontSize:"0.78rem",color:"var(--text-muted)",marginBottom:"1.25rem" }}>
                  Base {fmt(baseTotal)} · {((modRisque*modOpts-1)*100)>=0?"+":""}{((modRisque*modOpts-1)*100).toFixed(0)}% modificateurs
                </div>
              )}
              {mode==="penal"&&(qCrimes+qMajeurs+qMineurs)>0&&(
                <div style={{ background:"var(--surface)",borderRadius:"var(--radius)",padding:"1rem",textAlign:"left",marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-dim)",marginBottom:"0.625rem" }}>Décomposition</div>
                  {qCrimes>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem" }}><span style={{color:"var(--text-muted)"}}>🔴 {qCrimes} crime{qCrimes>1?"s":""}</span><span style={{color:"#7c3aed",fontWeight:600}}>{fmt(baseCrimes)}</span></div>}
                  {qMajeurs>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem" }}><span style={{color:"var(--text-muted)"}}>🟠 {qMajeurs} délit{qMajeurs>1?"s":""} majeur{qMajeurs>1?"s":""}</span><span style={{color:"#ef4444",fontWeight:600}}>{fmt(baseMajeurs)}</span></div>}
                  {qMineurs>0&&<div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.35rem" }}><span style={{color:"var(--text-muted)"}}>🟡 {qMineurs} délit{qMineurs>1?"s":""} mineur{qMineurs>1?"s":""}</span><span style={{color:"#f59e0b",fontWeight:600}}>{fmt(baseMineurs)}</span></div>}
                  <div style={{ borderTop:"1px solid var(--border)",paddingTop:"0.35rem",marginTop:"0.35rem" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.2rem" }}><span style={{color:"var(--text-dim)"}}>Risque {risque}</span><span style={{color:modRisque>1?"var(--warning)":"var(--text-dim)"}}>×{modRisque.toFixed(2)}</span></div>
                    {opts.map(k=>{const o=OPTIONS.find(x=>x.key===k);if(!o)return null;return<div key={k} style={{ display:"flex",justifyContent:"space-between",fontSize:"0.8rem",marginBottom:"0.2rem" }}><span style={{color:"var(--text-dim)"}}>{o.icon} {o.label}</span><span style={{color:o.modif>1?"var(--warning)":"var(--success)"}}>×{o.modif.toFixed(2)}</span></div>;})}
                    <div style={{ borderTop:"1px solid var(--border)",paddingTop:"0.35rem",display:"flex",justifyContent:"space-between",fontWeight:700,color:"var(--gold)",fontSize:"0.9rem" }}><span>Total honoraires</span><span>{fmt(totalHon)}</span></div>
                  </div>
                </div>
              )}
              {mode==="service"&&serviceActuel&&(
                <div style={{ background:"var(--surface)",borderRadius:"var(--radius)",padding:"1rem",textAlign:"left",marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:"0.78rem",color:"var(--text-muted)" }}>{serviceActuel.icon} {serviceActuel.label}</div>
                  <div style={{ fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.25rem" }}>Tarif fixe · {serviceActuel.categorie}</div>
                </div>
              )}
              <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
                <button className="btn btn-gold" onClick={openFacPenal} disabled={totalHon<=0} style={{ width:"100%",justifyContent:"center",padding:"0.875rem",fontSize:"0.9rem",opacity:totalHon<=0?0.4:1 }}>🧾 Créer une facture</button>
                <button className="btn btn-ghost" onClick={()=>{ setQCrimes(0);setQMajeurs(0);setQMineurs(0);setRisque("Moyen");setOpts([]);setSelectedService(null); }} style={{ width:"100%",justifyContent:"center",fontSize:"0.78rem" }}>Réinitialiser</button>
              </div>
            </div>
            {hist.filter(h=>h.mode!=="formulaire").length>0&&(
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.625rem" }}><div className="section-title">Historique session</div><button className="btn btn-ghost btn-sm" onClick={()=>setHist([])}>Effacer</button></div>
                <div className="table-container"><table><thead><tr><th>Heure</th><th>Type</th><th>Détails</th><th style={{textAlign:"right"}}>Honoraires</th></tr></thead><tbody>{hist.filter(h=>h.mode!=="formulaire").map((h,i)=><tr key={i}><td style={{fontSize:"0.78rem",color:"var(--text-dim)"}}>{h.date}</td><td><span className={`badge ${h.mode==="penal"?"badge-danger":"badge-info"}`}>{h.mode==="penal"?"Pénal":"Civil"}</span></td><td style={{fontSize:"0.8rem",color:"var(--text-muted)"}}>{h.label||"—"}</td><td style={{textAlign:"right",fontWeight:700,color:"var(--gold)"}}>{fmt(h.total)}</td></tr>)}</tbody></table></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FORMULAIRE D'INCULPATION
          ══════════════════════════════════════════════════════════════════════ */}
      {mode==="formulaire" && (
        <>
          {/* ─── Bandeau Defcon ─── */}
          <div style={{ background:"var(--card)", border:`2px solid ${dc.couleur}50`, borderRadius:"var(--radius-lg)", padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:dc.couleur, boxShadow:`0 0 8px ${dc.couleur}` }}/>
                <span style={{ fontWeight:900, fontSize:"1rem", color:dc.couleur, letterSpacing:"0.1em" }}>DEFCON {defcon}</span>
                <span style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-muted)" }}>{dc.label}</span>
              </div>
              <div style={{ display:"flex", gap:"0.875rem", marginLeft:"auto", alignItems:"center" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"0.58rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-dim)", marginBottom:"0.15rem" }}>GLOBAL</div>
                  <div style={{ fontWeight:900, fontSize:"1.1rem", color:dc.modGlobal>1?dc.couleur:"var(--text-dim)" }}>×{dc.modGlobal}</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"0.58rem", textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-dim)", marginBottom:"0.15rem" }}>CIBLÉ</div>
                  <div style={{ fontWeight:900, fontSize:"1.1rem", color:dc.modCible>1?dc.couleur:"var(--text-dim)" }}>×{dc.modCible}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.3rem" }}>
                {([5,4,3,2,1] as DefconLevel[]).map(n => {
                  const col = DEFCON_DATA[n].couleur;
                  return (
                    <button key={n} onClick={()=>setDefcon(n)} title={DEFCON_DATA[n].label} style={{ padding:"0.3rem 0.7rem", borderRadius:"var(--radius)", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontSize:"0.78rem", fontWeight:defcon===n?900:400, background:defcon===n?col+"20":"var(--surface)", border:`1px solid ${defcon===n?col+"60":"var(--border)"}`, color:defcon===n?col:"var(--text-dim)", transition:"all 0.15s" }}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
            {dc.modGlobal>1||dc.modCible>1 ? (
              <div style={{ marginTop:"0.5rem", fontSize:"0.72rem", color:dc.couleur, paddingLeft:"1.625rem" }}>
                ⚠ Amende police : {dc.amendePolicePhrasing}
              </div>
            ) : null}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:"1.25rem", alignItems:"start" }}>

            {/* ─── PANNEAU GAUCHE ─── */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

              {/* Prévenu */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Le Prévenu</div>
                <div className="form-group"><label>Prénom</label><input placeholder="Prénom…" value={prenomPrev} onChange={e=>setPrenomPrev(e.target.value)}/></div>
                <div className="form-group"><label>Nom</label><input placeholder="Nom de famille…" value={nomPrev} onChange={e=>setNomPrev(e.target.value)}/></div>
                <div className="form-group" style={{marginBottom:0}}><label>Matricule(s) agents</label><input placeholder="Ex: 113/193" value={matricule} onChange={e=>setMatricule(e.target.value)}/></div>
              </div>

              {/* Droits */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Droits du prévenu</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {[
                    { label:"Soins médicaux",   val:droitSoins,      set:setDroitSoins,      col:"#22c55e", disabled:false },
                    { label:"Nourriture",        val:droitNourriture,  set:setDroitNourriture, col:"#f59e0b", disabled:false },
                    { label:"Plaider coupable",  val:droitPlaide&&!hasCrime, set:setDroitPlaide, col:"#3b82f6", disabled:hasCrime },
                  ].map(d=>(
                    <label key={d.label} style={{ display:"flex",alignItems:"center",gap:"0.625rem",cursor:d.disabled?"not-allowed":"pointer",padding:"0.4rem 0.5rem",borderRadius:"var(--radius)",background:d.disabled?"var(--surface)":d.val?d.col+"10":"var(--surface)",border:`1px solid ${d.disabled?"var(--border)":d.val?d.col+"40":"var(--border)"}`,opacity:d.disabled?0.4:1,transition:"all 0.15s" }}>
                      <div onClick={()=>!d.disabled&&d.set(!d.val)} style={{ width:18,height:18,borderRadius:4,flexShrink:0,border:`2px solid ${d.val&&!d.disabled?d.col:"var(--border-light)"}`,background:d.val&&!d.disabled?d.col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:d.disabled?"not-allowed":"pointer",transition:"all 0.15s" }}>
                        {d.val&&!d.disabled&&<span style={{color:"#08090d",fontSize:"0.65rem",fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{ fontSize:"0.8rem",fontWeight:d.val&&!d.disabled?600:400,color:d.val&&!d.disabled?d.col:"var(--text-muted)" }}>{d.label}</span>
                      {d.disabled&&<span style={{fontSize:"0.62rem",color:"var(--text-dim)",marginLeft:"auto"}}>N/A crime</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Intervenant */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Intervenant</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  {([
                    { key:"avocat",    label:`Avocat — ${user?.nom||"Cabinet BullHead"}`, col:"var(--gold)"     },
                    { key:"procureur", label:"Procureur / Juge",                          col:"var(--info)"     },
                    { key:"cs",        label:"CS / Sgt. II (Absence procureur)",          col:"var(--text-dim)" },
                  ] as const).map(opt=>(
                    <button key={opt.key} onClick={()=>setIntervenant(opt.key)} style={{ display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.5rem 0.625rem",borderRadius:"var(--radius)",background:intervenant===opt.key?opt.col+"12":"var(--surface)",border:`1px solid ${intervenant===opt.key?opt.col+"50":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s" }}>
                      <div style={{ width:14,height:14,borderRadius:"50%",flexShrink:0,border:`2px solid ${intervenant===opt.key?opt.col:"var(--border-light)"}`,background:intervenant===opt.key?opt.col:"transparent",transition:"all 0.15s" }}/>
                      <span style={{ fontSize:"0.775rem",fontWeight:intervenant===opt.key?600:400,color:intervenant===opt.key?opt.col:"var(--text-muted)" }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Retenue */}
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Retenue</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                  {RETENUES.map(r=>(
                    <button key={r.key} onClick={()=>setRetenue(r.key)} style={{ display:"flex",alignItems:"flex-start",gap:"0.625rem",padding:"0.5rem 0.625rem",borderRadius:"var(--radius)",background:retenue===r.key?r.color+"15":"var(--surface)",border:`1px solid ${retenue===r.key?r.color+"50":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s" }}>
                      <div style={{ marginTop:2,width:8,height:8,borderRadius:"50%",flexShrink:0,background:retenue===r.key?r.color:"var(--border-light)",transition:"all 0.15s" }}/>
                      <div>
                        <div style={{ fontSize:"0.8rem",fontWeight:700,color:retenue===r.key?r.color:"var(--text-muted)" }}>{r.label}</div>
                        <div style={{ fontSize:"0.65rem",color:"var(--text-dim)",marginTop:"0.1rem" }}>{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Résultats */}
              <div className="card" style={{ border:"1px solid rgba(201,168,76,0.25)" }}>
                <div className="section-title" style={{ marginBottom:"0.875rem" }}>Résultats</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                  <div style={{ padding:"0.75rem",borderRadius:"var(--radius)",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)" }}>
                    <div style={{ fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem" }}>Détention totale</div>
                    <div style={{ display:"flex",alignItems:"baseline",gap:"0.4rem" }}>
                      <span style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.8rem",color:formulaireCalc.detention>0?"var(--danger)":"var(--text-dim)",lineHeight:1 }}>{formulaireCalc.detention||"—"}</span>
                      {formulaireCalc.detention>0&&<span style={{ fontSize:"0.8rem",color:"var(--text-dim)",fontWeight:500 }}>min</span>}
                    </div>
                  </div>
                  <div style={{ padding:"0.75rem",borderRadius:"var(--radius)",background:"rgba(201,168,76,0.06)",border:"1px solid rgba(201,168,76,0.2)" }}>
                    <div style={{ fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem" }}>Amende totale</div>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.2rem",color:formulaireCalc.amende>0?"var(--gold)":"var(--text-dim)",lineHeight:1.2 }}>
                      {formulaireCalc.amende>0?fmt(formulaireCalc.amende):"—"}
                    </div>
                    {formulaireCalc.cappee&&(
                      <div style={{ fontSize:"0.62rem",color:"var(--warning)",marginTop:"0.25rem" }}>⚑ Plafond {fmt(formulaireCalc.cap)} appliqué (brut: {fmt(formulaireCalc.amendeRaw)})</div>
                    )}
                    {(dc.modGlobal>1||dc.modCible>1)&&hasCharges&&(
                      <div style={{ fontSize:"0.62rem",color:dc.couleur,marginTop:"0.2rem" }}>Defcon {defcon} inclus</div>
                    )}
                  </div>
                  {hasCharges&&(
                    <div style={{ padding:"0.75rem",borderRadius:"var(--radius)",background:"rgba(201,168,76,0.04)",border:"1px solid rgba(201,168,76,0.15)" }}>
                      <div style={{ fontSize:"0.62rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.2rem" }}>Retenue</div>
                      <div style={{ fontWeight:800,fontSize:"0.95rem",color:RETENUES.find(r=>r.key===retenue)?.color||"var(--gold)",letterSpacing:"0.06em" }}>{retenue}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
                <button className="btn btn-outline" onClick={exportFormulaire} style={{justifyContent:"center"}}>📋 Copier le formulaire</button>
                <button className="btn btn-gold" onClick={()=>{ setClientName(`${prenomPrev} ${nomPrev}`.trim()); setShowFac(true); (window as any).__facMontant=formulaireCalc.honBase; (window as any).__facDesc=`Formulaire d'inculpation — Defcon ${defcon} — ${lignes.filter(l=>l.chef).map(l=>`[${l.chef!.code}] ${l.chef!.infraction}`).join(", ")}`; }} disabled={!hasCharges} style={{justifyContent:"center",opacity:!hasCharges?0.4:1}}>🧾 Émettre la facture</button>
                <button className="btn btn-ghost" onClick={()=>{setLignes([newLigne()]);setPrenomPrev("");setNomPrev("");setMatricule("");setDroitSoins(false);setDroitNourriture(false);setDroitPlaide(false);setIntervenant("avocat");setRetenue("NOMINAL");setDefcon(5);}} style={{justifyContent:"center",fontSize:"0.78rem"}}>Réinitialiser</button>
              </div>
            </div>

            {/* ─── TABLEAU CHEFS ─── */}
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div className="card">
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem" }}>
                  <div>
                    <div className="section-title" style={{marginBottom:"0.2rem"}}>Chefs d'inculpation</div>
                    <div style={{ fontSize:"0.72rem",color:"var(--text-dim)" }}>
                      {lignes.filter(l=>l.chef).length} chef{lignes.filter(l=>l.chef).length!==1?"s":""} retenus
                      {formulaireCalc.detention>0&&` · ${formulaireCalc.detention} min`}
                      {hasCrime&&<span style={{color:"#7c3aed",marginLeft:"0.4rem"}}>· Crime présent</span>}
                    </div>
                  </div>
                  <button className="btn btn-gold btn-sm" onClick={()=>setLignes(ls=>[...ls,newLigne()])}>+ Ajouter</button>
                </div>

                {/* Filtre cat */}
                <div style={{ display:"flex",gap:"0.35rem",marginBottom:"0.875rem",flexWrap:"wrap" }}>
                  {["", ...CATEGORIES].map(cat=>(
                    <button key={cat||"all"} onClick={()=>setFilterCat(cat)} style={{ padding:"0.2rem 0.65rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.7rem",fontWeight:filterCat===cat?700:400,background:filterCat===cat?(cat?CAT_COLORS[cat]+"18":"var(--gold-muted)"):"var(--surface)",border:`1px solid ${filterCat===cat?(cat?CAT_COLORS[cat]+"40":"rgba(201,168,76,0.4)"):"var(--border)"}`,color:filterCat===cat?(cat?CAT_COLORS[cat]:"var(--gold)"):"var(--text-muted)" }}>
                      {cat||"Toutes"}
                    </button>
                  ))}
                  <span style={{ fontSize:"0.62rem",color:"var(--text-dim)",alignSelf:"center",marginLeft:"auto" }}>⚑ = chef ciblé Defcon</span>
                </div>

                {/* En-têtes */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 52px 52px 60px 80px 20px",gap:"0.4rem",padding:"0 0.5rem 0.5rem",borderBottom:"1px solid var(--border)",marginBottom:"0.5rem" }}>
                  {["Infraction","Tent.","Comp.","Qté","Atténuation",""].map(h=>(
                    <div key={h} style={{ fontSize:"0.6rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",textAlign:h==="Tent."||h==="Comp."||h==="Qté"?"center":"left" }}>{h}</div>
                  ))}
                </div>

                <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
                  {lignes.map((ligne,idx)=>{
                    const col = ligne.chef ? CAT_COLORS[ligne.chef.categorie] : "var(--border)";
                    const chefsFiltres = CHEFS_PENAL.filter(c =>
                      (!filterCat||c.categorie===filterCat)&&
                      (c.infraction.toLowerCase().includes(ligne.search.toLowerCase())||c.code.toLowerCase().includes(ligne.search.toLowerCase()))
                    );
                    return (
                      <div key={ligne.id} style={{ borderRadius:"var(--radius)",border:`1px solid ${col}30`,borderLeft:`3px solid ${col}`,position:"relative" }}>
                        <div style={{ display:"grid",gridTemplateColumns:"1fr 52px 52px 60px 80px 20px",gap:"0.4rem",padding:"0.5rem" }}>
                          {/* Infraction */}
                          <div style={{ position:"relative" }}>
                            {ligne.chef ? (
                              <button onClick={()=>updateLigne(ligne.id,{chef:null,search:"",showPicker:false})} style={{ display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left",fontFamily:"'Inter',sans-serif" }}>
                                <span style={{ fontFamily:"monospace",fontSize:"0.65rem",color:col,background:col+"15",padding:"0.08rem 0.35rem",borderRadius:3,flexShrink:0 }}>{ligne.chef.code}</span>
                                {ligne.chef.cible&&<span title="Chef ciblé Defcon" style={{ fontSize:"0.6rem",color:dc.couleur,flexShrink:0 }}>⚑</span>}
                                <span style={{ fontSize:"0.78rem",fontWeight:500,color:"var(--text)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ligne.chef.infraction}</span>
                                <span style={{ fontSize:"0.6rem",color:"var(--text-dim)",flexShrink:0 }}>×</span>
                              </button>
                            ) : (
                              <input placeholder="Rechercher une infraction…" value={ligne.search} onChange={e=>updateLigne(ligne.id,{search:e.target.value,showPicker:true})} onFocus={()=>updateLigne(ligne.id,{showPicker:true})} style={{ width:"100%",fontSize:"0.78rem",padding:"0.3rem 0.5rem" }} autoFocus={idx===lignes.length-1&&idx>0}/>
                            )}
                            {ligne.showPicker&&!ligne.chef&&ligne.search&&(
                              <div style={{ position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius)",zIndex:50,maxHeight:220,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,0.4)" }}>
                                {CATEGORIES.map(cat=>{
                                  const items=chefsFiltres.filter(c=>c.categorie===cat);
                                  if(!items.length)return null;
                                  return (
                                    <div key={cat}>
                                      <div style={{ fontSize:"0.6rem",textTransform:"uppercase",letterSpacing:"0.08em",color:CAT_COLORS[cat],padding:"0.4rem 0.75rem 0.2rem",fontWeight:700,position:"sticky",top:0,background:"var(--card)" }}>{cat}</div>
                                      {items.map(c=>(
                                        <button key={c.code} onMouseDown={()=>selectChef(ligne.id,c)} style={{ display:"flex",alignItems:"center",gap:"0.5rem",width:"100%",padding:"0.4rem 0.75rem",background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left" }}
                                          onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"}
                                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                                          <span style={{ fontFamily:"monospace",fontSize:"0.63rem",color:CAT_COLORS[cat],background:CAT_COLORS[cat]+"15",padding:"0.08rem 0.35rem",borderRadius:3,flexShrink:0 }}>{c.code}</span>
                                          {c.cible&&<span style={{fontSize:"0.58rem",color:dc.couleur,flexShrink:0}} title="Chef ciblé">⚑</span>}
                                          <span style={{ fontSize:"0.76rem",flex:1 }}>{c.infraction}</span>
                                          <span style={{ fontSize:"0.62rem",color:"var(--text-dim)",flexShrink:0 }}>{c.detention>0?`${c.detention}min`:"—"}</span>
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
                            <button onClick={()=>updateLigne(ligne.id,{tentative:!ligne.tentative})} style={{ width:22,height:22,borderRadius:4,border:`2px solid ${ligne.tentative?"var(--warning)":"var(--border-light)"}`,background:ligne.tentative?"rgba(245,158,11,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:900,color:"var(--warning)",transition:"all 0.15s" }}>{ligne.tentative&&"✓"}</button>
                          </div>
                          {/* Complicité */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>updateLigne(ligne.id,{complicite:!ligne.complicite})} style={{ width:22,height:22,borderRadius:4,border:`2px solid ${ligne.complicite?"var(--info)":"var(--border-light)"}`,background:ligne.complicite?"rgba(99,102,241,0.12)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:900,color:"var(--info)",transition:"all 0.15s" }}>{ligne.complicite&&"✓"}</button>
                          </div>
                          {/* Quantité */}
                          <div style={{display:"flex",alignItems:"center"}}>
                            <input type="number" min={1} max={9999} value={ligne.quantite} onChange={e=>updateLigne(ligne.id,{quantite:Math.max(1,parseInt(e.target.value)||1)})} style={{ width:"100%",textAlign:"center",padding:"0.3rem 0.2rem",fontSize:"0.8rem" }}/>
                          </div>
                          {/* Atténuation */}
                          <div style={{display:"flex",alignItems:"center"}}>
                            <input placeholder="Note…" value={ligne.attenuation} onChange={e=>updateLigne(ligne.id,{attenuation:e.target.value})} style={{ width:"100%",fontSize:"0.72rem",padding:"0.3rem 0.4rem" }}/>
                          </div>
                          {/* Supprimer */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <button onClick={()=>removeLigne(ligne.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)",fontSize:"0.9rem",lineHeight:1,transition:"color 0.1s" }} onMouseEnter={e=>e.currentTarget.style.color="var(--danger)"} onMouseLeave={e=>e.currentTarget.style.color="var(--text-dim)"}>×</button>
                          </div>
                        </div>
                        {ligne.chef&&(
                          <div style={{ display:"flex",gap:"1rem",padding:"0.25rem 0.5rem 0.4rem",borderTop:"1px solid var(--border)",flexWrap:"wrap" }}>
                            <span style={{fontSize:"0.63rem",color:col}}>{ligne.chef.categorie}</span>
                            {ligne.chef.detention>0&&<span style={{fontSize:"0.63rem",color:"var(--text-dim)"}}>⏱ {ligne.chef.detention}min{ligne.tentative?` → ${Math.round(ligne.chef.detention*0.5)}min`:""}{ligne.complicite&&!ligne.tentative?` → ${Math.round(ligne.chef.detention*0.75)}min`:""}{ligne.quantite>1?` ×${ligne.quantite}`:""}</span>}
                            {ligne.chef.amende>0&&<span style={{fontSize:"0.63rem",color:"var(--text-dim)"}}>💰 {fmt(ligne.chef.amende)}{ligne.chef.cible&&dc.modCible>1?` → ${fmt(Math.round(ligne.chef.amende*dc.modCible))} (⚑ Defcon ${defcon})`:dc.modGlobal>1?` → ${fmt(Math.round(ligne.chef.amende*dc.modGlobal))}`:""}</span>}
                            <span style={{fontSize:"0.63rem",color:"var(--gold)",marginLeft:"auto"}}>Hon.: {fmt(HON_PAR_CAT[ligne.chef.categorie]||0)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button className="btn btn-outline" onClick={()=>setLignes(ls=>[...ls,newLigne()])} style={{width:"100%",justifyContent:"center",marginTop:"0.75rem",fontSize:"0.8rem"}}>+ Ajouter un chef</button>
              </div>

              {/* Récap honoraires formulaire */}
              {hasCharges&&(
                <div className="card" style={{border:"1px solid rgba(201,168,76,0.2)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div className="section-title" style={{marginBottom:0}}>Honoraires estimés</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.4rem",color:"var(--gold)"}}>{fmt(formulaireCalc.honBase)}</div>
                  </div>
                  <div style={{marginTop:"0.625rem",display:"flex",gap:"0.875rem",flexWrap:"wrap"}}>
                    {CATEGORIES.map(cat=>{
                      const n=lignes.filter(l=>l.chef?.categorie===cat).reduce((s,l)=>s+(l.quantite||1),0);
                      if(!n)return null;
                      const col=CAT_COLORS[cat];
                      return <span key={cat} style={{fontSize:"0.72rem",color:col}}>{n}× {cat} = {fmt((HON_PAR_CAT[cat]||0)*n)}</span>;
                    })}
                  </div>
                  <div style={{marginTop:"0.5rem",fontSize:"0.7rem",color:"var(--text-dim)"}}>Les modificateurs de risque sont configurables depuis l'onglet "Défense pénale"</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Modal facture ─── */}
      {showFac&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowFac(false)}>
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">Émettre une facture</h2><button className="modal-close" onClick={()=>setShowFac(false)}>×</button></div>
            <div className="modal-body">
              <div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.875rem 1rem",borderLeft:"3px solid var(--gold)",marginBottom:"1rem"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:"var(--gold)"}}>
                  <span>{mode==="formulaire"?`Formulaire — Defcon ${defcon}`:mode==="penal"?"Défense pénale":serviceActuel?.label}</span>
                  <span>{fmt(mode==="formulaire"?formulaireCalc.honBase:totalHon)}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Client *</label>
                <input list="fac-clients" placeholder="Choisir parmi vos clients" value={clientName} onChange={e=>setClientName(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&creerFacture(mode==="formulaire"?formulaireCalc.honBase:totalHon, (window as any).__facDesc||"")}/>
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
