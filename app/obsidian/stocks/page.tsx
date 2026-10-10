"use client";
import { ALL_SUGG, DEFAULT_TAGS } from "@/lib/illegalItems";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoAction } from "@/lib/useUndoAction";
import { Modal } from "@/components/ui/Modal";
import { hasPermission } from "@/lib/auth";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { usePriceItems, type PriceItem } from "@/lib/priceRef";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
const ARMU=["arme","munition","accessoire","explosif","kev"]; // = ancienne page Armurerie
const fmtN=(n:number)=>n.toLocaleString("fr-FR",{maximumFractionDigits:2});
const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
interface Stock{id:string;nom:string;categorie:string;emoji:string;quantite:number;seuil_alerte:number;unite:string;prix_unitaire:number;notes:string;}
interface Mouvement{id:string;stock_nom:string;type:string;quantite:number;motif:string;membre:string;created_at:string;}
export default function StocksPage(){
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  const { pending: pendingUndo, scheduleDelete, undo: undoDelete } = useUndoAction();
  useEffect(() => { if (!userLoading && (!user || !(hasPermission(user, "obsidian_stocks") || hasPermission(user, "obsidian_armurerie")))) { window.location.href = "/"; } }, [user, userLoading]);
  const [stocks,setStocks]=useState<Stock[]>([]);
  const [mouvements,setMouvements]=useState<Mouvement[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"stocks"|"ajouter"|"historique">("stocks");
  const [filterCat,setFilterCat]=useState("");
  const [form,setForm]=useState({nom:"",categorie:"",emoji:"📦",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});
  const [mvtForm,setMvtForm]=useState({stock_id:"",type:"sortie",quantite:1,motif:"",membre:"",prix_achat:""});
  const [showMvt,setShowMvt]=useState<Stock|null>(null);
  const [saving,setSaving]=useState(false);
  const pD=usePriceItems("drogue"),pA=usePriceItems("arme"),pC=usePriceItems("accessoire");
  // Suggestions de nom (filtrées par le tag choisi) ; saisie libre toujours possible → crée l'article.
  const suggs=useMemo(()=>{
    const fromP=(l:PriceItem[],t:string)=>l.map(x=>({nom:x.nom,emoji:x.emoji||"📦",categorie:t,prix:x.prix||0}));
    const all=[...fromP(pD,"drogue"),...fromP(pA,"arme"),...fromP(pC,"accessoire"),...ALL_SUGG.map(x=>({...x,prix:0}))];
    const t=form.categorie.trim().toLowerCase();
    return t?all.filter(x=>x.categorie.toLowerCase()===t):all;
  },[pD,pA,pC,form.categorie]);
  const tags=useMemo(()=>[...new Set([...DEFAULT_TAGS,...stocks.map(s=>s.categorie).filter(Boolean)])].sort((a,b)=>a.localeCompare(b)),[stocks]);
  useEffect(()=>{load();},[]);
  useEffect(()=>{ try{ if(new URLSearchParams(window.location.search).get("cat")==="armurerie") setFilterCat("__armurerie"); }catch{} },[]);
  useRealtimeTable(["obsidian_stocks","obsidian_mouvements"], load);
  async function load(){if(!supabase){setLoading(false);return;}
    const[{data:s},{data:m}]=await Promise.all([supabase.from("obsidian_stocks").select("*").order("categorie").order("nom"),supabase.from("obsidian_mouvements").select("*").order("created_at",{ascending:false}).limit(100)]);
    setStocks(s||[]);setMouvements(m||[]);setLoading(false);}
  async function addStock(){
  if(!form.nom)return;setSaving(true);
  const res = await fetch("/api/obsidian/stocks", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok) { alert("❌ "+data.error); setSaving(false); return; }
  setStocks(s=>[...s,data]);
  setForm({nom:"",categorie:"",emoji:"📦",quantite:0,seuil_alerte:0,unite:"unité",prix_unitaire:0,notes:""});
  showToast("Stock créé");setSaving(false);setTab("stocks");
}
  async function addMouvement(stock:Stock){
    if(mvtForm.quantite<=0)return;setSaving(true);
    const res = await fetch("/api/obsidian/mouvements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_id: stock.id, type: mvtForm.type, quantite: mvtForm.quantite, motif: mvtForm.motif, membre: mvtForm.membre || user?.nom || "", created_by: user?.nom || "", ...(mvtForm.type==="entrée"&&mvtForm.prix_achat!==""?{prix_unitaire:Number(mvtForm.prix_achat)}:{}) }),
    });
    const data = await res.json();
    if (!res.ok) { alert("❌ "+data.error); setSaving(false); return; }
    setStocks(s=>s.map(x=>x.id===stock.id?data.stock:x));
    setMouvements(m=>[{id:Date.now().toString(),stock_nom:stock.nom,type:mvtForm.type,quantite:mvtForm.quantite,motif:mvtForm.motif,membre:mvtForm.membre||user?.nom||"",created_at:new Date().toISOString()},...m]);
    setShowMvt(null);setMvtForm({stock_id:"",type:"sortie",quantite:1,motif:"",membre:"",prix_achat:""});showToast(`${mvtForm.type==="entrée"?"Entrée":"Sortie"} enregistrée`);setSaving(false);}
  // ⚠️ La vraie suppression (appel API) se fait IMMÉDIATEMENT, pas après le délai
  // du toast "Annuler" : un refresh pendant les 5s du toast tuerait le setTimeout
  // avant son exécution, donc le stock ne serait jamais réellement supprimé côté
  // serveur et réapparaîtrait au rechargement. Le toast ne sert plus qu'à proposer
  // de RECRÉER le stock (nouvel id) si on clique "Annuler" à temps.
  async function deleteStock(id:string){
    const item = stocks.find(s=>s.id===id);
    if (!item) return;
    setStocks(s=>s.filter(x=>x.id!==id));

    const res = await fetch("/api/obsidian/stocks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) {
      const data = await res.json(); alert("❌ "+data.error);
      setStocks(s=>[...s, item]);
      return;
    }

    scheduleDelete(`"${item.nom}" supprimé`, async () => {}, async () => {
      const { id: _id, ...rest } = item;
      const r = await fetch("/api/obsidian/stocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
      if (r.ok) { const recreated = await r.json(); setStocks(s=>[...s, recreated]); }
    });
  }
  const filtered=stocks.filter(s=>!filterCat||(filterCat==="__armurerie"?ARMU.includes(s.categorie):s.categorie===filterCat));
  const alerts=stocks.filter(s=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte);
  const CAT_COL:Record<string,string>={drogue:"#7c3aed",arme:"var(--danger)",munition:"#f97316",explosif:"#ef4444",kev:"#64b5f6","objet légal":"#4db6ac",accessoire:"var(--warning)",composant:"var(--info)","objet illégal":"var(--gold)",autre:"var(--text-muted)"};
  return(
    <div className="page-container">
      <a className="back-link" href="/obsidian">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">📦 Stocks</h1><p className="page-subtitle">Inventaire central (armurerie incluse) · Entrées & Sorties</p><div className="gold-line"/></div><button className="btn btn-gold" onClick={()=>setTab("ajouter")}>+ Nouveau stock</button></div>
      {alerts.length>0&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",marginBottom:"1rem",display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"0.72rem",fontWeight:700,color:"var(--danger)"}}>⚠️ Stocks bas :</span>{alerts.map(a=><span key={a.id} style={{fontSize:"0.72rem",padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(239,68,68,0.1)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.2)",fontWeight:600}}>{a.emoji} {a.nom} : {fmtN(a.quantite)} {a.unite}</span>)}</div>}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem"}}>
        {[["stocks","📦 Inventaire"],["historique","🧾 Historique"],["ajouter","➕ Ajouter"]].map(([k,l])=><button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(var(--gold-rgb), 0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>)}
      </div>
      {tab==="stocks"&&<>
        <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem",flexWrap:"wrap"}}>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:"auto",minWidth:140}}><option value="">Toutes catégories</option><option value="__armurerie">🔫 Armurerie (armes, munitions…)</option>{tags.map(c=><option key={c}>{c}</option>)}</select>
        </div>
        {loading?<LoadingBlock />:
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
      {tab==="ajouter"&&<div className="card" style={{maxWidth:560}}><div className="section-title" style={{marginBottom:"1rem"}}>Nouveau stock</div><div className="form-grid"><div className="form-group"><label>Emoji</label><input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={{width:70}}/></div><div className="form-group"><label>Tag <small style={{opacity:.6}}>(optionnel — un nouveau tag est créé automatiquement)</small></label><input list="tags-stock" placeholder="Ex : drogue, composant, kev…" value={form.categorie} onChange={e=>setForm(f=>({...f,categorie:e.target.value}))}/><datalist id="tags-stock">{tags.map(t=><option key={t} value={t}/>)}</datalist></div><div className="form-group" style={{gridColumn:"1/-1"}}><label>Nom *<small style={{opacity:.6}}> (liste{form.categorie?` « ${form.categorie} »`:""} ou écriture libre : un nom inconnu crée l'article)</small></label><input autoFocus list="sugg-stock" placeholder="Choisir dans la liste ou écrire un nouvel article" value={form.nom} onChange={e=>{const v=e.target.value;const sg=suggs.find(x=>x.nom.toLowerCase()===v.toLowerCase());setForm(f=>({...f,nom:v,...(sg?{emoji:sg.emoji,categorie:f.categorie||sg.categorie,prix_unitaire:sg.prix||f.prix_unitaire}:{})}));}}/><datalist id="sugg-stock">{suggs.map(x=><option key={x.categorie+x.nom} value={x.nom}>{x.categorie}</option>)}</datalist></div><div className="form-group"><label>Quantité initiale</label><input type="number" value={form.quantite||""} onChange={e=>setForm(f=>({...f,quantite:+e.target.value}))}/></div><div className="form-group"><label>Seuil alerte</label><input type="number" value={form.seuil_alerte||""} onChange={e=>setForm(f=>({...f,seuil_alerte:+e.target.value}))}/></div><div className="form-group"><label>Unité</label><input value={form.unite} onChange={e=>setForm(f=>({...f,unite:e.target.value}))}/></div><div className="form-group"><label>Prix unitaire ($)</label><input type="number" value={form.prix_unitaire||""} onChange={e=>setForm(f=>({...f,prix_unitaire:+e.target.value}))}/></div></div><div className="form-group" style={{marginBottom:"1.25rem"}}><label>Notes</label><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div><div style={{display:"flex",gap:"0.5rem"}}><button className="btn btn-outline" onClick={()=>setTab("stocks")}>Annuler</button><button className="btn btn-gold" onClick={addStock} disabled={saving||!form.nom}>{saving?"…":"Créer"}</button></div></div>}
      {tab==="historique"&&<div className="card"><div className="section-title" style={{marginBottom:"0.75rem"}}>🧾 Journal des mouvements de stock</div>{mouvements.length===0?<div style={{color:"var(--text-dim)",fontSize:"0.8rem"}}>Aucun mouvement.</div>:<div style={{display:"flex",flexDirection:"column"}}>{mouvements.map((m:any)=><div key={m.id} style={{display:"flex",gap:"0.75rem",alignItems:"center",padding:"0.45rem 0",borderBottom:"1px solid var(--border)",fontSize:"0.78rem",flexWrap:"wrap"}}><span style={{color:"var(--text-dim)",minWidth:110}}>{new Date(m.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span><b style={{color:m.type==="entrée"?"var(--success)":"var(--danger)",minWidth:70}}>{m.type==="entrée"?"↑ Entrée":"↓ Sortie"}</b><span style={{fontWeight:600}}>{m.quantite} × {m.stock_nom}</span>{Number(m.total)>0&&<span style={{color:"var(--gold)"}}>{fmt(Number(m.total))}</span>}<span style={{color:"var(--text-dim)",flex:1}}>{m.motif}</span><span style={{color:"var(--text-muted)"}}>{m.membre}</span></div>)}</div>}</div>}
      {showMvt&&<Modal title={<>{mvtForm.type==="entrée"?"↑ Entrée":"↓ Sortie"} — {showMvt.nom}</>} onClose={()=>setShowMvt(null)} footer={<><button className="btn btn-outline" onClick={()=>setShowMvt(null)}>Annuler</button><button className="btn btn-gold" onClick={()=>addMouvement(showMvt)} disabled={saving||mvtForm.quantite<=0}>{saving?"…":"Enregistrer"}</button></>}><div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>{["entrée","sortie"].map(t=><button key={t} onClick={()=>setMvtForm(f=>({...f,type:t}))} style={{flex:1,padding:"0.5rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:mvtForm.type===t?700:400,background:mvtForm.type===t?(t==="entrée"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)"):"var(--surface)",border:`1px solid ${mvtForm.type===t?(t==="entrée"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"):"var(--border)"}`,color:mvtForm.type===t?(t==="entrée"?"var(--success)":"var(--danger)"):"var(--text-muted)"}}>{t==="entrée"?"↑ Entrée":"↓ Sortie"}</button>)}</div><div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.75rem",marginBottom:"1rem",textAlign:"center"}}><div style={{fontSize:"0.65rem",color:"var(--text-dim)",marginBottom:"0.2rem"}}>Stock actuel</div><div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.75rem"}}>{fmtN(showMvt.quantite)} <span style={{fontSize:"1rem",fontWeight:400}}>{showMvt.unite}</span></div></div><div className="form-group"><label>Quantité *</label><input type="number" min={1} autoFocus value={mvtForm.quantite} onChange={e=>setMvtForm(f=>({...f,quantite:+e.target.value}))}/></div>{mvtForm.type==="entrée"&&<div className="form-group"><label>Prix d'achat unitaire ($) <small style={{opacity:.6}}>→ dépense en compta</small></label><input type="number" min={0} value={mvtForm.prix_achat} placeholder={String(showMvt?.prix_unitaire||0)} onChange={e=>setMvtForm(f=>({...f,prix_achat:e.target.value}))}/></div>}<div className="form-group"><label>Motif</label><input value={mvtForm.motif} onChange={e=>setMvtForm(f=>({...f,motif:e.target.value}))} placeholder="Ex: Mission Port · Vente Vlad..."/></div><div className="form-group" style={{marginBottom:0}}><label>Membre</label><input value={mvtForm.membre} onChange={e=>setMvtForm(f=>({...f,membre:e.target.value}))} placeholder={user?.nom||""}/></div></Modal>}
      <Toast toast={toast} />
      <UndoToast pending={pendingUndo} onUndo={undoDelete} />
    </div>
  );
}