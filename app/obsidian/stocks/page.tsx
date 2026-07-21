"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
const CATS=["drogue","arme","accessoire","composant","objet_rare","autre"];
const fmtN=(n:number)=>n.toLocaleString("fr-FR",{maximumFractionDigits:2});
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
interface Stock{id:string;nom:string;categorie:string;emoji:string;quantite:number;seuil_alerte:number;unite:string;prix_unitaire:number;notes:string;}
interface Mouvement{id:string;stock_nom:string;type:string;quantite:number;motif:string;membre:string;created_at:string;}
export default function StocksPage(){
  const { user, loading: userLoading } = useCurrentUser();
  const [stocks,setStocks]=useState<Stock[]>([]);
  const [mouvements,setMouvements]=useState<Mouvement[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"stocks"|"historique"|"ajouter">("stocks");
  const [filterCat,setFilterCat]=useState("");
  const [form,setForm]=useState({nom:"",categorie:"drogue",emoji:"📦",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});
  const [mvtForm,setMvtForm]=useState({stock_id:"",type:"sortie",quantite:1,motif:"",membre:""});
  const [showMvt,setShowMvt]=useState<Stock|null>(null);
  const [saving,setSaving]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{load();},[]);
  async function load(){if(!supabase){setLoading(false);return;}
    const[{data:s},{data:m}]=await Promise.all([supabase.from("obsidian_stocks").select("*").order("categorie").order("nom"),supabase.from("obsidian_mouvements").select("*").order("created_at",{ascending:false}).limit(100)]);
    setStocks(s||[]);setMouvements(m||[]);setLoading(false);}
  function showT(m:string){setToast(m);setTimeout(()=>setToast(null),3000);}
  async function addStock(){if(!supabase||!form.nom)return;setSaving(true);const{data}=await supabase.from("obsidian_stocks").insert([{...form}]).select().single();if(data)setStocks(s=>[...s,data]);setForm({nom:"",categorie:"drogue",emoji:"📦",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});showT("Stock créé");setSaving(false);setTab("stocks");}
  async function addMouvement(stock:Stock){
    if(!supabase||mvtForm.quantite<=0)return;setSaving(true);
    const newQty=mvtForm.type==="entrée"?stock.quantite+mvtForm.quantite:Math.max(0,stock.quantite-mvtForm.quantite);
    await supabase.from("obsidian_mouvements").insert([{stock_id:stock.id,stock_nom:stock.nom,type:mvtForm.type,quantite:mvtForm.quantite,motif:mvtForm.motif,membre:mvtForm.membre||user?.nom||"",prix_unitaire:stock.prix_unitaire,total:mvtForm.quantite*stock.prix_unitaire,created_by:user?.nom||""}]);
    await supabase.from("obsidian_stocks").update({quantite:newQty,updated_at:new Date().toISOString()}).eq("id",stock.id);
    setStocks(s=>s.map(x=>x.id===stock.id?{...x,quantite:newQty}:x));
    setMouvements(m=>[{id:Date.now().toString(),stock_nom:stock.nom,type:mvtForm.type,quantite:mvtForm.quantite,motif:mvtForm.motif,membre:mvtForm.membre||user?.nom||"",created_at:new Date().toISOString()},...m]);
    setShowMvt(null);setMvtForm({stock_id:"",type:"sortie",quantite:1,motif:"",membre:""});showT(`${mvtForm.type==="entrée"?"Entrée":"Sortie"} enregistrée`);setSaving(false);}
  async function deleteStock(id:string){if(!supabase)return;await supabase.from("obsidian_stocks").delete().eq("id",id);setStocks(s=>s.filter(x=>x.id!==id));}
  const filtered=stocks.filter(s=>!filterCat||s.categorie===filterCat);
  const alerts=stocks.filter(s=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte);
  const CAT_COL:Record<string,string>={drogue:"#7c3aed",arme:"var(--danger)",accessoire:"var(--warning)",composant:"var(--info)",objet_rare:"var(--gold)",autre:"var(--text-muted)"};
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">📦 Stocks</h1><p className="page-subtitle">Inventaire général · Entrées & Sorties · Historique</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>setTab("ajouter")}>+ Nouveau stock</button></div>
      {alerts.length>0&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",marginBottom:"1rem",display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"0.72rem",fontWeight:700,color:"var(--danger)"}}>⚠️ Stocks bas :</span>{alerts.map(a=><span key={a.id} style={{fontSize:"0.72rem",padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(239,68,68,0.1)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.2)",fontWeight:600}}>{a.emoji} {a.nom} : {fmtN(a.quantite)} {a.unite}</span>)}</div>}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[["stocks","📦 Inventaire"],["historique","📋 Historique"],["ajouter","➕ Ajouter"]].map(([k,l])=><button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(201,168,76,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>)}
      </div>
      {tab==="stocks"&&<>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:"auto",minWidth:140}}><option value="">Toutes catégories</option>{CATS.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        {loading?<div style={{color:"var(--text-dim)"}}>Chargement…</div>:
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
          {filtered.map(s=>{const col=CAT_COL[s.categorie]||"var(--text-muted)";const low=s.seuil_alerte>0&&s.quantite<=s.seuil_alerte;return(
            <div key={s.id} style={{background:"var(--card)",border:`1px solid ${low?"rgba(239,68,68,0.3)":"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",display:"flex",alignItems:"center",gap:"1rem"}}>
              <span style={{fontSize:"1.4rem",flexShrink:0}}>{s.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem"}}><span style={{fontWeight:700,fontSize:"0.9rem"}}>{s.nom}</span><span style={{fontSize:"0.6rem",padding:"0.08rem 0.4rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`}}>{s.categorie}</span>{low&&<span style={{fontSize:"0.6rem",color:"var(--danger)",fontWeight:700}}>⚠️ Stock bas</span>}</div>
                {s.notes&&<div style={{fontSize:"0.68rem",color:"var(--text-dim)",fontStyle:"italic"}}>{s.notes}</div>}
              </div>
              <div style={{textAlign:"center",minWidth:80}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.5rem",color:low?"var(--danger)":"var(--text)"}}>{fmtN(s.quantite)}</div>
                <div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{s.unite}{s.seuil_alerte>0&&` (min: ${fmtN(s.seuil_alerte)})`}</div>
              </div>
              {s.prix_unitaire>0&&<div style={{textAlign:"right",minWidth:80}}><div style={{fontWeight:600,color:"var(--gold)",fontSize:"0.875rem"}}>{fmt(s.prix_unitaire*s.quantite)}</div><div style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>valeur stock</div></div>}
              <div style={{display:"flex",gap:"0.35rem",flexShrink:0}}>
                <button className="btn btn-sm" onClick={()=>{setShowMvt(s);setMvtForm(f=>({...f,stock_id:s.id,type:"entrée"}));}} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",color:"var(--success)",fontSize:"0.72rem",padding:"0.25rem 0.5rem"}}>↑ Entrée</button>
                <button className="btn btn-sm" onClick={()=>{setShowMvt(s);setMvtForm(f=>({...f,stock_id:s.id,type:"sortie"}));}} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"var(--danger)",fontSize:"0.72rem",padding:"0.25rem 0.5rem"}}>↓ Sortie</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>deleteStock(s.id)} style={{color:"var(--text-dim)"}}>🗑️</button>
              </div>
            </div>);
          })}
          {filtered.length===0&&<div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">Aucun stock</div></div>}
        </div>}
      </>}
      {tab==="historique"&&<div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>{mouvements.length===0?<div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucun mouvement</div></div>:mouvements.map(m=><div key={m.id} style={{display:"flex",alignItems:"center",gap:"0.875rem",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)",borderLeft:`3px solid ${m.type==="entrée"?"var(--success)":"var(--danger)"}`}}><div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:m.type==="entrée"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",fontSize:"1rem"}}>{m.type==="entrée"?"↑":"↓"}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:"0.82rem"}}>{m.stock_nom} <span style={{fontWeight:700,color:m.type==="entrée"?"var(--success)":"var(--danger)"}}>×{fmtN(m.quantite)}</span></div><div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{m.motif||"—"} · {m.membre} · {new Date(m.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div></div></div>)}</div>}
      {tab==="ajouter"&&<div className="card" style={{maxWidth:560}}><div className="section-title" style={{marginBottom:"1rem"}}>Nouveau stock</div><div className="form-grid"><div className="form-group"><label>Emoji</label><input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={{width:70}}/></div><div className="form-group"><label>Nom *</label><input autoFocus value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))}/></div><div className="form-group"><label>Catégorie</label><select value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div><div className="form-group"><label>Quantité initiale</label><input type="number" value={form.quantite||""} onChange={e=>setForm(f=>({...f,quantite:+e.target.value}))}/></div><div className="form-group"><label>Seuil alerte</label><input type="number" value={form.seuil_alerte||""} onChange={e=>setForm(f=>({...f,seuil_alerte:+e.target.value}))}/></div><div className="form-group"><label>Unité</label><input value={form.unite} onChange={e=>setForm(f=>({...f,unite:e.target.value}))}/></div><div className="form-group"><label>Prix unitaire ($)</label><input type="number" value={form.prix_unitaire||""} onChange={e=>setForm(f=>({...f,prix_unitaire:+e.target.value}))}/></div></div><div className="form-group" style={{marginBottom:"1.25rem"}}><label>Notes</label><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:"0.5rem"}}><button className="btn btn-outline" onClick={()=>setTab("stocks")}>Annuler</button><button className="btn btn-gold" onClick={addStock} disabled={saving||!form.nom}>{saving?"…":"Créer"}</button></div></div>}
      {showMvt&&<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowMvt(null)}><div className="modal"><div className="modal-header"><h2 className="modal-title">{mvtForm.type==="entrée"?"↑ Entrée":"↓ Sortie"} — {showMvt.nom}</h2><button className="modal-close" onClick={()=>setShowMvt(null)}>×</button></div><div className="modal-body"><div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>{["entrée","sortie"].map(t=><button key={t} onClick={()=>setMvtForm(f=>({...f,type:t}))} style={{flex:1,padding:"0.5rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:mvtForm.type===t?700:400,background:mvtForm.type===t?(t==="entrée"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)"):"var(--surface)",border:`1px solid ${mvtForm.type===t?(t==="entrée"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"):"var(--border)"}`,color:mvtForm.type===t?(t==="entrée"?"var(--success)":"var(--danger)"):"var(--text-muted)"}}>{t==="entrée"?"↑ Entrée":"↓ Sortie"}</button>)}</div><div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.75rem",marginBottom:"1rem",textAlign:"center"}}><div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.2rem"}}>Stock actuel</div><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.75rem"}}>{fmtN(showMvt.quantite)} <span style={{fontSize:"1rem",fontWeight:400}}>{showMvt.unite}</span></div></div><div className="form-group"><label>Quantité *</label><input type="number" min={1} autoFocus value={mvtForm.quantite} onChange={e=>setMvtForm(f=>({...f,quantite:+e.target.value}))}/></div><div className="form-group"><label>Motif</label><input value={mvtForm.motif} onChange={e=>setMvtForm(f=>({...f,motif:e.target.value}))} placeholder="Ex: Mission Port · Vente Vlad..."/></div><div className="form-group" style={{marginBottom:0}}><label>Membre</label><input value={mvtForm.membre} onChange={e=>setMvtForm(f=>({...f,membre:e.target.value}))} placeholder={user?.nom||""}/></div></div><div className="modal-footer"><button className="btn btn-outline" onClick={()=>setShowMvt(null)}>Annuler</button><button className="btn btn-gold" onClick={()=>addMouvement(showMvt)} disabled={saving||mvtForm.quantite<=0}>{saving?"…":"Enregistrer"}</button></div></div></div>}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}