"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
const CATS=["arme","munition","accessoire","explosif","gilet","radio","autre"];
const CAT_ICONS:Record<string,string>={arme:"🔫",munition:"🔴",accessoire:"🔧",explosif:"💣",gilet:"🦺",radio:"📻",autre:"📦"};
export default function ArmureriePage(){
  const user=getUser();
  const [stocks,setStocks]=useState<any[]>([]);
  const [logs,setLogs]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"inventaire"|"historique"|"ajouter">("inventaire");
  const [filterCat,setFilterCat]=useState("");
  const [form,setForm]=useState({nom:"",categorie:"arme",emoji:"🔫",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});
  const [showPrise,setShowPrise]=useState<any>(null);
  const [priseForm,setPriseForm]=useState({quantite:1,motif:"",retour:false});
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){
    if(!supabase){setLoading(false);return;}
    const[{data:s},{data:l}]=await Promise.all([
      supabase.from("obsidian_stocks").select("*").in("categorie",["arme","munition","accessoire","explosif","gilet","radio"]).order("categorie").order("nom"),
      supabase.from("obsidian_mouvements").select("*").order("created_at",{ascending:false}).limit(100)
    ]);
    setStocks(s||[]);setLogs(l||[]);setLoading(false);
  }
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function addStock(){
    if(!supabase||!form.nom)return;setSaving(true);
    const{data}=await supabase.from("obsidian_stocks").insert([{...form}]).select().single();
    if(data)setStocks(s=>[...s,data]);
    setForm({nom:"",categorie:"arme",emoji:"🔫",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});
    showT("Ajouté");setSaving(false);setTab("inventaire");
  }
  async function enregistrerPrise(stock:any){
    if(!supabase||priseForm.quantite<=0)return;setSaving(true);
    const newQty=Math.max(0,stock.quantite-priseForm.quantite);
    const retourTxt=priseForm.retour?"Retour prévu":"Retour: NON";
    await supabase.from("obsidian_mouvements").insert([{stock_id:stock.id,stock_nom:stock.nom,type:"sortie",quantite:priseForm.quantite,motif:priseForm.motif+" | "+retourTxt,membre:user?.nom||"",created_by:user?.nom||""}]);
    await supabase.from("obsidian_stocks").update({quantite:newQty}).eq("id",stock.id);
    setStocks(s=>s.map(x=>x.id===stock.id?{...x,quantite:newQty}:x));
    setLogs(l=>[{id:Date.now().toString(),stock_nom:stock.nom,type:"sortie",quantite:priseForm.quantite,motif:priseForm.motif+" | "+retourTxt,membre:user?.nom||"",created_at:new Date().toISOString()},...l]);
    setShowPrise(null);setPriseForm({quantite:1,motif:"",retour:false});showT("Prise enregistrée");setSaving(false);
  }
  const filtered=stocks.filter(s=>!filterCat||s.categorie===filterCat);
  const alerts=stocks.filter(s=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte);
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">🔫 Armurerie</h1><p className="page-subtitle">Armes · Munitions · Accessoires · Explosifs · Gilets · Radios</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>setTab("ajouter")}>+ Ajouter</button></div>
      {alerts.length>0&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",marginBottom:"1rem",display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"0.72rem",fontWeight:700,color:"var(--danger)"}}>⚠️ Stock bas :</span>{alerts.map((a:any)=><span key={a.id} style={{fontSize:"0.72rem",padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(239,68,68,0.1)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.2)",fontWeight:600}}>{a.emoji} {a.nom} : {a.quantite}</span>)}</div>}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[["inventaire","🔫 Inventaire"],["historique","📋 Historique"],["ajouter","➕ Ajouter"]].map(([k,l])=><button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>)}
      </div>
      {tab==="inventaire"&&<>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          {["","arme","munition","accessoire","explosif","gilet","radio"].map(c=><button key={c||"all"} onClick={()=>setFilterCat(c)} style={{padding:"0.25rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterCat===c?700:400,background:filterCat===c?"var(--gold-muted)":"var(--surface)",border:`1px solid ${filterCat===c?"rgba(201,168,76,0.4)":"var(--border)"}`,color:filterCat===c?"var(--gold)":"var(--text-muted)"}}>{c?(CAT_ICONS[c]+" "+c):"Tout"}</button>)}
        </div>
        {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
          {filtered.map((s:any)=><div key={s.id} style={{background:"var(--card)",border:`1px solid ${s.seuil_alerte>0&&s.quantite<=s.seuil_alerte?"rgba(239,68,68,0.3)":"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",display:"flex",alignItems:"center",gap:"1rem"}}>
            <span style={{fontSize:"1.4rem",flexShrink:0}}>{s.emoji||CAT_ICONS[s.categorie]||"📦"}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:"0.9rem",marginBottom:"0.15rem"}}>{s.nom}</div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{s.categorie}{s.notes?" · "+s.notes:""}</div></div>
            <div style={{textAlign:"center",minWidth:70}}><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.5rem",color:s.seuil_alerte>0&&s.quantite<=s.seuil_alerte?"var(--danger)":"var(--text)"}}>{s.quantite}</div><div style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>{s.unite}</div></div>
            <div style={{display:"flex",gap:"0.35rem",flexShrink:0}}>
              <button className="btn btn-sm" onClick={()=>{setShowPrise(s);setPriseForm({quantite:1,motif:"",retour:false});}} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"var(--danger)",fontSize:"0.72rem"}}>↓ Prise</button>
              <button className="btn btn-ghost btn-sm" onClick={async()=>{if(!supabase)return;const newQ=s.quantite+1;await supabase.from("obsidian_stocks").update({quantite:newQ}).eq("id",s.id);setStocks(st=>st.map(x=>x.id===s.id?{...x,quantite:newQ}:x));}} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",color:"var(--success)",fontSize:"0.72rem"}}>+1</button>
            </div>
          </div>)}
          {filtered.length===0&&<div className="empty-state"><div className="empty-icon">🔫</div><div className="empty-title">Aucun article</div></div>}
        </div>}
      </>}
      {tab==="historique"&&<div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{logs.length===0?<div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucun historique</div></div>:logs.map((l:any)=><div key={l.id} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",borderLeft:`3px solid ${l.type==="entrée"?"var(--success)":"var(--danger)"}`}}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:"0.82rem"}}>{l.stock_nom} <span style={{color:l.type==="entrée"?"var(--success)":"var(--danger)",fontWeight:700}}>×{l.quantite}</span></div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{l.motif||"—"} · {l.membre} · {new Date(l.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div></div><span style={{fontSize:"0.68rem",padding:"0.08rem 0.4rem",borderRadius:999,background:l.motif?.includes("Retour: NON")?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)",color:l.motif?.includes("Retour: NON")?"var(--danger)":"var(--success)",border:"1px solid currentColor",flexShrink:0}}>{l.motif?.includes("Retour: NON")?"Sans retour":"Retour prévu"}</span></div>)}</div>}
      {tab==="ajouter"&&<div className="card" style={{maxWidth:540}}><div className="section-title" style={{marginBottom:"1rem"}}>Ajouter à l'armurerie</div><div className="form-grid"><div className="form-group"><label>Emoji</label><input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={{width:70}}/></div><div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/></div><div className="form-group"><label>Catégorie</label><select value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div><div className="form-group"><label>Quantité</label><input type="number" value={form.quantite||""} onChange={e=>setForm(f=>({...f,quantite:+e.target.value}))}/></div><div className="form-group"><label>Seuil alerte</label><input type="number" value={form.seuil_alerte||""} onChange={e=>setForm(f=>({...f,seuil_alerte:+e.target.value}))}/></div><div className="form-group"><label>Unité</label><input value={form.unite} onChange={e=>setForm(f=>({...f,unite:e.target.value}))}/></div></div><div className="form-group" style={{marginBottom:"1.25rem"}}><label>Notes</label><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:"0.5rem"}}><button className="btn btn-outline" onClick={()=>setTab("inventaire")}>Annuler</button><button className="btn btn-gold" onClick={addStock} disabled={saving||!form.nom}>{saving?"…":"Ajouter"}</button></div></div>}
      {showPrise&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowPrise(null)}><div className="modal"><div className="modal-header"><h2 className="modal-title">↓ Prise — {showPrise.nom}</h2><button className="modal-close" onClick={()=>setShowPrise(null)}>×</button></div><div className="modal-body"><div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.75rem",marginBottom:"1rem",textAlign:"center"}}><div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.2rem"}}>Stock actuel</div><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.75rem"}}>{showPrise.quantite} {showPrise.unite}</div></div><div className="form-group"><label>Quantité prise *</label><input type="number" min={1} max={showPrise.quantite} autoFocus value={priseForm.quantite} onChange={e=>setPriseForm(f=>({...f,quantite:+e.target.value}))}/></div><div className="form-group"><label>Motif / Mission</label><input value={priseForm.motif} onChange={e=>setPriseForm(f=>({...f,motif:e.target.value}))} placeholder={`Ex: Mission "Port"`}/></div><label style={{display:"flex",alignItems:"center",gap:"0.625rem",cursor:"pointer",padding:"0.5rem 0.75rem",borderRadius:"var(--radius)",background:priseForm.retour?"rgba(34,197,94,0.08)":"var(--surface)",border:`1px solid ${priseForm.retour?"rgba(34,197,94,0.25)":"var(--border)"}`}}><input type="checkbox" checked={priseForm.retour} onChange={e=>setPriseForm(f=>({...f,retour:e.target.checked}))}/><span style={{fontSize:"0.82rem",color:priseForm.retour?"var(--success)":"var(--text-muted)"}}>Retour prévu</span></label></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowPrise(null)}>Annuler</button><button className="btn btn-gold" onClick={()=>enregistrerPrise(showPrise)} disabled={saving||priseForm.quantite<=0}>{saving?"…":"Enregistrer la prise"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}