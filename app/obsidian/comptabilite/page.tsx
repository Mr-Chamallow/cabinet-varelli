"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const CATS_R=["Vente drogue","Vente arme","Braquage ATM","Braquage superette","Braquage banque","Blanchiment","Cotisation","Autre"];
const CATS_D=["Achat véhicule","Achat matériel","Achat drogue","Amende","Corruption","Dépense opérationnelle","Autre"];
const SEMAINES_LABELS=["Cette semaine","Semaine -1","Semaine -2","Semaine -3","Semaine -4","Tout voir"];
function getWeekStart(offset=0){const d=new Date();d.setDate(d.getDate()-d.getDay()+1-offset*7);d.setHours(0,0,0,0);return d.toISOString().split("T")[0];}
export default function ComptaPage(){
  const { user, loading: userLoading } = useCurrentUser();
  const [entries,setEntries]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"apercu"|"historique"|"saisie">("apercu");
  const [weekOffset,setWeekOffset]=useState(0);
  const [form,setForm]=useState({type:"recette",categorie:"Vente drogue",montant:0,type_argent:"sale",motif:"",membre:""});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("obsidian_comptabilite").select("*").order("created_at",{ascending:false});setEntries(data||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(){if(!supabase||!form.motif||form.montant<=0)return;setSaving(true);const semaine=getWeekStart(weekOffset);const{data}=await supabase.from("obsidian_comptabilite").insert([{...form,semaine,created_by:user?.nom||""}]).select().single();if(data)setEntries(e=>[data,...e]);setForm({type:"recette",categorie:"Vente drogue",montant:0,type_argent:"sale",motif:"",membre:""});showT("Enregistré");setSaving(false);setTab("apercu");}
  async function del(id:string){if(!supabase)return;await supabase.from("obsidian_comptabilite").delete().eq("id",id);setEntries(e=>e.filter(x=>x.id!==id));}
  const weekStart=getWeekStart(weekOffset);
  const weekEntries=useMemo(()=>entries.filter(e=>e.semaine>=weekStart),[entries,weekStart]);
  const recettes=weekEntries.filter(e=>e.type==="recette").reduce((s,e)=>s+e.montant,0);
  const depenses=weekEntries.filter(e=>e.type==="dépense").reduce((s,e)=>s+e.montant,0);
  const solde=recettes-depenses;
  const byCat=useMemo(()=>{const m:Record<string,{r:number,d:number}>={}; weekEntries.forEach(e=>{if(!m[e.categorie])m[e.categorie]={r:0,d:0};if(e.type==="recette")m[e.categorie].r+=e.montant;else m[e.categorie].d+=e.montant;});return Object.entries(m).sort((a,b)=>(b[1].r+b[1].d)-(a[1].r+a[1].d));},[weekEntries]);
  const maxBar=Math.max(...weekEntries.map(e=>e.montant),1);
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">💳 Comptabilité</h1><p className="page-subtitle">Recettes · Dépenses · Graphiques hebdomadaires</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>setTab("saisie")}>+ Saisie</button></div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[["apercu","📊 Aperçu"],["historique","📋 Historique"],["saisie","➕ Saisie"]].map(([k,l])=><button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>)}
        <div style={{marginLeft:"auto",display:"flex",gap:"0.3rem"}}>
          {[0,1,2,3,4].map(i=><button key={i} onClick={()=>setWeekOffset(i)} style={{padding:"0.3rem 0.625rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",fontWeight:weekOffset===i?700:400,background:weekOffset===i?"var(--gold-muted)":"var(--surface)",border:`1px solid ${weekOffset===i?"rgba(201,168,76,0.4)":"var(--border)"}`,color:weekOffset===i?"var(--gold)":"var(--text-muted)"}}>{i===0?"Cette sem.":`-${i}sem`}</button>)}
        </div>
      </div>
      {tab==="apercu"&&<>
        <div className="stat-grid" style={{marginBottom:"1.5rem"}}>
          {[{l:"Recettes",v:fmt(recettes),c:"var(--success)",i:"↑"},{l:"Dépenses",v:fmt(depenses),c:"var(--danger)",i:"↓"},{l:"Solde",v:fmt(solde),c:solde>=0?"var(--success)":"var(--danger)",i:"⚖️"},{l:"Opérations",v:String(weekEntries.length),c:"var(--text-muted)",i:"#"}].map(s=><div key={s.l} className="stat-card"><div className="stat-icon">{s.i}</div><div className="stat-value" style={{color:s.c,fontSize:"1.1rem"}}>{s.v}</div><div className="stat-label">{s.l}</div></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
          <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>Par catégorie</div>
            {byCat.length===0?<div style={{color:"var(--text-dim)",textAlign:"center",padding:"1rem",fontSize:"0.82rem"}}>Aucune donnée</div>:
            <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>{byCat.slice(0,8).map(([cat,v])=><div key={cat} style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><div style={{width:100,fontSize:"0.65rem",color:"var(--text-dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{cat}</div><div style={{flex:1}}>{v.r>0&&<div style={{height:5,width:(v.r/maxBar*100)+"%",background:"var(--success)",borderRadius:3,marginBottom:2,minWidth:4}}/>}{v.d>0&&<div style={{height:5,width:(v.d/maxBar*100)+"%",background:"var(--danger)",borderRadius:3,minWidth:4}}/>}</div><div style={{fontSize:"0.62rem",textAlign:"right",flexShrink:0,minWidth:70}}>{v.r>0&&<div style={{color:"var(--success)"}}>{fmt(v.r)}</div>}{v.d>0&&<div style={{color:"var(--danger)"}}>-{fmt(v.d)}</div>}</div></div>)}</div>}
          </div>
          <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>Dernières opérations</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{weekEntries.slice(0,8).map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.35rem 0.625rem",background:"var(--surface)",borderRadius:"var(--radius)",borderLeft:`3px solid ${e.type==="recette"?"var(--success)":"var(--danger)"}`}}><div style={{minWidth:0}}><div style={{fontSize:"0.78rem",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.motif||e.categorie}</div><div style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>{e.categorie} · {e.type_argent}</div></div><span style={{fontWeight:700,color:e.type==="recette"?"var(--success)":"var(--danger)",flexShrink:0,marginLeft:"0.5rem"}}>{e.type==="recette"?"+":"-"}{fmt(e.montant)}</span></div>)}</div>
          </div>
        </div>
      </>}
      {tab==="historique"&&<div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{entries.length===0?<div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucune entrée</div></div>:entries.map(e=><div key={e.id} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",borderLeft:`3px solid ${e.type==="recette"?"var(--success)":"var(--danger)"}`}}><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"0.82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.motif||e.categorie}</div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{e.categorie} · {e.type_argent} · {e.created_by} · {new Date(e.created_at).toLocaleDateString("fr-FR")}</div></div><div style={{fontWeight:700,color:e.type==="recette"?"var(--success)":"var(--danger)",flexShrink:0}}>{e.type==="recette"?"+":"-"}{fmt(e.montant)}</div><button className="btn btn-ghost btn-sm" onClick={()=>del(e.id)} style={{color:"var(--danger)",flexShrink:0}}>🗑️</button></div>)}</div>}
      {tab==="saisie"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
        <div className="card"><div className="section-title" style={{marginBottom:"1rem"}}>Nouvelle opération</div>
          <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>{["recette","dépense"].map(t=><button key={t} onClick={()=>setForm(f=>({...f,type:t,categorie:t==="recette"?"Vente drogue":"Achat matériel"}))} style={{flex:1,padding:"0.625rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:form.type===t?700:400,background:form.type===t?(t==="recette"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)"):"var(--surface)",border:`1px solid ${form.type===t?(t==="recette"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"):"var(--border)"}`,color:form.type===t?(t==="recette"?"var(--success)":"var(--danger)"):"var(--text-muted)"}}>{t==="recette"?"↑ Recette":"↓ Dépense"}</button>)}</div>
          <div className="form-group"><label>Montant ($) *</label><input type="number" min={0} value={form.montant||""} onChange={e=>setForm(f=>({...f,montant:+e.target.value}))} style={{fontWeight:700,fontSize:"1.1rem"}}/></div>
          <div className="form-group"><label>Catégorie</label><select value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>{(form.type==="recette"?CATS_R:CATS_D).map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label>Type d'argent</label><div style={{display:"flex",gap:"0.35rem"}}>{["sale","propre","mixte"].map(t=><button key={t} onClick={()=>setForm(f=>({...f,type_argent:t}))} style={{padding:"0.3rem 0.625rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:form.type_argent===t?700:400,background:form.type_argent===t?"var(--gold-muted)":"var(--surface)",border:`1px solid ${form.type_argent===t?"rgba(201,168,76,0.4)":"var(--border)"}`,color:form.type_argent===t?"var(--gold)":"var(--text-muted)"}}>{t}</button>)}</div></div>
          <div className="form-group"><label>Motif *</label><textarea rows={2} value={form.motif} onChange={e=>setForm(f=>({...f,motif:e.target.value}))} placeholder="Ex: Vente 50u cocaïne à Vlad..."/></div>
          <div className="form-group" style={{marginBottom:"1.25rem"}}><label>Membre</label><input value={form.membre} onChange={e=>setForm(f=>({...f,membre:e.target.value}))}/></div>
          <button className="btn btn-gold" onClick={save} disabled={saving||!form.motif||form.montant<=0} style={{width:"100%",justifyContent:"center"}}>{saving?"Enregistrement…":"✓ Enregistrer"}</button>
        </div>
        <div className="card" style={{alignSelf:"start"}}><div className="section-title" style={{marginBottom:"0.875rem"}}>Aperçu</div>{form.montant>0&&<div style={{textAlign:"center",padding:"1rem 0"}}><div style={{fontSize:"0.65rem",color:"var(--text-dim)",textTransform:"uppercase",marginBottom:"0.4rem"}}>{form.type==="recette"?"Recette":"Dépense"}</div><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"2rem",color:form.type==="recette"?"var(--success)":"var(--danger)"}}>{form.type==="recette"?"+":"-"}{fmt(form.montant)}</div><div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.4rem"}}>{form.categorie} · {form.type_argent}</div></div>}</div>
      </div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}