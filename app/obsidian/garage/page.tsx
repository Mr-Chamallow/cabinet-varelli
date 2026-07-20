"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
const STATUTS=["Disponible","Sortie","Fourrière","Endommagé","Détruit"];
const SCOL:Record<string,string>={Disponible:"var(--success)",Sortie:"var(--warning)",Fourrière:"var(--danger)",Endommagé:"#f97316",Détruit:"var(--text-dim)"};
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const EMPTY={modele:"",plaque:"",couleur:"",position:"",statut:"Disponible",assigne_a:"",notes:"",valeur:0};
export default function GaragePage(){
  const user=getUser();
  const [veh,setVeh]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({...EMPTY});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [filterStatut,setFilterStatut]=useState("");
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_garage").select("*").order("statut").order("modele");setVeh(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.modele||!form.plaque)return;setSaving(true);if(editId){const{data}=await supabase.from("obsidian_garage").update(form).eq("id",editId).select().single();if(data)setVeh(v=>v.map(x=>x.id===editId?data:x));showT("Mis à jour");}else{const{data}=await supabase.from("obsidian_garage").insert([{...form,created_by:user?.nom||""}]).select().single();if(data)setVeh(v=>[...v,data]);showT("Ajouté");}setShowForm(false);setEditId(null);setForm({...EMPTY});setSaving(false);}
  async function changeStatut(id:string,statut:string){if(!supabase)return;await supabase.from("obsidian_garage").update({statut}).eq("id",id);setVeh(v=>v.map(x=>x.id===id?{...x,statut}:x));}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_garage").delete().eq("id",id);setVeh(v=>v.filter(x=>x.id!==id));showT("Supprimé");}
  const filtered=veh.filter(v=>!filterStatut||v.statut===filterStatut);
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">🚗 Garage</h1><p className="page-subtitle">Véhicules · Plaques · Positions · Statuts</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>{setForm({...EMPTY});setEditId(null);setShowForm(true);}}>+ Ajouter</button></div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {["","Disponible","Sortie","Fourrière","Endommagé","Détruit"].map(s=><button key={s||"all"} onClick={()=>setFilterStatut(s)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterStatut===s?700:400,background:filterStatut===s?"var(--gold-muted)":"var(--surface)",border:`1px solid ${filterStatut===s?"rgba(201,168,76,0.4)":"var(--border)"}`,color:filterStatut===s?"var(--gold)":"var(--text-muted)"}}>{s||"Tous"}</button>)}
      </div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {filtered.map(v=>{const col=SCOL[v.statut]||"var(--text-dim)";return<div key={v.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,background:col+"15",border:`2px solid ${col}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.25rem"}}>🚗</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:"0.9rem"}}>{v.modele}</span>
              <span style={{fontFamily:"monospace",fontSize:"0.72rem",color:"var(--text-dim)",background:"var(--surface)",padding:"0.08rem 0.4rem",borderRadius:4,border:"1px solid var(--border)"}}>{v.plaque}</span>
              {v.couleur&&<span style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{v.couleur}</span>}
            </div>
            <div style={{display:"flex",gap:"0.625rem",fontSize:"0.68rem",color:"var(--text-dim)",flexWrap:"wrap"}}>
              {v.position&&<span>📍 {v.position}</span>}
              {v.assigne_a&&<span>👤 {v.assigne_a}</span>}
              {v.valeur>0&&<span>💰 {fmt(v.valeur)}</span>}
              {v.notes&&<span style={{fontStyle:"italic"}}>{v.notes}</span>}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"0.4rem",flexShrink:0}}>
            <span style={{fontSize:"0.72rem",padding:"0.1rem 0.5rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,fontWeight:600}}>{v.statut}</span>
            <select value={v.statut} onChange={e=>changeStatut(v.id,e.target.value)} style={{fontSize:"0.65rem",padding:"0.15rem 0.3rem",borderRadius:"var(--radius)"}}>
              {STATUTS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:"0.3rem",flexShrink:0}}>
            <button className="btn btn-outline btn-sm" onClick={()=>{setForm({modele:v.modele,plaque:v.plaque,couleur:v.couleur||"",position:v.position||"",statut:v.statut,assigne_a:v.assigne_a||"",notes:v.notes||"",valeur:v.valeur||0});setEditId(v.id);setShowForm(true);}}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>del(v.id)} style={{color:"var(--danger)"}}>🗑️</button>
          </div>
        </div>;})}
        {filtered.length===0&&<div className="empty-state"><div className="empty-icon">🚗</div><div className="empty-title">Aucun véhicule</div></div>}
      </div>}
      {showForm&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}><div className="modal modal-lg"><div className="modal-header"><h2 className="modal-title">{editId?"Modifier":"Ajouter"} un véhicule</h2><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Modèle *</label><input autoFocus value={form.modele} onChange={e=>setForm(f=>({...f,modele:e.target.value}))} placeholder="Ex: Sultan RS"/></div><div className="form-group"><label>Plaque *</label><input value={form.plaque} onChange={e=>setForm(f=>({...f,plaque:e.target.value}))} placeholder="Ex: OBS-001" style={{fontFamily:"monospace"}}/></div><div className="form-group"><label>Couleur</label><input value={form.couleur} onChange={e=>setForm(f=>({...f,couleur:e.target.value}))}/></div><div className="form-group"><label>Position / Garage</label><input value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} placeholder="Ex: Garage Mission Row"/></div><div className="form-group"><label>Statut</label><select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Assigné à</label><input value={form.assigne_a} onChange={e=>setForm(f=>({...f,assigne_a:e.target.value}))}/></div><div className="form-group"><label>Valeur ($)</label><input type="number" value={form.valeur||""} onChange={e=>setForm(f=>({...f,valeur:+e.target.value}))}/></div></div><div className="form-group" style={{marginBottom:0}}><label>Notes</label><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button><button className="btn btn-gold" onClick={save} disabled={saving||!form.modele||!form.plaque}>{saving?"…":"Sauvegarder"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}