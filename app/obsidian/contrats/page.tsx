"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
const TYPES=["Livraison","Surveillance","Intimidation","Récupération","Braquage","Autre"];
const DIFFS=["Facile","Normale","Difficile","Extrême"];
const STATUTS=["En attente","En cours","Terminé","Échoué","Annulé"];
const SCOL:Record<string,string>={"En attente":"var(--text-dim)","En cours":"var(--warning)",Terminé:"var(--success)",Échoué:"var(--danger)",Annulé:"var(--text-dim)"};
const DCOL:Record<string,string>={Facile:"var(--success)",Normale:"var(--info)",Difficile:"var(--warning)",Extrême:"var(--danger)"};
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const EMPTY={titre:"",type:"Livraison",difficulte:"Normale",recompense:0,statut:"En attente",membres_affectes:[] as string[],description:"",rapport:"",date_cible:""};
export default function ContratsPage(){
  const { user, loading: userLoading } = useCurrentUser();
  const [contrats,setContrats]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [showRapport,setShowRapport]=useState<any>(null);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({...EMPTY});
  const [membresInput,setMembresInput]=useState("");
  const [rapport,setRapport]=useState("");
  const [filterStatut,setFilterStatut]=useState("");
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_contrats").select("*").order("created_at",{ascending:false});setContrats(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.titre)return;setSaving(true);const membres=membresInput.split(",").map(s=>s.trim()).filter(Boolean);const payload={...form,membres_affectes:membres,created_by:user?.nom||""};if(editId){const{data}=await supabase.from("obsidian_contrats").update(payload).eq("id",editId).select().single();if(data)setContrats(c=>c.map(x=>x.id===editId?data:x));showT("Mis à jour");}else{const{data}=await supabase.from("obsidian_contrats").insert([payload]).select().single();if(data)setContrats(c=>[data,...c]);showT("Contrat créé");}setShowForm(false);setEditId(null);setForm({...EMPTY});setMembresInput("");setSaving(false);}
  async function saveRapport(){if(!supabase||!showRapport)return;await supabase.from("obsidian_contrats").update({rapport}).eq("id",showRapport.id);setContrats(c=>c.map(x=>x.id===showRapport.id?{...x,rapport}:x));setShowRapport(null);showT("Rapport sauvegardé");}
  async function changeStatut(id:string,statut:string){if(!supabase)return;await supabase.from("obsidian_contrats").update({statut}).eq("id",id);setContrats(c=>c.map(x=>x.id===id?{...x,statut}:x));}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_contrats").delete().eq("id",id);setContrats(c=>c.filter(x=>x.id!==id));showT("Supprimé");}
  const filtered=contrats.filter(c=>!filterStatut||c.statut===filterStatut);
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">📋 Contrats</h1><p className="page-subtitle">Missions · Opérations · Rapports</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>{setForm({...EMPTY});setEditId(null);setMembresInput("");setShowForm(true);}}>+ Nouveau contrat</button></div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {["","En attente","En cours","Terminé","Échoué","Annulé"].map(s=><button key={s||"all"} onClick={()=>setFilterStatut(s)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterStatut===s?700:400,background:filterStatut===s?"var(--gold-muted)":"var(--surface)",border:`1px solid ${filterStatut===s?"rgba(201,168,76,0.4)":"var(--border)"}`,color:filterStatut===s?"var(--gold)":"var(--text-muted)"}}>{s||"Tous"}</button>)}
      </div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {filtered.map(c=>{const scol=SCOL[c.statut]||"var(--text-dim)";const dcol=DCOL[c.difficulte]||"var(--text-dim)";return(
          <div key={c.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",borderLeft:`4px solid ${scol}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.5rem",gap:"0.5rem",flexWrap:"wrap"}}>
              <div><div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:"0.2rem"}}>{c.titre}</div><div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",fontSize:"0.68rem",color:"var(--text-dim)"}}><span style={{color:scol,fontWeight:600}}>{c.statut}</span><span>📋 {c.type}</span><span style={{color:dcol,fontWeight:600}}>⚡ {c.difficulte}</span>{c.date_cible&&<span>📅 {new Date(c.date_cible+"T12:00:00").toLocaleDateString("fr-FR")}</span>}</div></div>
              <div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.1rem",color:"var(--gold)"}}>{fmt(c.recompense)}</div><div style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>récompense</div></div>
            </div>
            {c.membres_affectes?.length>0&&<div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.3rem"}}>👥 {c.membres_affectes.join(" · ")}</div>}
            {c.description&&<div style={{fontSize:"0.72rem",color:"var(--text-muted)",marginBottom:"0.5rem"}}>{c.description}</div>}
            {c.rapport&&<div style={{fontSize:"0.72rem",color:"var(--success)",marginBottom:"0.5rem",background:"rgba(34,197,94,0.06)",borderRadius:"var(--radius)",padding:"0.4rem 0.625rem",borderLeft:"3px solid var(--success)"}}>📝 {c.rapport.slice(0,120)}{c.rapport.length>120?"…":""}</div>}
            <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
              {STATUTS.filter(s=>s!==c.statut).slice(0,3).map(s=><button key={s} onClick={()=>changeStatut(c.id,s)} style={{padding:"0.2rem 0.5rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.65rem",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-dim)"}}>→ {s}</button>)}
              <button className="btn btn-ghost btn-sm" onClick={()=>{setShowRapport(c);setRapport(c.rapport||"");}}>📝 Rapport</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({titre:c.titre,type:c.type,difficulte:c.difficulte,recompense:c.recompense,statut:c.statut,membres_affectes:c.membres_affectes||[],description:c.description||"",rapport:c.rapport||"",date_cible:c.date_cible||""});setMembresInput((c.membres_affectes||[]).join(", "));setEditId(c.id);setShowForm(true);}}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>del(c.id)} style={{color:"var(--danger)"}}>🗑️</button>
            </div>
          </div>);})}
        {filtered.length===0&&<div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucun contrat</div></div>}
      </div>}
      {showForm&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}><div className="modal modal-lg"><div className="modal-header"><h2 className="modal-title">{editId?"Modifier":"Nouveau"} contrat</h2><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Titre *</label><input autoFocus value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))}/></div><div className="form-group"><label>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Difficulté</label><select value={form.difficulte} onChange={e=>setForm(f=>({...f,difficulte:e.target.value}))}>{DIFFS.map(d=><option key={d}>{d}</option>)}</select></div><div className="form-group"><label>Statut</label><select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Récompense ($)</label><input type="number" value={form.recompense||""} onChange={e=>setForm(f=>({...f,recompense:+e.target.value}))}/></div><div className="form-group"><label>Date cible</label><input type="date" value={form.date_cible} onChange={e=>setForm(f=>({...f,date_cible:e.target.value}))}/></div><div className="form-group" style={{gridColumn:"1/-1"}}><label>Membres (séparés par virgule)</label><input value={membresInput} onChange={e=>setMembresInput(e.target.value)} placeholder="Marco, Lucia..."/></div></div><div className="form-group"><label>Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button><button className="btn btn-gold" onClick={save} disabled={saving||!form.titre}>{saving?"…":"Sauvegarder"}</button></div></div></div>}
      {showRapport&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowRapport(null)}><div className="modal"><div className="modal-header"><h2 className="modal-title">📝 Rapport — {showRapport.titre}</h2><button className="modal-close" onClick={()=>setShowRapport(null)}>×</button></div><div className="modal-body"><div className="form-group" style={{marginBottom:0}}><label>Rapport de mission</label><textarea rows={8} autoFocus value={rapport} onChange={e=>setRapport(e.target.value)} placeholder="Détails de l'opération, résultat, incidents..."/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowRapport(null)}>Annuler</button><button className="btn btn-gold" onClick={saveRapport}>Sauvegarder</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}