"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
const SETTINGS_KEYS=[{key:"app_nom",label:"Nom du cabinet",placeholder:"Cabinet BullHead"},{key:"app_sous_nom",label:"Sous-titre",placeholder:"Law · Finance · Property"},{key:"couleur_gold",label:"Couleur principale (hex)",placeholder:"#c9a84c"},{key:"obsidian_nom",label:"Nom partie illégale",placeholder:"Obsidian Logistics"},{key:"logo_url",label:"URL du logo",placeholder:"https://..."},{key:"police",label:"Police principale",placeholder:"Inter"}];
export default function SettingsPage(){
  const [settings,setSettings]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}const{data}=await supabase.from("app_settings").select("cle,valeur");const m:Record<string,string>={};(data||[]).forEach((r:any)=>{m[r.cle]=r.valeur;});setSettings(m);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function save(key:string,val:string){if(!supabase)return;setSaving(true);await supabase.from("app_settings").upsert({cle:key,valeur:val},{onConflict:"cle"});setSettings(s=>({...s,[key]:val}));showT("Sauvegardé");setSaving(false);}
  const preview={nom:settings["app_nom"]||"Cabinet BullHead",sous:settings["app_sous_nom"]||"Law · Finance · Property",col:settings["couleur_gold"]||"#c9a84c",obs:settings["obsidian_nom"]||"Obsidian Logistics",logo:settings["logo_url"]||""};
  return(
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header"><div><h1 className="page-title">⚙️ Personnalisation</h1><p className="page-subtitle">Logo · Couleurs · Noms · Police — sans modifier le code</p><div className="gold-line"/></div></div>
      {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:"1.5rem",alignItems:"start"}}>
        <div className="card"><div className="section-title" style={{marginBottom:"1.25rem"}}>Configuration</div>
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            {SETTINGS_KEYS.map(({key,label,placeholder})=>(
              <div key={key} style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                <label style={{fontSize:"0.72rem",fontWeight:600,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</label>
                <div style={{display:"flex",gap:"0.5rem"}}>
                  <input value={settings[key]||""} onChange={e=>setSettings(s=>({...s,[key]:e.target.value}))} placeholder={placeholder} style={{flex:1}}/>
                  <button className="btn btn-gold btn-sm" onClick={()=>save(key,settings[key]||"")} disabled={saving}>{saving?"…":"✓"}</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:"1.5rem",paddingTop:"1.25rem",borderTop:"1px solid var(--border)"}}>
            <div style={{fontSize:"0.72rem",fontWeight:600,color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.875rem"}}>Couleur d'accentuation</div>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>{["#c9a84c","#ef4444","#7c3aed","#3b82f6","#22c55e","#f97316","#e11d48","#06b6d4"].map(col=><button key={col} onClick={()=>{setSettings(s=>({...s,couleur_gold:col}));save("couleur_gold",col);}} style={{width:36,height:36,borderRadius:"50%",background:col,border:`3px solid ${settings["couleur_gold"]===col?"#fff":"transparent"}`,cursor:"pointer",transition:"all 0.15s"}}/>)}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div className="card" style={{border:`2px solid ${preview.col}30`}}>
            <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.875rem"}}>Aperçu</div>
            {preview.logo&&<div style={{marginBottom:"0.875rem",display:"flex",justifyContent:"center"}}><img src={preview.logo} alt="Logo" style={{maxHeight:64,maxWidth:200,objectFit:"contain",borderRadius:"var(--radius)"}}/></div>}
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"1.1rem",fontWeight:900,color:preview.col,letterSpacing:"0.08em",marginBottom:"0.2rem"}}>{preview.nom}</div>
            <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.875rem"}}>{preview.sous}</div>
            <div style={{borderTop:"1px solid var(--border)",paddingTop:"0.625rem",marginTop:"0.625rem"}}><div style={{fontSize:"0.75rem",fontWeight:700,color:"#1a1a2e",background:preview.col,padding:"0.3rem 0.75rem",borderRadius:"var(--radius)",display:"inline-block"}}>🖤 {preview.obs}</div></div>
          </div>
          <div className="card" style={{background:"var(--surface)"}}>
            <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.625rem",fontWeight:600}}>ℹ️ Note</div>
            <div style={{fontSize:"0.78rem",color:"var(--text-muted)",lineHeight:1.6}}>Les changements prennent effet au prochain rechargement de page. La couleur principale modifie les accents visuels partout sur le site.</div>
          </div>
        </div>
      </div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}