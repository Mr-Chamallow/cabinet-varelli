"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
const TYPES=["Réunion","Braquage","Convoi","Livraison","Anniversaire RP","Entraînement","Surveillance","Autre"];
const TCOL:Record<string,string>={Réunion:"var(--info)",Braquage:"var(--danger)",Convoi:"var(--warning)",Livraison:"#f97316","Anniversaire RP":"#a855f7",Entraînement:"var(--success)",Surveillance:"#0ea5e9",Autre:"var(--text-dim)"};
const EMPTY={titre:"",type:"Réunion",date:"",heure:"",lieu:"",description:"",membres:[] as string[],statut:"Planifié"};
export default function PlanificationPage(){
  const { user, loading: userLoading } = useCurrentUser();
  const [events,setEvents]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({...EMPTY});
  const [membresInput,setMembresInput]=useState("");
  const [filterType,setFilterType]=useState("");
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_planification").select("*").order("date",{ascending:true});setEvents(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.titre||!form.date)return;setSaving(true);const membres=membresInput.split(",").map(s=>s.trim()).filter(Boolean);const payload={...form,membres,created_by:user?.nom||""};if(editId){const{data}=await supabase.from("obsidian_planification").update(payload).eq("id",editId).select().single();if(data)setEvents(e=>e.map(x=>x.id===editId?data:x));showT("Mis à jour");}else{const{data}=await supabase.from("obsidian_planification").insert([payload]).select().single();if(data)setEvents(e=>[...e,data].sort((a,b)=>a.date.localeCompare(b.date)));showT("Événement créé");}setShowForm(false);setEditId(null);setForm({...EMPTY});setMembresInput("");setSaving(false);}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_planification").delete().eq("id",id);setEvents(e=>e.filter(x=>x.id!==id));showT("Supprimé");}
  const filtered=events.filter(e=>!filterType||e.type===filterType);
  const now=new Date().toISOString().split("T")[0];
  const upcoming=filtered.filter(e=>e.date>=now&&e.statut!=="Annulé");
  const past=filtered.filter(e=>e.date<now||e.statut==="Annulé");
  function groupByMonth(evts:any[]){const m:Record<string,any[]>={};evts.forEach(e=>{const k=e.date?e.date.slice(0,7):"?";if(!m[k])m[k]=[];m[k].push(e);});return Object.entries(m);}
  const MOIS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">🗓️ Planification</h1><p className="page-subtitle">Calendrier · Événements · Réunions · Braquages · Convois</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>{setForm({...EMPTY});setEditId(null);setMembresInput("");setShowForm(true);}}>+ Ajouter</button></div>
      <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <button onClick={()=>setFilterType("")} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:!filterType?700:400,background:!filterType?"var(--gold-muted)":"var(--surface)",border:`1px solid ${!filterType?"rgba(201,168,76,0.4)":"var(--border)"}`,color:!filterType?"var(--gold)":"var(--text-muted)"}}>Tous</button>
        {TYPES.map(t=>{const col=TCOL[t]||"var(--text-dim)";return<button key={t} onClick={()=>setFilterType(filterType===t?"":t)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterType===t?700:400,background:filterType===t?col+"15":"var(--surface)",border:`1px solid ${filterType===t?col+"40":"var(--border)"}`,color:filterType===t?col:"var(--text-muted)"}}>{t}</button>;})}
      </div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:<>
        {groupByMonth(upcoming).map(([ym,evts])=>{const[y,m]=ym.split("-");const moisNom=MOIS[parseInt(m)-1]+" "+y;return(<div key={ym} style={{marginBottom:"1.5rem"}}><div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:"0.5rem"}}><div style={{flex:1,height:1,background:"var(--border)"}}/>{moisNom}<div style={{flex:1,height:1,background:"var(--border)"}}/></div><div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>{evts.map(e=>{const col=TCOL[e.type]||"var(--text-dim)";const d=e.date?new Date(e.date+"T12:00:00"):null;return(<div key={e.id} style={{display:"flex",gap:"1rem",background:"var(--card)",border:`1px solid ${col}20`,borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",borderLeft:`4px solid ${col}`}}>
          <div style={{textAlign:"center",minWidth:48,flexShrink:0}}><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.5rem",lineHeight:1,color:col}}>{d?d.getDate():"?"}</div><div style={{fontSize:"0.6rem",color:"var(--text-dim)"}}>{d?MOIS[d.getMonth()].slice(0,3).toUpperCase():""}</div></div>
          <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem",flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:"0.875rem"}}>{e.titre}</span><span style={{fontSize:"0.62rem",padding:"0.06rem 0.35rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,fontWeight:600}}>{e.type}</span>{e.heure&&<span style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>🕐 {e.heure}</span>}</div>{e.lieu&&<div style={{fontSize:"0.68rem",color:"var(--text-dim)",marginBottom:"0.2rem"}}>📍 {e.lieu}</div>}{e.membres?.length>0&&<div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.2rem"}}>👥 {e.membres.join(" · ")}</div>}{e.description&&<div style={{fontSize:"0.72rem",color:"var(--text-muted)",fontStyle:"italic"}}>{e.description}</div>}</div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",flexShrink:0}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({titre:e.titre,type:e.type,date:e.date||"",heure:e.heure||"",lieu:e.lieu||"",description:e.description||"",membres:e.membres||[],statut:e.statut});setMembresInput((e.membres||[]).join(", "));setEditId(e.id);setShowForm(true);}}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>del(e.id)} style={{color:"var(--danger)"}}>🗑️</button>
          </div>
        </div>);})}</div></div>);})}
        {upcoming.length===0&&<div className="empty-state"><div className="empty-icon">🗓️</div><div className="empty-title">Aucun événement à venir</div></div>}
        {past.length>0&&<><div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginTop:"1.5rem",marginBottom:"0.75rem",fontWeight:700}}>— Passés —</div><div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{past.map(e=><div key={e.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0.875rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",opacity:0.5}}><span style={{fontSize:"0.75rem",fontWeight:600}}>{e.date?new Date(e.date+"T12:00:00").toLocaleDateString("fr-FR"):""}</span><span style={{flex:1,fontSize:"0.82rem"}}>{e.titre}</span><span style={{fontSize:"0.65rem",color:TCOL[e.type]||"var(--text-dim)"}}>{e.type}</span><button className="btn btn-ghost btn-sm" onClick={()=>del(e.id)} style={{color:"var(--danger)"}}>🗑️</button></div>)}</div></>}
      </>}
      {showForm&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}><div className="modal modal-lg"><div className="modal-header"><h2 className="modal-title">{editId?"Modifier":"Ajouter"} un événement</h2><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Titre *</label><input autoFocus value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))}/></div><div className="form-group"><label>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Date *</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div><div className="form-group"><label>Heure</label><input type="time" value={form.heure} onChange={e=>setForm(f=>({...f,heure:e.target.value}))}/></div><div className="form-group"><label>Lieu</label><input value={form.lieu} onChange={e=>setForm(f=>({...f,lieu:e.target.value}))}/></div><div className="form-group"><label>Membres</label><input value={membresInput} onChange={e=>setMembresInput(e.target.value)} placeholder="Marco, Lucia, ..."/></div></div><div className="form-group" style={{marginBottom:0}}><label>Description</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button><button className="btn btn-gold" onClick={save} disabled={saving||!form.titre||!form.date}>{saving?"…":"Sauvegarder"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}