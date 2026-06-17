"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

const CHEFS_PENAL = [
  { code:"C-5",  infraction:"Conduite dangereuse",               categorie:"Contravention", amende:"2 700$" },
  { code:"C-7",  infraction:"Excès de vitesse",                  categorie:"Contravention", amende:"1 800$" },
  { code:"C-9",  infraction:"Holster interdit",                  categorie:"Contravention", amende:"1 350$" },
  { code:"C-18", infraction:"Consommation de drogue",            categorie:"Contravention", amende:"450$" },
  { code:"DM-1", infraction:"Agression sur citoyen",             categorie:"Délit mineur",  amende:"4 500$" },
  { code:"DM-6", infraction:"Braquage de supérette",             categorie:"Délit mineur",  amende:"3 600$" },
  { code:"DM-7", infraction:"Braquage/piratage ATM",             categorie:"Délit mineur",  amende:"2 250$" },
  { code:"DM-12",infraction:"Délit de fuite",                    categorie:"Délit mineur",  amende:"1 350$" },
  { code:"DM-15",infraction:"Exhibition d'armes de poing",       categorie:"Délit mineur",  amende:"1 350$" },
  { code:"DM-20",infraction:"Utilisation d'une arme à feu",      categorie:"Délit mineur",  amende:"1 350$" },
  { code:"DM-22",infraction:"Menace envers civil",               categorie:"Délit mineur",  amende:"3 500$" },
  { code:"DM-23",infraction:"Mise en danger de la vie d'autrui", categorie:"Délit mineur",  amende:"5 800$" },
  { code:"DM-26",infraction:"Non présentation à convocation",    categorie:"Délit mineur",  amende:"6 750$" },
  { code:"DM-47",infraction:"Possession de pistolet",            categorie:"Délit mineur",  amende:"15 000$" },
  { code:"DM-78",infraction:"Possession de cannabis",            categorie:"Délit mineur",  amende:"32$/u" },
  { code:"DM-79",infraction:"Possession de cocaïne",             categorie:"Délit mineur",  amende:"45$/u" },
  { code:"DM-84",infraction:"Possession d'héroïne",              categorie:"Délit mineur",  amende:"72$/u" },
  { code:"DM-124",infraction:"Vente de drogue",                  categorie:"Délit mineur",  amende:"3 750$" },
  { code:"DM-127",infraction:"Refus d'obtempérer",               categorie:"Délit mineur",  amende:"900$" },
  { code:"DM-130",infraction:"Trafic de stupéfiants",            categorie:"Délit mineur",  amende:"Variable" },
  { code:"DM-133",infraction:"Vol",                              categorie:"Délit mineur",  amende:"1 350$" },
  { code:"DM-144",infraction:"Évasion du poste de police",       categorie:"Délit mineur",  amende:"7 500$" },
  { code:"DMJ-9", infraction:"Agression sur agent / police",     categorie:"Délit majeur",  amende:"8 500$" },
  { code:"DMJ-11",infraction:"Menaces de mort / menaces graves", categorie:"Délit majeur",  amende:"8 500$" },
  { code:"DMJ-13",infraction:"Homicide involontaire",            categorie:"Délit majeur",  amende:"12 500$" },
  { code:"DMJ-14",infraction:"Association de malfaiteurs",       categorie:"Délit majeur",  amende:"4 500$" },
  { code:"DMJ-17",infraction:"Braquage bijouterie/supermarché",  categorie:"Délit majeur",  amende:"9 000$" },
  { code:"DMJ-18",infraction:"Braquage banque centrale",         categorie:"Délit majeur",  amende:"25 000$" },
  { code:"DMJ-21",infraction:"Braquage banque (Fleeca)",         categorie:"Délit majeur",  amende:"15 000$" },
  { code:"DMJ-28",infraction:"Faux témoignage",                  categorie:"Délit majeur",  amende:"9 000$" },
  { code:"DMJ-36",infraction:"Participation à une fusillade",    categorie:"Délit majeur",  amende:"3 500$" },
  { code:"DMJ-54",infraction:"Possession de fusil d'assaut",     categorie:"Délit majeur",  amende:"35 000$" },
  { code:"DMJ-83",infraction:"Prise d'otage sur civil",          categorie:"Délit majeur",  amende:"4 500$" },
  { code:"DMJ-91",infraction:"Vol à main armée",                 categorie:"Délit majeur",  amende:"5 000$" },
  { code:"DMJ-100",infraction:"Corruption",                      categorie:"Délit majeur",  amende:"22 500$" },
  { code:"CR-2", infraction:"Blanchiment",                       categorie:"Crime",         amende:"5$×somme" },
  { code:"CR-4", infraction:"Assassinat prémédité (MORT RP)",    categorie:"Crime",         amende:"225 000$" },
  { code:"CR-8", infraction:"Meurtre (MORT RP)",                 categorie:"Crime",         amende:"100 800$" },
  { code:"CR-11",infraction:"Cavale",                            categorie:"Crime",         amende:"9 000$" },
  { code:"CR-15",infraction:"Meurtre représentant État (MORT RP)",categorie:"Crime",        amende:"300 000$" },
  { code:"CR-17",infraction:"Meurtre (COMA)",                    categorie:"Crime",         amende:"18 000$" },
  { code:"CR-19",infraction:"Possession de grenade",             categorie:"Crime",         amende:"135 000$" },
  { code:"CR-22",infraction:"Séquestration",                     categorie:"Crime",         amende:"15 500$" },
  { code:"CR-23",infraction:"Terrorisme",                        categorie:"Crime",         amende:"45 000$" },
];

const CAT_COLORS: Record<string,string> = {
  Contravention:"#64748b","Délit mineur":"#f59e0b","Délit majeur":"#ef4444",Crime:"#7c3aed",
};

interface CasierEntry {
  id:string; client_nom:string; code:string; infraction:string; categorie:string;
  amende_prononcee:string; detention_prononcee:string; date_condamnation:string;
  notes:string; created_by:string;
}

export default function CasierPage() {
  const user = getUser();
  const [entries, setEntries] = useState<CasierEntry[]>([]);
  const [clients, setClients] = useState<{nom_rp:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({client_nom:"",code:"",infraction:"",categorie:"Délit mineur",amende_prononcee:"",detention_prononcee:"",date_condamnation:"",notes:""});
  const [chefSearch, setChefSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);

  useEffect(()=>{load();},[]);

  async function load() {
    if(!supabase||!user){setLoading(false);return;}
    const [{data:e},{data:c}] = await Promise.all([
      supabase.from("casier").select("*").eq("created_by",user.nom).order("date_condamnation",{ascending:false}),
      supabase.from("clients").select("nom_rp").eq("created_by",user.nom).order("nom_rp"),
    ]);
    setEntries(e||[]);setClients(c||[]);setLoading(false);
  }

  function showT(msg:string){setToast(msg);setTimeout(()=>setToast(null),3000);}

  async function save() {
    if(!supabase||!user||!form.client_nom.trim()||!form.infraction)return;
    setSaving(true);
    const {error}=await supabase.from("casier").insert([{...form,created_by:user.nom}]);
    if(!error){showT("Condamnation ajoutée");setShowForm(false);load();}
    setSaving(false);
  }

  async function doDelete(id:string) {
    if(!supabase)return;
    await supabase.from("casier").delete().eq("id",id);
    setEntries(e=>e.filter(x=>x.id!==id));setConfirmDelete(null);showT("Supprimé");
  }

  function selectChef(c:typeof CHEFS_PENAL[0]) {
    setForm(f=>({...f,code:c.code,infraction:c.infraction,categorie:c.categorie,amende_prononcee:c.amende}));
    setChefSearch("");
  }

  const filtered=entries.filter(e=>
    (!filterClient||e.client_nom===filterClient)&&
    (!filterCat||e.categorie===filterCat)&&
    (!search||e.client_nom.toLowerCase().includes(search.toLowerCase())||e.infraction.toLowerCase().includes(search.toLowerCase()))
  );
  const uniqueClients=[...new Set(entries.map(e=>e.client_nom))];
  const dateStr=(d:string)=>d?new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const filteredChefs=CHEFS_PENAL.filter(c=>c.infraction.toLowerCase().includes(chefSearch.toLowerCase())||c.code.toLowerCase().includes(chefSearch.toLowerCase()));

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Casiers judiciaires</h1>
          <p className="page-subtitle">{filtered.length} condamnation{filtered.length!==1?"s":""} enregistrée{filtered.length!==1?"s":""}</p>
          <div className="gold-line"/>
        </div>
        <button className="btn btn-gold" onClick={()=>{setForm({client_nom:"",code:"",infraction:"",categorie:"Délit mineur",amende_prononcee:"",detention_prononcee:"",date_condamnation:"",notes:""});setShowForm(true);}}>
          + Ajouter une condamnation
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{flex:1}}>
          <span className="search-icon">🔍</span>
          <input placeholder="Client, infraction…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer"}}>×</button>}
        </div>
        <select value={filterClient} onChange={e=>setFilterClient(e.target.value)} style={{width:"auto",minWidth:160}}>
          <option value="">Tous les clients</option>
          {uniqueClients.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:"auto",minWidth:160}}>
          <option value="">Toutes catégories</option>
          {["Contravention","Délit mineur","Délit majeur","Crime"].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {entries.length>0&&(
        <div style={{display:"flex",gap:"0.625rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
          {["Contravention","Délit mineur","Délit majeur","Crime"].map(cat=>{
            const count=entries.filter(e=>e.categorie===cat).length;
            if(count===0)return null;
            const col=CAT_COLORS[cat];
            return <div key={cat} style={{padding:"0.4rem 0.875rem",borderRadius:"var(--radius)",background:col+"12",border:`1px solid ${col}25`,display:"flex",alignItems:"center",gap:"0.4rem"}}>
              <span style={{fontWeight:700,color:col}}>{count}</span>
              <span style={{fontSize:"0.72rem",color:col}}>{cat}{count>1?"s":""}</span>
            </div>;
          })}
        </div>
      )}

      {loading?(
        <div className="empty-state"><div className="empty-icon">⚖️</div><div className="empty-title">Chargement…</div></div>
      ):filtered.length===0?(
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">{search||filterClient||filterCat?"Aucun résultat":"Aucune condamnation"}</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
          {filtered.map(e=>{
            const col=CAT_COLORS[e.categorie]||"#64748b";
            return(
              <div key={e.id} style={{background:"var(--card)",border:`1px solid ${col}20`,borderRadius:"var(--radius-lg)",padding:"1rem 1.25rem",borderLeft:`4px solid ${col}`,display:"flex",alignItems:"flex-start",gap:"1rem"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.625rem",marginBottom:"0.35rem",flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,fontSize:"0.9rem"}}>{e.client_nom}</span>
                    <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:col,background:col+"15",padding:"0.1rem 0.45rem",borderRadius:4}}>{e.code}</span>
                    <span style={{fontSize:"0.7rem",padding:"0.15rem 0.5rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`}}>{e.categorie}</span>
                  </div>
                  <div style={{fontWeight:500,fontSize:"0.875rem",marginBottom:"0.35rem"}}>{e.infraction}</div>
                  <div style={{display:"flex",gap:"1.25rem",fontSize:"0.78rem",color:"var(--text-dim)",flexWrap:"wrap"}}>
                    {e.amende_prononcee&&<span>💰 {e.amende_prononcee}</span>}
                    {e.detention_prononcee&&<span>⏱ {e.detention_prononcee}</span>}
                    {e.date_condamnation&&<span>📅 {dateStr(e.date_condamnation)}</span>}
                  </div>
                  {e.notes&&<div style={{marginTop:"0.5rem",fontSize:"0.78rem",color:"var(--text-dim)",background:"var(--surface)",borderRadius:6,padding:"0.4rem 0.625rem",borderLeft:"2px solid var(--border)",fontStyle:"italic"}}>{e.notes}</div>}
                </div>
                <button className="btn btn-danger btn-sm" onClick={()=>setConfirmDelete(e.id)} style={{flexShrink:0}}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {showForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Ajouter une condamnation</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client *</label>
                <input list="casier-clients" placeholder="Nom RP" value={form.client_nom} onChange={e=>setForm(f=>({...f,client_nom:e.target.value}))} autoFocus/>
                <datalist id="casier-clients">{clients.map(c=><option key={c.nom_rp} value={c.nom_rp}/>)}</datalist>
              </div>
              <div className="form-group">
                <label>Infraction *</label>
                <input placeholder="Rechercher dans le code pénal…" value={chefSearch||form.infraction}
                  onChange={e=>{setChefSearch(e.target.value);if(!e.target.value)setForm(f=>({...f,code:"",infraction:"",categorie:"Délit mineur"}));}}/>
                {chefSearch&&(
                  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius)",maxHeight:200,overflowY:"auto",marginTop:4}}>
                    {filteredChefs.slice(0,12).map(c=>(
                      <button key={c.code} onClick={()=>selectChef(c)} style={{display:"flex",alignItems:"center",gap:"0.625rem",width:"100%",padding:"0.5rem 0.875rem",background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--card)"}
                        onMouseLeave={e=>e.currentTarget.style.background="none"}>
                        <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:CAT_COLORS[c.categorie],background:CAT_COLORS[c.categorie]+"15",padding:"0.1rem 0.4rem",borderRadius:4,flexShrink:0}}>{c.code}</span>
                        <span style={{fontSize:"0.825rem",color:"var(--text)",flex:1}}>{c.infraction}</span>
                        <span style={{fontSize:"0.7rem",color:"var(--text-dim)",flexShrink:0}}>{c.amende}</span>
                      </button>
                    ))}
                    {filteredChefs.length===0&&<div style={{padding:"0.75rem",color:"var(--text-dim)",fontSize:"0.8rem",textAlign:"center"}}>Aucun résultat</div>}
                  </div>
                )}
                {form.code&&!chefSearch&&<div style={{fontSize:"0.75rem",color:CAT_COLORS[form.categorie],marginTop:4}}>✓ {form.code} · {form.categorie}</div>}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Amende prononcée</label>
                  <input placeholder="Ex: 15 000$" value={form.amende_prononcee} onChange={e=>setForm(f=>({...f,amende_prononcee:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label>Détention prononcée</label>
                  <input placeholder="Ex: 30 minutes" value={form.detention_prononcee} onChange={e=>setForm(f=>({...f,detention_prononcee:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label>Date de condamnation</label>
                  <input type="date" value={form.date_condamnation} onChange={e=>setForm(f=>({...f,date_condamnation:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} placeholder="Contexte, circonstances…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving||!form.client_nom.trim()||!form.infraction} style={{opacity:saving?0.7:1}}>
                {saving?"Enregistrement…":"Ajouter au casier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete&&(
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette entrée ?</div>
            <div className="confirm-msg">Cette action est irréversible.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={()=>setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={()=>doDelete(confirmDelete)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
