"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
export default function ObsidianDashboard() {
  const [stats, setStats] = useState({recettes:0,depenses:0,argSale:0,nbArmes:0,nbDrogues:0});
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{load();},[]);
  async function load() {
    if(!supabase){setLoading(false);return;}
    const [{data:compta},{data:stocks},{data:rdv},{data:contrats}] = await Promise.all([
      supabase.from("obsidian_comptabilite").select("type,montant,type_argent"),
      supabase.from("obsidian_stocks").select("*"),
      supabase.from("obsidian_rdv").select("id,titre,type,date,statut").order("date").limit(5),
      supabase.from("obsidian_contrats").select("id,titre,statut,date_cible").eq("statut","En cours").limit(5),
    ]);
    const r=(compta||[]).filter((c:any)=>c.type==="recette").reduce((s:number,c:any)=>s+c.montant,0);
    const d=(compta||[]).filter((c:any)=>c.type==="dépense").reduce((s:number,c:any)=>s+c.montant,0);
    const sal=(compta||[]).filter((c:any)=>c.type_argent==="sale").reduce((s:number,c:any)=>s+c.montant,0);
    setStats({recettes:r,depenses:d,argSale:sal,
      nbArmes:(stocks||[]).filter((s:any)=>s.categorie==="arme").reduce((a:number,x:any)=>a+x.quantite,0),
      nbDrogues:(stocks||[]).filter((s:any)=>s.categorie==="drogue").reduce((a:number,x:any)=>a+x.quantite,0)});
    setAlerts((stocks||[]).filter((s:any)=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte));
    setEvents([...(rdv||[]).map((r:any)=>({...r,_type:"RDV"})),...(contrats||[]).map((c:any)=>({...c,_type:"Contrat"}))].sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
    setLoading(false);
  }
  const s=stats; const solde=s.recettes-s.depenses;
  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard BullHead</a>
      <div className="page-header"><div><h1 className="page-title">🖤 Obsidian Logistics</h1><p className="page-subtitle">Dashboard — Vue d'ensemble des opérations</p><div className="gold-line"/></div><button className="btn btn-outline" onClick={load}>↻</button></div>
      {alerts.length>0&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",marginBottom:"1.25rem"}}><div style={{fontSize:"0.72rem",fontWeight:700,color:"var(--danger)",marginBottom:"0.4rem"}}>⚠️ Stock bas</div><div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>{alerts.map((a:any)=><span key={a.id} style={{fontSize:"0.75rem",padding:"0.2rem 0.65rem",borderRadius:999,background:"rgba(239,68,68,0.12)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.25)",fontWeight:600}}>{a.emoji} {a.nom} : {a.quantite}/{a.seuil_alerte}</span>)}</div></div>}
      <div className="stat-grid" style={{marginBottom:"1.5rem"}}>
        {[
          {l:"Solde",v:fmt(solde),i:"⚖️",c:solde>=0?"var(--success)":"var(--danger)"},
          {l:"Argent sale",v:fmt(s.argSale),i:"💰",c:"var(--warning)"},
          {l:"Stock armes",v:s.nbArmes+"u.",i:"🔫",c:"var(--danger)"},
          {l:"Stock drogues",v:s.nbDrogues+"u.",i:"💊",c:"#7c3aed"},
          {l:"Recettes",v:fmt(s.recettes),i:"↑",c:"var(--success)"},
          {l:"Dépenses",v:fmt(s.depenses),i:"↓",c:"var(--danger)"},
        ].map(x=><div key={x.l} className="stat-card"><div className="stat-icon">{x.i}</div><div className="stat-value" style={{color:x.c,fontSize:"1.1rem"}}>{x.v}</div><div className="stat-label">{x.l}</div></div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
        <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>📅 Prochains événements</div>
          {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:events.length===0?<div style={{color:"var(--text-dim)",textAlign:"center",padding:"1rem",fontSize:"0.82rem"}}>Aucun événement</div>:
          <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{events.slice(0,6).map((e:any)=><div key={e.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0.75rem",background:"var(--surface)",borderRadius:"var(--radius)",borderLeft:"3px solid "+(e._type==="RDV"?"var(--info)":"var(--warning)")}}>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"0.82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.titre}</div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{e._type}{e.date?" · "+new Date(e.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}):""}</div></div>
            <span style={{fontSize:"0.6rem",padding:"0.08rem 0.4rem",borderRadius:999,background:"var(--surface)",color:"var(--text-dim)",border:"1px solid var(--border)",flexShrink:0}}>{e.statut}</span>
          </div>)}</div>}
        </div>
        <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>🚀 Accès rapide</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            {[["/obsidian/prix","💲 Prix","var(--gold)"],["/obsidian/stocks","📦 Stocks","var(--info)"],["/obsidian/armurerie","🔫 Armurerie","var(--danger)"],["/obsidian/comptabilite","💳 Compta","var(--success)"],["/obsidian/rdv","📅 RDV","var(--warning)"],["/obsidian/contrats","📋 Contrats","#7c3aed"],["/obsidian/garage","🚗 Garage","var(--text-muted)"],["/obsidian/fiches","👤 Fiches","#f97316"]].map(([h,l,c])=>(
              <a key={h as string} href={h as string} style={{textDecoration:"none",padding:"0.625rem 0.875rem",background:"var(--surface)",borderRadius:"var(--radius)",border:"1px solid var(--border)",fontSize:"0.82rem",fontWeight:500,color:c as string,display:"block"}}>{l as string}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
