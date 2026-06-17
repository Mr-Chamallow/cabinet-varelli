"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

// Code pénal simplifié pour la picklist
const CHEFS_PENAL = [
  // Contraventions
  { code:"C-5",  infraction:"Conduite dangereuse",                  categorie:"Contravention", amende:"2 700$",   detention:"—" },
  { code:"C-7",  infraction:"Excès de vitesse",                     categorie:"Contravention", amende:"1 800$",   detention:"—" },
  { code:"C-9",  infraction:"Holster interdit",                     categorie:"Contravention", amende:"1 350$",   detention:"—" },
  { code:"C-18", infraction:"Consommation de drogue",               categorie:"Contravention", amende:"450$",     detention:"—" },
  // Délits mineurs
  { code:"DM-1",  infraction:"Agression sur citoyen",               categorie:"Délit mineur",  amende:"4 500$",   detention:"30 min" },
  { code:"DM-6",  infraction:"Braquage de supérette",               categorie:"Délit mineur",  amende:"3 600$",   detention:"20 min" },
  { code:"DM-7",  infraction:"Braquage/piratage ATM",               categorie:"Délit mineur",  amende:"2 250$",   detention:"15 min" },
  { code:"DM-8",  infraction:"Cambriolage",                         categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-12", infraction:"Délit de fuite",                      categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-13", infraction:"Entrave à une opération police",      categorie:"Délit mineur",  amende:"3 500$",   detention:"30 min" },
  { code:"DM-15", infraction:"Exhibition d'armes de poing",         categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-16", infraction:"Exhibition d'armes lourdes",          categorie:"Délit mineur",  amende:"4 500$",   detention:"30 min" },
  { code:"DM-20", infraction:"Utilisation d'une arme à feu",        categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-21", infraction:"Intrusion zone restreinte",           categorie:"Délit mineur",  amende:"3 200$",   detention:"30 min" },
  { code:"DM-22", infraction:"Menace/intimidation envers civil",    categorie:"Délit mineur",  amende:"3 500$",   detention:"15 min" },
  { code:"DM-23", infraction:"Mise en danger de la vie d'autrui",  categorie:"Délit mineur",  amende:"5 800$",   detention:"15 min" },
  { code:"DM-26", infraction:"Non présentation à convocation",      categorie:"Délit mineur",  amende:"6 750$",   detention:"20 min" },
  { code:"DM-47", infraction:"Possession de pistolet",              categorie:"Délit mineur",  amende:"15 000$",  detention:"20 min" },
  { code:"DM-78", infraction:"Possession de cannabis",              categorie:"Délit mineur",  amende:"32$/u",    detention:"10 min" },
  { code:"DM-79", infraction:"Possession de cocaïne",               categorie:"Délit mineur",  amende:"45$/u",    detention:"10 min" },
  { code:"DM-84", infraction:"Possession d'héroïne",               categorie:"Délit mineur",  amende:"72$/u",    detention:"10 min" },
  { code:"DM-124",infraction:"Vente de drogue",                     categorie:"Délit mineur",  amende:"3 750$",   detention:"10 min" },
  { code:"DM-127",infraction:"Refus d'obtempérer",                  categorie:"Délit mineur",  amende:"900$",     detention:"15 min" },
  { code:"DM-130",infraction:"Trafic de stupéfiants",               categorie:"Délit mineur",  amende:"Variable", detention:"Variable" },
  { code:"DM-133",infraction:"Vol",                                  categorie:"Délit mineur",  amende:"1 350$",   detention:"15 min" },
  { code:"DM-144",infraction:"Évasion du poste de police",         categorie:"Délit mineur",  amende:"7 500$",   detention:"20 min" },
  // Délits majeurs
  { code:"DMJ-9",  infraction:"Agression sur agent / police",       categorie:"Délit majeur",  amende:"8 500$",   detention:"1h" },
  { code:"DMJ-11", infraction:"Menaces de mort / menaces graves",   categorie:"Délit majeur",  amende:"8 500$",   detention:"45 min" },
  { code:"DMJ-13", infraction:"Homicide involontaire",              categorie:"Délit majeur",  amende:"12 500$",  detention:"25 min" },
  { code:"DMJ-14", infraction:"Association de malfaiteurs",         categorie:"Délit majeur",  amende:"4 500$",   detention:"30 min" },
  { code:"DMJ-17", infraction:"Braquage bijouterie/supermarché",    categorie:"Délit majeur",  amende:"9 000$",   detention:"30 min" },
  { code:"DMJ-18", infraction:"Braquage banque centrale",           categorie:"Délit majeur",  amende:"25 000$",  detention:"60 min" },
  { code:"DMJ-21", infraction:"Braquage banque (Fleeca)",           categorie:"Délit majeur",  amende:"15 000$",  detention:"25 min" },
  { code:"DMJ-28", infraction:"Faux témoignage",                    categorie:"Délit majeur",  amende:"9 000$",   detention:"30 min" },
  { code:"DMJ-36", infraction:"Participation à une fusillade",      categorie:"Délit majeur",  amende:"3 500$",   detention:"30 min" },
  { code:"DMJ-54", infraction:"Possession de fusil d'assaut",       categorie:"Délit majeur",  amende:"35 000$",  detention:"25 min" },
  { code:"DMJ-83", infraction:"Prise d'otage sur civil",            categorie:"Délit majeur",  amende:"4 500$",   detention:"15 min" },
  { code:"DMJ-91", infraction:"Vol à main armée",                   categorie:"Délit majeur",  amende:"5 000$",   detention:"30 min" },
  { code:"DMJ-100",infraction:"Corruption",                         categorie:"Délit majeur",  amende:"22 500$",  detention:"30 min" },
  { code:"DMJ-101",infraction:"Fraude fiscale",                     categorie:"Délit majeur",  amende:"90 000$",  detention:"30 min" },
  // Crimes
  { code:"CR-2",  infraction:"Blanchiment",                         categorie:"Crime",         amende:"5$×somme", detention:"15 min" },
  { code:"CR-4",  infraction:"Assassinat prémédité (MORT RP)",      categorie:"Crime",         amende:"225 000$", detention:"1h" },
  { code:"CR-8",  infraction:"Meurtre (MORT RP)",                   categorie:"Crime",         amende:"100 800$", detention:"1h" },
  { code:"CR-11", infraction:"Cavale",                              categorie:"Crime",         amende:"9 000$",   detention:"1h" },
  { code:"CR-15", infraction:"Meurtre représentant État (MORT RP)", categorie:"Crime",         amende:"300 000$", detention:"30 min" },
  { code:"CR-17", infraction:"Meurtre (COMA)",                      categorie:"Crime",         amende:"18 000$",  detention:"30 min" },
  { code:"CR-19", infraction:"Possession de grenade",               categorie:"Crime",         amende:"135 000$", detention:"30 min" },
  { code:"CR-21", infraction:"Prise d'otage représentant État",     categorie:"Crime",         amende:"18 000$",  detention:"30 min" },
  { code:"CR-22", infraction:"Séquestration",                       categorie:"Crime",         amende:"15 500$",  detention:"30 min" },
  { code:"CR-23", infraction:"Terrorisme",                          categorie:"Crime",         amende:"45 000$",  detention:"1h" },
  { code:"CR-31", infraction:"Violation du secret professionnel",   categorie:"Crime",         amende:"22 500$",  detention:"30 min" },
];

const STATUTS_AVANCEMENT = [
  "Investigation","Mise en examen","Instruction","Jugement","Appel","Clôturé — Gagné","Clôturé — Perdu",
];

const EVENT_TYPES = [
  { key:"note",      label:"Note",            icon:"📝", color:"var(--text-muted)" },
  { key:"audience",  label:"Audience",        icon:"⚖️", color:"var(--gold)" },
  { key:"document",  label:"Document reçu",  icon:"📄", color:"var(--info)" },
  { key:"decision",  label:"Décision",        icon:"🔨", color:"#a855f7" },
  { key:"contact",   label:"Contact client", icon:"📞", color:"var(--success)" },
  { key:"alerte",    label:"Alerte",          icon:"⚠️", color:"var(--danger)" },
];

const CAT_COLORS: Record<string,string> = {
  "Contravention": "#64748b",
  "Délit mineur":  "#f59e0b",
  "Délit majeur":  "#ef4444",
  "Crime":         "#7c3aed",
};

interface Dossier {
  id:string; reference:string; client:string; type_affaire:string;
  type_client:string; risque:string; montant:number; statut:string;
  notes:string; created_at:string; created_by:string;
}
interface Chef { id:string; code:string; infraction:string; categorie:string; amende:string; detention:string; }
interface Event { id:string; type:string; contenu:string; created_by:string; created_at:string; }

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = getUser();
  const id = params?.id as string;

  const [dossier, setDossier] = useState<Dossier|null>(null);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dossier
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Dossier>>({});
  const [saving, setSaving] = useState(false);

  // Stratégie défense (champ notes enrichi)
  const [strategie, setStrategie] = useState("");
  const [savingStrat, setSavingStrat] = useState(false);

  // Chefs inculpation
  const [showChefPicker, setShowChefPicker] = useState(false);
  const [chefSearch, setChefSearch] = useState("");

  // Timeline
  const [newEvent, setNewEvent] = useState("");
  const [newEventType, setNewEventType] = useState("note");
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [{ data:d }, { data:c }, { data:e }] = await Promise.all([
      supabase.from("dossiers").select("*").eq("id",id).single(),
      supabase.from("dossier_chefs").select("*").eq("dossier_id",id).order("created_at"),
      supabase.from("dossier_events").select("*").eq("dossier_id",id).order("created_at",{ascending:false}),
    ]);
    if (d) { setDossier(d); setEditForm(d); setStrategie(d.notes||""); }
    setChefs(c||[]);
    setEvents(e||[]);
    setLoading(false);
  }

  async function saveDossier() {
    if (!supabase||!dossier) return;
    setSaving(true);
    await supabase.from("dossiers").update(editForm).eq("id",id);
    setDossier({...dossier,...editForm} as Dossier);
    setEditMode(false);
    setSaving(false);
  }

  async function saveStrategie() {
    if (!supabase) return;
    setSavingStrat(true);
    await supabase.from("dossiers").update({ notes:strategie }).eq("id",id);
    setSavingStrat(false);
  }

  async function addChef(chef: typeof CHEFS_PENAL[0]) {
    if (!supabase) return;
    const { data } = await supabase.from("dossier_chefs").insert([{
      dossier_id:id, code:chef.code, infraction:chef.infraction,
      categorie:chef.categorie, amende:chef.amende, detention:chef.detention,
    }]).select().single();
    if (data) setChefs(c=>[...c,data]);
    setShowChefPicker(false);
  }

  async function removeChef(chefId:string) {
    if (!supabase) return;
    await supabase.from("dossier_chefs").delete().eq("id",chefId);
    setChefs(c=>c.filter(x=>x.id!==chefId));
  }

  async function addEvent() {
    if (!supabase||!user||!newEvent.trim()) return;
    setAddingEvent(true);
    const { data } = await supabase.from("dossier_events").insert([{
      dossier_id:id, type:newEventType, contenu:newEvent.trim(), created_by:user.nom,
    }]).select().single();
    if (data) setEvents(e=>[data,...e]);
    setNewEvent("");
    setAddingEvent(false);
  }

  async function deleteEvent(evtId:string) {
    if (!supabase) return;
    await supabase.from("dossier_events").delete().eq("id",evtId);
    setEvents(e=>e.filter(x=>x.id!==evtId));
  }

  if (loading) return <div className="page-container"><div style={{color:"var(--text-dim)"}}>Chargement…</div></div>;
  if (!dossier) return <div className="page-container"><div style={{color:"var(--danger)"}}>Dossier introuvable</div></div>;

  const RISQUE_COLORS:Record<string,string> = {Aucun:"#64748b",Faible:"#22c55e",Moyen:"#f59e0b",Élevé:"#ef4444",Extrême:"#7c3aed"};
  const STATUT_COLORS:Record<string,string> = {Ouvert:"var(--info)","En cours":"var(--warning)",Clôturé:"var(--text-dim)",Gagné:"var(--success)",Perdu:"var(--danger)"};
  const amendeTotal = chefs.reduce((s,c) => { const n=parseInt(c.amende?.replace(/[^0-9]/g,"")||"0"); return s+n; }, 0);
  const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
  const dateStr = (d:string) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
  const timeStr = (d:string) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  const filteredChefs = CHEFS_PENAL.filter(c =>
    !chefs.some(x=>x.code===c.code) &&
    (c.infraction.toLowerCase().includes(chefSearch.toLowerCase()) || c.code.toLowerCase().includes(chefSearch.toLowerCase()))
  );

  return (
    <div className="page-container">
      <a className="back-link" href="/dossiers">← Retour aux dossiers</a>

      {/* Header */}
      <div className="page-header">
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.375rem",flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontSize:"0.875rem",color:"var(--gold)",background:"var(--gold-muted)",
              padding:"0.2rem 0.6rem",borderRadius:6,border:"1px solid rgba(201,168,76,0.25)"}}>
              {dossier.reference}
            </span>
            <span style={{padding:"0.2rem 0.6rem",borderRadius:999,fontSize:"0.72rem",fontWeight:600,
              background:(RISQUE_COLORS[dossier.risque]||"#64748b")+"18",
              color:RISQUE_COLORS[dossier.risque]||"#64748b",
              border:`1px solid ${(RISQUE_COLORS[dossier.risque]||"#64748b")}30`}}>
              Risque {dossier.risque}
            </span>
            <span style={{padding:"0.2rem 0.6rem",borderRadius:999,fontSize:"0.72rem",fontWeight:600,
              background:(STATUT_COLORS[dossier.statut]||"var(--text-dim)")+"18",
              color:STATUT_COLORS[dossier.statut]||"var(--text-dim)",
              border:`1px solid ${(STATUT_COLORS[dossier.statut]||"var(--text-dim)")}30`}}>
              {dossier.statut}
            </span>
          </div>
          <h1 className="page-title">{dossier.client}</h1>
          <p className="page-subtitle">{dossier.type_affaire} · {dossier.type_client} · {dateStr(dossier.created_at)}</p>
          <div className="gold-line" />
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          {!editMode
            ? <button className="btn btn-outline btn-sm" onClick={()=>setEditMode(true)}>✏️ Modifier</button>
            : <>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditMode(false)}>Annuler</button>
              <button className="btn btn-gold btn-sm" onClick={saveDossier} disabled={saving}>{saving?"…":"Sauvegarder"}</button>
            </>
          }
        </div>
      </div>

      {/* Edit inline */}
      {editMode && (
        <div className="card" style={{marginBottom:"1.5rem",borderColor:"rgba(201,168,76,0.3)"}}>
          <div className="section-title" style={{marginBottom:"1rem"}}>Modifier le dossier</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.875rem"}}>
            {[
              {label:"Risque",key:"risque",type:"select",opts:["Aucun","Faible","Moyen","Élevé","Extrême"]},
              {label:"Statut",key:"statut",type:"select",opts:["Ouvert","En cours","Clôturé","Gagné","Perdu"]},
              {label:"Montant ($)",key:"montant",type:"number"},
              {label:"Type d'affaire",key:"type_affaire",type:"select",opts:["Défense pénale","Appel / Expungement","Droit civil","Adoption","Divorce","Contrat","Conseil juridique","Autre"]},
              {label:"Type client",key:"type_client",type:"select",opts:["Indépendant","Gang","PF","Famille","Petit frappe"]},
            ].map(f=>(
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                {f.type==="select"
                  ? <select value={(editForm as any)[f.key]||""} onChange={e=>setEditForm(ef=>({...ef,[f.key]:e.target.value}))}>
                      {f.opts?.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : <input type={f.type} value={(editForm as any)[f.key]||""} onChange={e=>setEditForm(ef=>({...ef,[f.key]:e.target.value}))} />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:"1.5rem"}}>

        {/* ─── COLONNE GAUCHE ─── */}
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

          {/* Chefs d'inculpation */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <div>
                <div className="section-title">Chefs d'inculpation</div>
                {chefs.length>0 && amendeTotal>0 && (
                  <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>
                    Amende maximale cumulée : <span style={{color:"var(--danger)",fontWeight:600}}>{fmt(amendeTotal)}</span>
                  </div>
                )}
              </div>
              <button className="btn btn-gold btn-sm" onClick={()=>setShowChefPicker(true)}>+ Ajouter</button>
            </div>

            {chefs.length===0 ? (
              <div style={{textAlign:"center",padding:"1.5rem 0",color:"var(--text-dim)",fontSize:"0.825rem"}}>
                Aucun chef d'inculpation — cliquez sur + Ajouter
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {chefs.map(c=>{
                  const col = CAT_COLORS[c.categorie]||"#64748b";
                  return (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",
                      padding:"0.7rem 0.875rem",borderRadius:"var(--radius)",background:"var(--surface)",
                      border:`1px solid ${col}25`,borderLeft:`3px solid ${col}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.15rem"}}>
                          <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:col,
                            background:col+"15",padding:"0.1rem 0.4rem",borderRadius:4}}>{c.code}</span>
                          <span style={{fontWeight:600,fontSize:"0.825rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.infraction}</span>
                        </div>
                        <div style={{display:"flex",gap:"1rem",fontSize:"0.72rem",color:"var(--text-dim)"}}>
                          {c.amende&&<span>💰 {c.amende}</span>}
                          {c.detention&&c.detention!=="—"&&<span>⏱ {c.detention}</span>}
                        </div>
                      </div>
                      <span style={{fontSize:"0.7rem",padding:"0.15rem 0.5rem",borderRadius:999,
                        background:col+"15",color:col,border:`1px solid ${col}30`,flexShrink:0}}>{c.categorie}</span>
                      <button className="btn btn-ghost btn-sm" onClick={()=>removeChef(c.id)}
                        style={{color:"var(--danger)",padding:"0.2rem 0.4rem",flexShrink:0}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stratégie de défense */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}>
              <div className="section-title">Stratégie de défense</div>
              <button className="btn btn-outline btn-sm" onClick={saveStrategie} disabled={savingStrat}>
                {savingStrat?"…":"Sauvegarder"}
              </button>
            </div>
            <textarea
              rows={8}
              placeholder="Arguments clés, axes de défense, vices de procédure identifiés, témoins, preuves à contester…"
              value={strategie}
              onChange={e=>setStrategie(e.target.value)}
              style={{width:"100%",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:1.7}}
            />
          </div>
        </div>

        {/* ─── COLONNE DROITE — TIMELINE ─── */}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

          {/* Infos rapides */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Informations</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
              {[
                {label:"Client",value:dossier.client},
                {label:"Type d'affaire",value:dossier.type_affaire},
                {label:"Type client",value:dossier.type_client},
                {label:"Honoraires",value:dossier.montant?`${dossier.montant.toLocaleString("fr-FR")} $`:"—"},
                {label:"Créé par",value:dossier.created_by||"—"},
              ].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",paddingBottom:"0.4rem",borderBottom:"1px solid var(--border)"}}>
                  <span style={{color:"var(--text-dim)"}}>{r.label}</span>
                  <span style={{fontWeight:500,color:"var(--text)"}}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nouveau événement */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Ajouter un événement</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"0.75rem"}}>
              {EVENT_TYPES.map(t=>(
                <button key={t.key} onClick={()=>setNewEventType(t.key)} style={{
                  padding:"0.25rem 0.6rem",borderRadius:999,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",
                  fontWeight:newEventType===t.key?700:400,
                  background:newEventType===t.key?t.color+"20":"var(--surface)",
                  border:`1px solid ${newEventType===t.key?t.color+"50":"var(--border)"}`,
                  color:newEventType===t.key?t.color:"var(--text-dim)",
                  transition:"all 0.1s",
                }}>{t.icon} {t.label}</button>
              ))}
            </div>
            <textarea rows={2} placeholder="Décrivez l'événement…" value={newEvent}
              onChange={e=>setNewEvent(e.target.value)}
              style={{width:"100%",marginBottom:"0.625rem",resize:"none"}} />
            <button className="btn btn-gold btn-sm" style={{width:"100%",justifyContent:"center"}}
              onClick={addEvent} disabled={addingEvent||!newEvent.trim()}>
              {addingEvent?"Ajout…":"+ Ajouter à la timeline"}
            </button>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Timeline ({events.length})</div>
            {events.length===0 ? (
              <div style={{textAlign:"center",color:"var(--text-dim)",fontSize:"0.8rem",padding:"1rem 0"}}>
                Aucun événement enregistré
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
                {events.map((e,i)=>{
                  const t = EVENT_TYPES.find(x=>x.key===e.type)||EVENT_TYPES[0];
                  return (
                    <div key={e.id} style={{display:"flex",gap:"0.75rem",position:"relative"}}>
                      {/* Ligne verticale */}
                      {i<events.length-1 && (
                        <div style={{position:"absolute",left:11,top:24,bottom:0,width:2,background:"var(--border)"}}/>
                      )}
                      {/* Dot */}
                      <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,marginTop:2,
                        background:t.color+"20",border:`2px solid ${t.color}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:"0.6rem",zIndex:1}}>
                        {t.icon}
                      </div>
                      <div style={{flex:1,paddingBottom:"1rem"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.2rem"}}>
                          <span style={{fontSize:"0.72rem",fontWeight:600,color:t.color}}>{t.label}</span>
                          <div style={{display:"flex",gap:"0.25rem",alignItems:"center"}}>
                            <span style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{timeStr(e.created_at)}</span>
                            <button onClick={()=>deleteEvent(e.id)} style={{
                              background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)",
                              fontSize:"0.75rem",padding:"0 0.2rem",lineHeight:1,
                              transition:"color 0.1s",
                            }} onMouseEnter={el=>el.currentTarget.style.color="var(--danger)"}
                              onMouseLeave={el=>el.currentTarget.style.color="var(--text-dim)"}>×</button>
                          </div>
                        </div>
                        <div style={{fontSize:"0.8rem",color:"var(--text-muted)",lineHeight:1.55}}>{e.contenu}</div>
                        <div style={{fontSize:"0.68rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>par {e.created_by}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal picker chefs */}
      {showChefPicker && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowChefPicker(false)}>
          <div className="modal modal-lg" style={{maxHeight:"80vh"}}>
            <div className="modal-header">
              <h2 className="modal-title">Ajouter un chef d'inculpation</h2>
              <button className="modal-close" onClick={()=>setShowChefPicker(false)}>×</button>
            </div>
            <div style={{padding:"1rem 1.5rem"}}>
              <input placeholder="Rechercher une infraction ou un code…"
                value={chefSearch} onChange={e=>setChefSearch(e.target.value)}
                autoFocus style={{width:"100%",marginBottom:"1rem"}} />
              <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",maxHeight:"50vh",overflowY:"auto"}}>
                {["Contravention","Délit mineur","Délit majeur","Crime"].map(cat=>{
                  const items = filteredChefs.filter(c=>c.categorie===cat);
                  if (items.length===0) return null;
                  return (
                    <div key={cat}>
                      <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",
                        color:CAT_COLORS[cat],fontWeight:700,padding:"0.5rem 0 0.3rem",
                        position:"sticky",top:0,background:"var(--card)"}}>{cat}</div>
                      {items.map(c=>(
                        <button key={c.code} onClick={()=>addChef(c)} style={{
                          display:"flex",alignItems:"center",justifyContent:"space-between",
                          width:"100%",padding:"0.6rem 0.75rem",borderRadius:"var(--radius)",
                          background:"var(--surface)",border:"1px solid var(--border)",
                          cursor:"pointer",marginBottom:"0.25rem",fontFamily:"'Inter',sans-serif",
                          transition:"border-color 0.1s",
                          textAlign:"left",
                        }}
                          onMouseEnter={el=>{el.currentTarget.style.borderColor=CAT_COLORS[cat];}}
                          onMouseLeave={el=>{el.currentTarget.style.borderColor="var(--border)";}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                              <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:CAT_COLORS[cat],
                                background:CAT_COLORS[cat]+"15",padding:"0.1rem 0.4rem",borderRadius:4}}>{c.code}</span>
                              <span style={{fontSize:"0.825rem",fontWeight:500,color:"var(--text)"}}>{c.infraction}</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:"0.75rem",fontSize:"0.72rem",color:"var(--text-dim)",flexShrink:0}}>
                            <span>💰 {c.amende}</span>
                            {c.detention!=="—"&&<span>⏱ {c.detention}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                {filteredChefs.length===0&&(
                  <div style={{textAlign:"center",color:"var(--text-dim)",padding:"2rem"}}>Aucun résultat</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
