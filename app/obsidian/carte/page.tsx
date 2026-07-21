"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
const TYPES=["garage","planque","zone","territoire","opération","point_interet"];
const TCOL:Record<string,string>={garage:"#3b82f6",planque:"#f97316",zone:"#22c55e",territoire:"#7c3aed",opération:"var(--danger)","point_interet":"var(--gold)"};
const ICONS:Record<string,string>={garage:"🚗",planque:"🏚️",zone:"🗺️",territoire:"🏴",opération:"⚡","point_interet":"📍"};
const EMPTY={nom:"",type:"planque",x:0,y:0,couleur:"#c9a84c",description:"",statut:"Actif"};
export default function CartePage(){
  const { user, loading: userLoading } = useCurrentUser();
  const [points,setPoints]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({...EMPTY});
  const [filterType,setFilterType]=useState("");
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_carte").select("*").order("type").order("nom");setPoints(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.nom)return;setSaving(true);const payload={...form,created_by:user?.nom||""};if(editId){const{data}=await supabase.from("obsidian_carte").update(payload).eq("id",editId).select().single();if(data)setPoints(p=>p.map(x=>x.id===editId?data:x));showT("Mis à jour");}else{const{data}=await supabase.from("obsidian_carte").insert([payload]).select().single();if(data)setPoints(p=>[...p,data]);showT("Point ajouté");}setShowForm(false);setEditId(null);setForm({...EMPTY});setSaving(false);}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_carte").delete().eq("id",id);setPoints(p=>p.filter(x=>x.id!==id));showT("Supprimé");}
  const filtered=points.filter(p=>!filterType||p.type===filterType);
  const byType:Record<string,any[]>={};filtered.forEach(p=>{if(!byType[p.type])byType[p.type]=[];byType[p.type].push(p);});
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">🗺️ Carte</h1><p className="page-subtitle">Garages · Planques · Zones · Territoires · Points d'intérêt</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>{setForm({...EMPTY});setEditId(null);setShowForm(true);}}>+ Ajouter POI</button></div>
      <div style={{display:"flex",gap:"0.4rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <button onClick={()=>setFilterType("")} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:!filterType?700:400,background:!filterType?"var(--gold-muted)":"var(--surface)",border:`1px solid ${!filterType?"rgba(201,168,76,0.4)":"var(--border)"}`,color:!filterType?"var(--gold)":"var(--text-muted)"}}>Tous ({points.length})</button>
        {TYPES.map(t=>{const col=TCOL[t]||"var(--text-dim)";const count=points.filter(p=>p.type===t).length;return count>0?<button key={t} onClick={()=>setFilterType(filterType===t?"":t)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterType===t?700:400,background:filterType===t?col+"15":"var(--surface)",border:`1px solid ${filterType===t?col+"40":"var(--border)"}`,color:filterType===t?col:"var(--text-muted)"}}>{ICONS[t]} {t} ({count})</button>:null;})}
      </div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:"1.25rem"}}>
        {Object.entries(byType).map(([type,pts])=>{const col=TCOL[type]||"var(--gold)";return<div key={type} className="card"><div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.875rem",paddingBottom:"0.625rem",borderBottom:"1px solid var(--border)"}}><span style={{fontSize:"1.2rem"}}>{ICONS[type]||"📍"}</span><div style={{fontWeight:700,fontSize:"0.875rem",color:col,textTransform:"capitalize"}}>{type}s</div><span style={{fontSize:"0.65rem",padding:"0.08rem 0.4rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,marginLeft:"auto"}}>{pts.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{pts.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:"0.625rem",padding:"0.4rem 0.625rem",background:"var(--surface)",borderRadius:"var(--radius)",borderLeft:`3px solid ${p.couleur||col}`}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"0.8rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nom}</div>{p.description&&<div style={{fontSize:"0.62rem",color:"var(--text-dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description}</div>}</div><div style={{display:"flex",gap:"0.2rem",flexShrink:0}}><button className="btn btn-ghost btn-sm" style={{padding:"0.15rem 0.3rem",fontSize:"0.65rem"}} onClick={()=>{setForm({nom:p.nom,type:p.type,x:p.x||0,y:p.y||0,couleur:p.couleur||"#c9a84c",description:p.description||"",statut:p.statut||"Actif"});setEditId(p.id);setShowForm(true);}}>✏️</button><button className="btn btn-ghost btn-sm" style={{padding:"0.15rem 0.3rem",fontSize:"0.65rem",color:"var(--danger)"}} onClick={()=>del(p.id)}>×</button></div></div>)}</div></div>;})}</div>}
      {points.length===0&&!loading&&<div className="empty-state"><div className="empty-icon">🗺️</div><div className="empty-title">Aucun point d'intérêt</div></div>}
      {showForm&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}><div className="modal"><div className="modal-header"><h2 className="modal-title">{editId?"Modifier":"Ajouter"} un point</h2><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/></div><div className="form-group"><label>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Couleur</label><input type="color" value={form.couleur} onChange={e=>setForm(f=>({...f,couleur:e.target.value}))}/></div><div className="form-group"><label>Statut</label><input value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}/></div></div><div className="form-group" style={{marginBottom:0}}><label>Description / Notes</label><textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Garage sécurisé, accès restreint aux responsables..."/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button><button className="btn btn-gold" onClick={save} disabled={saving||!form.nom}>{saving?"…":"Sauvegarder"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}