"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { money } from "@/lib/money";
const fmt = (n:number) => money(n);
export default function ObsidianDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_dashboard"))) { window.location.href = "/"; } }, [user, userLoading]);
  const [stats, setStats] = useState({recettes:0,depenses:0,argSale:0,nbArmes:0,nbDrogues:0});
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [todo, setTodo] = useState({ propre: 0, sale: 0, seuil: 0, capital: 0, dons: 0, aVenir: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(()=>{load();},[]);
  async function load() {
    if(!supabase){setLoading(false);return;}
    const [{data:bud},{data:stocks},{data:rdv},{data:contrats}] = await Promise.all([
      supabase.rpc("obsidian_budget"),
      supabase.from("obsidian_stocks").select("*"),
      supabase.from("obsidian_rdv").select("id,titre,type,date,statut").order("date").limit(5),
      supabase.from("obsidian_contrats").select("id,titre,statut,date_cible").eq("statut","En cours").limit(5),
    ]);
    const r=Number(bud?.recettes)||0, d=Number(bud?.depenses)||0, sal=Number(bud?.sale)||0;
    setStats({recettes:r,depenses:d,argSale:sal,
      nbArmes:(stocks||[]).filter((s:any)=>s.categorie==="arme").reduce((a:number,x:any)=>a+x.quantite,0),
      nbDrogues:(stocks||[]).filter((s:any)=>s.categorie==="drogue").reduce((a:number,x:any)=>a+x.quantite,0)});
    const [{count:dons},{count:aVenir}] = await Promise.all([
      supabase.from("obsidian_dons").select("id",{count:"exact",head:true}).eq("statut","en_attente"),
      supabase.from("obsidian_contrats").select("id",{count:"exact",head:true}).eq("statut","En attente"),
    ]);
    setTodo({ propre:(Number(bud?.capital)||0)+(Number(bud?.propre)||0), sale:Number(bud?.sale)||0, seuil:Number(bud?.seuil)||0, capital:Number(bud?.capital)||0, dons:dons||0, aVenir:aVenir||0 });
    setAlerts((stocks||[]).filter((s:any)=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte));
    setEvents([...(rdv||[]).map((r:any)=>({...r,_type:"RDV"})),...(contrats||[]).map((c:any)=>({...c,_type:"Contrat"}))].sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
    setLoading(false);
  }
  const s=stats; const solde=s.recettes-s.depenses;
  return (
    <div className="page-container">
      <Link className="back-link" href="/">Dashboard BullHead</Link>
      <div className="page-header"><div><h1 className="page-title">🖤 Obsidian Logistics</h1><p className="page-subtitle">Dashboard - Vue d'ensemble des opérations</p><div className="gold-line"/></div><button className="btn btn-outline" onClick={load}>↻</button></div>
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
      <div className="card" style={{marginBottom:"1.25rem"}}>
        <div className="section-title" style={{marginBottom:"0.75rem"}}>🧭 À traiter aujourd'hui</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",fontSize:"0.8rem"}}>
          {[
            {t:`💵 Caisse propre : ${fmt(todo.propre)}`,bad:todo.seuil>0&&todo.propre<todo.seuil,href:"/obsidian/comptabilite",extra:todo.seuil>0&&todo.propre<todo.seuil?` · sous le seuil (${fmt(todo.seuil)})`:""},
            {t:`🕶️ Caisse sale : ${fmt(todo.sale)}`,bad:todo.sale<0,href:"/obsidian/comptabilite",extra:todo.sale>0?" · à blanchir ?":""},
            {t:`📦 ${alerts.length} stock(s) sous le seuil`,bad:alerts.length>0,href:"/obsidian/stocks",extra:""},
            ...(user&&hasPermission(user,"obsidian_paie")?[{t:`🎁 ${todo.dons} don(s) à valider`,bad:todo.dons>0,href:"/obsidian/dons",extra:""}]:[]),
            {t:`📄 ${todo.aVenir} contrat(s) en attente`,bad:false,href:"/obsidian/contrats",extra:""},
          ].map(x=><a key={x.t} href={x.href} style={{textDecoration:"none",padding:"0.4rem 0.75rem",borderRadius:999,border:`1px solid ${x.bad?"rgba(239,68,68,0.4)":"var(--border)"}`,background:x.bad?"rgba(239,68,68,0.08)":"var(--surface)",color:x.bad?"var(--danger)":"var(--text)"}}>{x.t}{x.extra}</a>)}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
        <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>📅 Prochains événements</div>
          {loading?<LoadingBlock />:events.length===0?<div style={{color:"var(--text-dim)",textAlign:"center",padding:"1rem",fontSize:"0.82rem"}}>Aucun événement</div>:
          <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{events.slice(0,6).map((e:any)=><div key={e.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0.75rem",background:"var(--surface)",borderRadius:"var(--radius)",borderLeft:"3px solid "+(e._type==="RDV"?"var(--info)":"var(--warning)")}}>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"0.82rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.titre}</div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{e._type}{e.date?" · "+new Date(e.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}):""}</div></div>
            <span style={{fontSize:"0.6rem",padding:"0.08rem 0.4rem",borderRadius:999,background:"var(--surface)",color:"var(--text-dim)",border:"1px solid var(--border)",flexShrink:0}}>{e.statut}</span>
          </div>)}</div>}
        </div>
        <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>🚀 Accès rapide</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            {[["/obsidian/prix","💲 Prix","var(--gold)"],["/obsidian/stocks","📦 Stocks","var(--info)"],["/obsidian/stocks?cat=armurerie","🔫 Armurerie","var(--danger)"],["/obsidian/comptabilite","💳 Compta","var(--success)"],["/obsidian/rdv","📅 RDV","var(--warning)"],["/obsidian/contrats","📋 Contrats","#7c3aed"],["/obsidian/garage","🚗 Garage","var(--text-muted)"],["/obsidian/fiches","👤 Fiches","#f97316"]].map(([h,l,c])=>(
              <a key={h as string} href={h as string} style={{textDecoration:"none",padding:"0.625rem 0.875rem",background:"var(--surface)",borderRadius:"var(--radius)",border:"1px solid var(--border)",fontSize:"0.82rem",fontWeight:500,color:c as string,display:"block"}}>{l as string}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
