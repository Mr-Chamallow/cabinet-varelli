"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
const TYPES=["Réunion","Livraison","Surveillance","Intimidation","Récupération","Rencontre fournisseur","Braquage","Entraînement","Autre"];
const PRIOS=["Basse","Normale","Haute","Critique"];
const STATUTS=["Planifié","En cours","Terminé","Annulé"];
const PCOL:Record<string,string>={Basse:"var(--text-dim)",Normale:"var(--info)",Haute:"var(--warning)",Critique:"var(--danger)"};
const SCOL:Record<string,string>={Planifié:"var(--info)","En cours":"var(--warning)",Terminé:"var(--success)",Annulé:"var(--text-dim)"};
const EMPTY={titre:"",date:"",heure:"",type:"Réunion",lieu:"",membres_concernes:[] as string[],priorite:"Normale",statut:"Planifié",notes:""};
export default function RdvPage(){
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_rdv"))) { window.location.href = "/"; } }, [user, userLoading]);
  const [rdvs,setRdvs]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState<string|null>(null);
  const [form,setForm]=useState({...EMPTY});
  const [membresInput,setMembresInput]=useState("");
  const [filterStatut,setFilterStatut]=useState("");
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_rdv").select("*").order("date",{ascending:true}).order("heure",{ascending:true});setRdvs(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.titre)return;setSaving(true);const membres=membresInput.split(",").map(s=>s.trim()).filter(Boolean);const payload={...form,membres_concernes:membres,created_by:user?.nom||""};if(editId){const{data}=await supabase.from("obsidian_rdv").update(payload).eq("id",editId).select().single();if(data)setRdvs(r=>r.map(x=>x.id===editId?data:x));showT("Mis à jour");}else{const{data}=await supabase.from("obsidian_rdv").insert([payload]).select().single();if(data)setRdvs(r=>[...r,data]);showT("RDV créé");}setShowForm(false);setEditId(null);setForm({...EMPTY});setMembresInput("");setSaving(false);}
  async function changeStatut(id:string,statut:string){if(!supabase)return;await supabase.from("obsidian_rdv").update({statut}).eq("id",id);setRdvs(r=>r.map(x=>x.id===id?{...x,statut}:x));}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_rdv").delete().eq("id",id);setRdvs(r=>r.filter(x=>x.id!==id));showT("Supprimé");}
  const filtered=rdvs.filter(r=>!filterStatut||r.statut===filterStatut);
  const upcoming=filtered.filter(r=>r.statut==="Planifié"||r.statut==="En cours");
  const past=filtered.filter(r=>r.statut==="Terminé"||r.statut==="Annulé");
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">📅 Rendez-vous</h1><p className="page-subtitle">Planification des opérations · Réunions · Livraisons</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>{setForm({...EMPTY});setEditId(null);setMembresInput("");setShowForm(true);}}>+ Nouveau RDV</button></div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {["","Planifié","En cours","Terminé","Annulé"].map(s=><button key={s||"all"} onClick={()=>setFilterStatut(s)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterStatut===s?700:400,background:filterStatut===s?"var(--gold-muted)":"var(--surface)",border:`1px solid ${filterStatut===s?"rgba(201,168,76,0.4)":"var(--border)"}`,color:filterStatut===s?"var(--gold)":"var(--text-muted)"}}>{s||"Tous"}</button>)}
      </div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:<>
        {upcoming.length>0&&<><div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.625rem",fontWeight:700}}>— À venir —</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"1.5rem"}}>
          {upcoming.map(r=>{const pcol=PCOL[r.priorite]||"var(--text-dim)";const scol=SCOL[r.statut]||"var(--text-dim)";return<div key={r.id} style={{background:"var(--card)",border:`1px solid ${pcol}25`,borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",borderLeft:`4px solid ${pcol}`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"0.5rem",gap:"0.5rem",flexWrap:"wrap"}}>
              <div><div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:"0.2rem"}}>{r.titre}</div><div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",fontSize:"0.68rem",color:"var(--text-dim)"}}><span>📅 {r.date?new Date(r.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short"}):""}</span>{r.heure&&<span>🕐 {r.heure}</span>}{r.lieu&&<span>📍 {r.lieu}</span>}<span style={{color:pcol,fontWeight:600}}>{r.type}</span></div></div>
              <div style={{display:"flex",gap:"0.35rem",flexShrink:0,alignItems:"center"}}>
                <span style={{fontSize:"0.65rem",padding:"0.08rem 0.4rem",borderRadius:999,background:scol+"15",color:scol,border:`1px solid ${scol}25`,fontWeight:600}}>{r.statut}</span>
                <span style={{fontSize:"0.65rem",padding:"0.08rem 0.4rem",borderRadius:999,background:pcol+"15",color:pcol,border:`1px solid ${pcol}25`}}>{r.priorite}</span>
              </div>
            </div>
            {r.membres_concernes?.length>0&&<div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.3rem"}}>👥 {r.membres_concernes.join(" · ")}</div>}
            {r.notes&&<div style={{fontSize:"0.72rem",color:"var(--text-dim)",fontStyle:"italic",marginBottom:"0.5rem"}}>{r.notes}</div>}
            <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
              {STATUTS.filter(s=>s!==r.statut).map(s=><button key={s} onClick={()=>changeStatut(r.id,s)} style={{padding:"0.2rem 0.5rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.65rem",background:"var(--surface)",border:"1px solid var(--border)",color:"var(--text-dim)"}}>→ {s}</button>)}
              <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({titre:r.titre,date:r.date||"",heure:r.heure||"",type:r.type,lieu:r.lieu||"",membres_concernes:r.membres_concernes||[],priorite:r.priorite,statut:r.statut,notes:r.notes||""});setMembresInput((r.membres_concernes||[]).join(", "));setEditId(r.id);setShowForm(true);}}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>del(r.id)} style={{color:"var(--danger)"}}>🗑️</button>
            </div>
          </div>;})}
        </div></>}
        {past.length>0&&<><div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.625rem",fontWeight:700}}>— Passés —</div>
        <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{past.map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",opacity:0.6}}><div style={{flex:1}}><span style={{fontWeight:600,fontSize:"0.82rem"}}>{r.titre}</span><span style={{fontSize:"0.65rem",color:"var(--text-dim)",marginLeft:"0.5rem"}}>{r.date?new Date(r.date+"T12:00:00").toLocaleDateString("fr-FR"):""}</span></div><span style={{fontSize:"0.65rem",color:SCOL[r.statut]||"var(--text-dim)"}}>{r.statut}</span><button className="btn btn-ghost btn-sm" onClick={()=>del(r.id)} style={{color:"var(--danger)"}}>🗑️</button></div>)}</div></>}
        {filtered.length===0&&<div className="empty-state"><div className="empty-icon">📅</div><div className="empty-title">Aucun rendez-vous</div></div>}
      </>}
      {showForm&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}><div className="modal modal-lg"><div className="modal-header"><h2 className="modal-title">{editId?"Modifier":"Nouveau"} rendez-vous</h2><button className="modal-close" onClick={()=>setShowForm(false)}>×</button></div><div className="modal-body"><div className="form-grid"><div className="form-group"><label>Titre *</label><input autoFocus value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))}/></div><div className="form-group"><label>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div><div className="form-group"><label>Heure</label><input type="time" value={form.heure} onChange={e=>setForm(f=>({...f,heure:e.target.value}))}/></div><div className="form-group"><label>Lieu</label><input value={form.lieu} onChange={e=>setForm(f=>({...f,lieu:e.target.value}))}/></div><div className="form-group"><label>Priorité</label><select value={form.priorite} onChange={e=>setForm(f=>({...f,priorite:e.target.value}))}>{PRIOS.map(p=><option key={p}>{p}</option>)}</select></div><div className="form-group"><label>Statut</label><select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>{STATUTS.map(s=><option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Membres (séparés par virgule)</label><input value={membresInput} onChange={e=>setMembresInput(e.target.value)} placeholder="Marco Varelli, Lucia..."/></div></div><div className="form-group" style={{marginBottom:0}}><label>Notes / Description</label><textarea rows={3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button><button className="btn btn-gold" onClick={save} disabled={saving||!form.titre}>{saving?"…":"Sauvegarder"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}