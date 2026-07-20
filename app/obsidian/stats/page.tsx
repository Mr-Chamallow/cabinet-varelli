"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
export default function StatsPage(){
  const [data,setData]=useState<any>({compta:[],contrats:[],stocks:[],mouvements:[]});
  const [loading,setLoading]=useState(true);
  const [period,setPeriod]=useState(4);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}
    const[{data:c},{data:co},{data:s},{data:m}]=await Promise.all([
      supabase.from("obsidian_comptabilite").select("*").order("created_at",{ascending:false}),
      supabase.from("obsidian_contrats").select("*").order("created_at",{ascending:false}),
      supabase.from("obsidian_stocks").select("*"),
      supabase.from("obsidian_mouvements").select("*").order("created_at",{ascending:false}).limit(200),
    ]);
    setData({compta:c||[],contrats:co||[],stocks:s||[],mouvements:m||[]});setLoading(false);}
  const stats=useMemo(()=>{
    const{compta,contrats,stocks,mouvements}=data;
    const totalR=compta.filter((e:any)=>e.type==="recette").reduce((s:number,e:any)=>s+e.montant,0);
    const totalD=compta.filter((e:any)=>e.type==="dépense").reduce((s:number,e:any)=>s+e.montant,0);
    const topCats:Record<string,number>={};compta.filter((e:any)=>e.type==="recette").forEach((e:any)=>{topCats[e.categorie]=(topCats[e.categorie]||0)+e.montant;});
    const topR=Object.entries(topCats).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const contratStats={total:contrats.length,termines:contrats.filter((c:any)=>c.statut==="Terminé").length,echoues:contrats.filter((c:any)=>c.statut==="Échoué").length,revenus:contrats.filter((c:any)=>c.statut==="Terminé").reduce((s:number,c:any)=>s+c.recompense,0)};
    const topMembres:Record<string,number>={};compta.forEach((e:any)=>{if(e.membre&&e.type==="recette")topMembres[e.membre]=(topMembres[e.membre]||0)+e.montant;});
    const membresRanking=Object.entries(topMembres).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const MOIS=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const now=new Date();
    const semaines=Array.from({length:period},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-i*7);return d.toISOString().split("T")[0];}).reverse();
    const semainesData=semaines.map(s=>{const r=compta.filter((e:any)=>e.semaine&&e.semaine>=s&&e.semaine<semaines[semaines.indexOf(s)+1]||(!semaines[semaines.indexOf(s)+1]&&e.semaine>=s));const rec=r.filter((e:any)=>e.type==="recette").reduce((a:number,e:any)=>a+e.montant,0);const dep=r.filter((e:any)=>e.type==="dépense").reduce((a:number,e:any)=>a+e.montant,0);return{date:s,rec,dep};});
    return{totalR,totalD,solde:totalR-totalD,topR,contratStats,membresRanking,semainesData};
  },[data,period]);
  const maxBar=Math.max(...stats.semainesData.map((s:any)=>Math.max(s.rec,s.dep)),1);
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">📊 Statistiques</h1><p className="page-subtitle">Classements · Graphiques · Performance</p><div className="gold-line"/></div><button className="btn btn-outline" onClick={load}>↻ Actualiser</button></div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:<>
        <div className="stat-grid" style={{marginBottom:"1.5rem"}}>
          {[{l:"Recettes totales",v:fmt(stats.totalR),c:"var(--success)",i:"↑"},{l:"Dépenses totales",v:fmt(stats.totalD),c:"var(--danger)",i:"↓"},{l:"Solde net",v:fmt(stats.solde),c:stats.solde>=0?"var(--success)":"var(--danger)",i:"⚖️"},{l:"Missions terminées",v:stats.contratStats.termines+"/"+stats.contratStats.total,c:"var(--gold)",i:"📋"},{l:"Revenus missions",v:fmt(stats.contratStats.revenus),c:"var(--warning)",i:"💎"},{l:"Taux succès",v:stats.contratStats.total>0?Math.round(stats.contratStats.termines/stats.contratStats.total*100)+"%":"—",c:"var(--info)",i:"🎯"}].map(s=><div key={s.l} className="stat-card"><div className="stat-icon">{s.i}</div><div className="stat-value" style={{color:s.c,fontSize:"1.1rem"}}>{s.v}</div><div className="stat-label">{s.l}</div></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1.25rem",marginBottom:"1.25rem"}}>
          <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>🏆 Top recettes par source</div><div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>{stats.topR.map(([cat,v]:any,i:number)=>{const max=stats.topR[0]?.[1]||1;return<div key={cat} style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><div style={{width:18,height:18,borderRadius:"50%",background:["var(--gold)","var(--text-dim)","#cd7f32","var(--info)","var(--success)"][i]+"20",border:`2px solid ${["var(--gold)","var(--text-dim)","#cd7f32","var(--info)","var(--success)"][i]}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",fontWeight:900,color:["var(--gold)","var(--text-dim)","#cd7f32","var(--info)","var(--success)"][i],flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.72rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat}</div><div style={{height:4,background:"var(--surface)",borderRadius:2,overflow:"hidden",marginTop:2}}><div style={{height:"100%",width:(v/max*100)+"%",background:["var(--gold)","var(--text-dim)","#cd7f32","var(--info)","var(--success)"][i],borderRadius:2}}/></div></div><div style={{fontSize:"0.68rem",fontWeight:700,color:"var(--gold)",flexShrink:0}}>{fmt(v)}</div></div>;})} {stats.topR.length===0&&<div style={{color:"var(--text-dim)",fontSize:"0.8rem",textAlign:"center",padding:"0.5rem"}}>Aucune donnée</div>}</div></div>
          <div className="card"><div className="section-title" style={{marginBottom:"0.875rem"}}>👥 Top membres (recettes)</div><div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>{stats.membresRanking.map(([nom,v]:any,i:number)=>{const max=stats.membresRanking[0]?.[1]||1;const COLS=["var(--gold)","var(--text-dim)","#cd7f32","var(--info)","var(--success)"];return<div key={nom} style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><div style={{width:18,height:18,borderRadius:"50%",background:COLS[i]+"20",border:`2px solid ${COLS[i]}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",fontWeight:900,color:COLS[i],flexShrink:0}}>{i+1}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.72rem",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nom}</div><div style={{height:4,background:"var(--surface)",borderRadius:2,overflow:"hidden",marginTop:2}}><div style={{height:"100%",width:(v/max*100)+"%",background:COLS[i],borderRadius:2}}/></div></div><div style={{fontSize:"0.68rem",fontWeight:700,color:"var(--gold)",flexShrink:0}}>{fmt(v)}</div></div>;}) }{stats.membresRanking.length===0&&<div style={{color:"var(--text-dim)",fontSize:"0.8rem",textAlign:"center",padding:"0.5rem"}}>Aucune donnée</div>}</div></div>
          <div className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}><div className="section-title" style={{marginBottom:0}}>📈 Évolution</div><div style={{display:"flex",gap:"0.3rem"}}>{[2,4,8].map(p=><button key={p} onClick={()=>setPeriod(p)} style={{padding:"0.2rem 0.4rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.65rem",fontWeight:period===p?700:400,background:period===p?"var(--gold-muted)":"var(--surface)",border:`1px solid ${period===p?"rgba(201,168,76,0.4)":"var(--border)"}`,color:period===p?"var(--gold)":"var(--text-dim)"}}>{p}s</button>)}</div></div>
            <div style={{display:"flex",alignItems:"flex-end",gap:"0.375rem",height:100}}>
              {stats.semainesData.map((s:any,i:number)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>
                <div style={{width:"100%",display:"flex",gap:1,alignItems:"flex-end",height:80}}>
                  <div style={{flex:1,background:"rgba(34,197,94,0.6)",borderRadius:"2px 2px 0 0",height:Math.max((s.rec/maxBar)*80,s.rec>0?4:0)}}/>
                  <div style={{flex:1,background:"rgba(239,68,68,0.6)",borderRadius:"2px 2px 0 0",height:Math.max((s.dep/maxBar)*80,s.dep>0?4:0)}}/>
                </div>
                <div style={{fontSize:"0.5rem",color:"var(--text-dim)",whiteSpace:"nowrap"}}>S{i+1}</div>
              </div>)}
            </div>
            <div style={{display:"flex",gap:"0.875rem",marginTop:"0.5rem",justifyContent:"center"}}><div style={{display:"flex",alignItems:"center",gap:"0.25rem"}}><div style={{width:10,height:10,background:"rgba(34,197,94,0.6)",borderRadius:2}}/><span style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>Recettes</span></div><div style={{display:"flex",alignItems:"center",gap:"0.25rem"}}><div style={{width:10,height:10,background:"rgba(239,68,68,0.6)",borderRadius:2}}/><span style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>Dépenses</span></div></div>
          </div>
        </div>
      </>}
    </div>
  );
}