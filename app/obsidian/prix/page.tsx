"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { hasPermission } from "@/lib/auth";
import { dbw } from "@/lib/dbw";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

const fmt=(n:number)=>money(n);

// Regroupe les drogues par famille (même nom de base, ex: "Cocaïne") et les
// trie par % de pureté croissant à l'intérieur de chaque famille.
function drogueKey(nom:string){
  const m=(nom||"").match(/^(.*?)\s*(\d+)\s*%?\s*$/);
  if(m) return {base:m[1].trim().toLowerCase(),purity:parseInt(m[2],10)};
  return {base:(nom||"").trim().toLowerCase(),purity:0};
}
function sortDrogues(list:any[]){
  return [...list].sort((a,b)=>{
    const ka=drogueKey(a.nom),kb=drogueKey(b.nom);
    if(ka.base!==kb.base) return ka.base.localeCompare(kb.base,"fr");
    return ka.purity-kb.purity;
  });
}

import { ACCS } from "@/lib/priceRef";
import { useFournisseurs, fournisseursDe, venteRef } from "@/lib/fournisseurs";
import { GroupeInput } from "@/components/GroupeInput";
import { useGroupes } from "@/lib/groupes";
import { FournisseursPanel } from "@/components/FournisseursPanel";
import { money } from "@/lib/money";

export default function PrixPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_prix"))) { window.location.href = "/"; } }, [user, userLoading]);

  const groupes=useGroupes();
  const { list: fourn, reload: reloadFourn } = useFournisseurs();
  const fp=(cat:"drogue"|"arme"|"accessoire",nom:string,vente:number)=><FournisseursPanel categorie={cat} produit={nom} vente={vente} list={fournisseursDe(fourn,cat,nom)} onChange={reloadFourn}/>;
  const [tab,setTab]=useState<"drogues"|"armes"|"accessoires"|"zones">("drogues");
  const [drogues,setDrogues]=useState<any[]>([]);
  const [armes,setArmes]=useState<any[]>([]);
  const [zones,setZones]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  const [editDrogueId,setEditDrogueId]=useState<string|null>(null);
  const [editDrogueForm,setEditDrogueForm]=useState<any>({});
  const [newDrogue,setNewDrogue]=useState({nom:"",emoji:"💊",prix_min:0,prix_max:0,semaines_revend:0});

  const [editArmeId,setEditArmeId]=useState<string|null>(null);
  const [editArmeForm,setEditArmeForm]=useState<any>({});
  const [newArme,setNewArme]=useState({nom:"",prix:0});

  const [editZoneId,setEditZoneId]=useState<string|null>(null);
  const [editZoneForm,setEditZoneForm]=useState<any>({});
  const [newZone,setNewZone]=useState({nom:"",bonus:"",drogue:"",revendique_par:""});

  useEffect(()=>{load();},[]);
  async function load(){
    if(!supabase){setLoading(false);return;}
    const[{data:d},{data:a},{data:z}]=await Promise.all([
      supabase.from("obsidian_drogues").select("*").order("ordre"),
      supabase.from("obsidian_armes_prix").select("*").order("ordre"),
      supabase.from("obsidian_zones").select("*").order("ordre"),
    ]);
    setDrogues(d||[]);setArmes(a||[]);setZones(z||[]);setLoading(false);
  }

  // -- Drogues --
  async function addDrogue(){
    if(!supabase||!newDrogue.nom)return;
    const{data,error}=await dbw.insert("obsidian_drogues",{...newDrogue,ordre:drogues.length+1});
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>[...d,data as any]);setNewDrogue({nom:"",emoji:"💊",prix_min:0,prix_max:0,semaines_revend:0});showToast("Drogue ajoutée");
  }
  async function saveDrogue(id:string){
    if(!supabase)return;
    const{error}=await dbw.update("obsidian_drogues",id,editDrogueForm);
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>d.map(x=>x.id===id?{...x,...editDrogueForm}:x));setEditDrogueId(null);showToast("Mis à jour");
  }
  async function delDrogue(id:string){
    if(!supabase)return;
    const{error}=await dbw.remove("obsidian_drogues",id);
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>d.filter(x=>x.id!==id));showToast("Supprimée");
  }

  // -- Armes --
  async function addArme(){
    if(!supabase||!newArme.nom)return;
    const{data,error}=await dbw.insert("obsidian_armes_prix",{...newArme,ordre:armes.length+1});
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>[...a,data as any]);setNewArme({nom:"",prix:0});showToast("Arme ajoutée");
  }
  async function saveArme(id:string){
    if(!supabase)return;
    const{error}=await dbw.update("obsidian_armes_prix",id,editArmeForm);
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>a.map(x=>x.id===id?{...x,...editArmeForm}:x));setEditArmeId(null);showToast("Mis à jour");
  }
  async function delArme(id:string){
    if(!supabase)return;
    const{error}=await dbw.remove("obsidian_armes_prix",id);
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>a.filter(x=>x.id!==id));showToast("Supprimée");
  }

  // -- Zones --
  async function addZone(){
    if(!supabase||!newZone.nom)return;
    const{data,error}=await dbw.insert("obsidian_zones",{...newZone,ordre:zones.length+1});
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>[...z,data as any]);setNewZone({nom:"",bonus:"",drogue:"",revendique_par:""});showToast("Zone ajoutée");
  }
  async function saveZone(id:string){
    if(!supabase)return;
    const{error}=await dbw.update("obsidian_zones",id,editZoneForm);
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>z.map(x=>x.id===id?{...x,...editZoneForm}:x));setEditZoneId(null);showToast("Mis à jour");
  }
  async function delZone(id:string){
    if(!supabase)return;
    const{error}=await dbw.remove("obsidian_zones",id);
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>z.filter(x=>x.id!==id));showToast("Supprimée");
  }

  if (userLoading || !user) return null;

  return (
    <div className="page-container">
      <a className="back-link" href="/">Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">💲 Tableau des prix</h1><p className="page-subtitle">Prix de vente · Fournisseurs et prix d'achat · Marges</p><div className="gold-line"/></div></div>

      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {[["drogues","💊 Drogues"],["armes","🔫 Armes"],["accessoires","🔧 Accessoires"],["zones","🗺️ Zones"]].map(([k,l])=>
          <button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(139,92,246,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>
        )}
      </div>

      {loading ? <LoadingBlock /> : <>

      {/* -- DROGUES -- */}
      {tab==="drogues" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"0.75rem",marginBottom:"1.5rem"}}>
            {sortDrogues(drogues).map(d=>{
              const isEdit=editDrogueId===d.id;
              return (
                <div key={d.id} className="card">
                  {isEdit ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <input value={editDrogueForm.emoji} onChange={e=>setEditDrogueForm((f:any)=>({...f,emoji:e.target.value}))} style={{width:50}}/>
                        <input value={editDrogueForm.nom} onChange={e=>setEditDrogueForm((f:any)=>({...f,nom:e.target.value}))} style={{flex:1}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.4rem"}}>
                        <input type="number" placeholder="Prix min" value={editDrogueForm.prix_min} onChange={e=>setEditDrogueForm((f:any)=>({...f,prix_min:+e.target.value}))}/>
                        <input type="number" placeholder="Prix max" value={editDrogueForm.prix_max} onChange={e=>setEditDrogueForm((f:any)=>({...f,prix_max:+e.target.value}))}/>
                      </div>
                      <input type="number" placeholder="Semaines revend." value={editDrogueForm.semaines_revend} onChange={e=>setEditDrogueForm((f:any)=>({...f,semaines_revend:+e.target.value}))}/>
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button className="btn btn-gold btn-sm" onClick={()=>saveDrogue(d.id)} style={{flex:1}}>OK</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditDrogueId(null)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.625rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                          <span style={{fontSize:"1.3rem"}}>{d.emoji}</span>
                          <div><div style={{fontWeight:700}}>{d.nom}</div>{d.semaines_revend>0&&<div style={{fontSize:"0.65rem",color:"var(--success)"}}>+{d.semaines_revend} sem.</div>}</div>
                        </div>
                        <div style={{display:"flex",gap:"0.3rem"}}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{setEditDrogueId(d.id);setEditDrogueForm(d);}}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>delDrogue(d.id)} style={{color:"var(--danger)"}}>🗑️</button>
                        </div>
                      </div>
                      <div style={{fontSize:"0.62rem",color:"var(--text-dim)"}}>Prix de vente PNJ</div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,color:"var(--gold)"}}>{fmt(d.prix_min)} - {fmt(d.prix_max)}</div>
                      <div style={{fontSize:"0.68rem",color:"var(--text-dim)"}}>Moyenne : {fmt(venteRef(d.prix_min,d.prix_max))}</div>
                      {fp("drogue",d.nom,venteRef(d.prix_min,d.prix_max))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="card" style={{maxWidth:500}}>
            <div className="section-title" style={{marginBottom:"0.75rem"}}>+ Ajouter une drogue</div>
            <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.5rem"}}>
              <input placeholder="💊" value={newDrogue.emoji} onChange={e=>setNewDrogue(f=>({...f,emoji:e.target.value}))} style={{width:60}}/>
              <input placeholder="Nom" value={newDrogue.nom} onChange={e=>setNewDrogue(f=>({...f,nom:e.target.value}))} style={{flex:1}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.4rem",marginBottom:"0.75rem"}}>
              <input type="number" placeholder="Prix min" value={newDrogue.prix_min||""} onChange={e=>setNewDrogue(f=>({...f,prix_min:+e.target.value}))}/>
              <input type="number" placeholder="Prix max" value={newDrogue.prix_max||""} onChange={e=>setNewDrogue(f=>({...f,prix_max:+e.target.value}))}/>
              <input type="number" placeholder="Sem." value={newDrogue.semaines_revend||""} onChange={e=>setNewDrogue(f=>({...f,semaines_revend:+e.target.value}))}/>
            </div>
            <button className="btn btn-gold" onClick={addDrogue} disabled={!newDrogue.nom} style={{width:"100%",justifyContent:"center"}}>+ Ajouter</button>
          </div>
        </>
      )}

      {/* -- ARMES -- */}
      {tab==="armes" && (
        <>
          <div style={{display:"flex",flexDirection:"column",gap:"0.375rem",marginBottom:"1.5rem"}}>
            {armes.map(a=>{
              const isEdit=editArmeId===a.id;
              return (
                <div key={a.id} style={{padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                  {isEdit ? (
                    <>
                      <input value={editArmeForm.nom} onChange={e=>setEditArmeForm((f:any)=>({...f,nom:e.target.value}))} style={{flex:1}}/>
                      <input type="number" value={editArmeForm.prix} onChange={e=>setEditArmeForm((f:any)=>({...f,prix:+e.target.value}))} style={{width:140}}/>
                      <button className="btn btn-gold btn-sm" onClick={()=>saveArme(a.id)}>OK</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setEditArmeId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{flex:1,fontWeight:500}}>🔫 {a.nom}</span>
                      <span style={{fontWeight:700,color:"var(--gold)"}}>{fmt(a.prix)}</span>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setEditArmeId(a.id);setEditArmeForm(a);}}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>delArme(a.id)} style={{color:"var(--danger)"}}>🗑️</button>
                    </>
                  )}
                  </div>
                  {!isEdit&&fp("arme",a.nom,Number(a.prix)||0)}
                </div>
              );
            })}
          </div>
          <div className="card" style={{maxWidth:500}}>
            <div className="section-title" style={{marginBottom:"0.75rem"}}>+ Ajouter une arme</div>
            <div style={{display:"flex",gap:"0.4rem"}}>
              <input placeholder="Nom" value={newArme.nom} onChange={e=>setNewArme(f=>({...f,nom:e.target.value}))} style={{flex:1}}/>
              <input type="number" placeholder="Prix" value={newArme.prix||""} onChange={e=>setNewArme(f=>({...f,prix:+e.target.value}))} style={{width:140}}/>
            </div>
            <button className="btn btn-gold" onClick={addArme} disabled={!newArme.nom} style={{width:"100%",justifyContent:"center",marginTop:"0.75rem"}}>+ Ajouter</button>
          </div>
        </>
      )}

      {/* -- ACCESSOIRES (statique, comme avant) -- */}
      {tab==="accessoires" && (
        <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>
          {ACCS.map(a=><div key={a.nom} style={{padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500}}>{a.nom}</span><span style={{fontWeight:700,color:"var(--gold)"}}>{fmt(a.prix)}</span></div>{fp("accessoire",a.nom,a.prix)}</div>)}
        </div>
      )}

      {/* -- ZONES -- */}
      {tab==="zones" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"0.625rem",marginBottom:"1.5rem"}}>
            {zones.map(z=>{
              const isEdit=editZoneId===z.id;
              return (
                <div key={z.id} className="card">
                  {isEdit ? (
                    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                      <input placeholder="Nom" value={editZoneForm.nom} onChange={e=>setEditZoneForm((f:any)=>({...f,nom:e.target.value}))}/>
                      <input placeholder="Bonus" value={editZoneForm.bonus} onChange={e=>setEditZoneForm((f:any)=>({...f,bonus:e.target.value}))}/>
                      <input placeholder="Drogue" value={editZoneForm.drogue} onChange={e=>setEditZoneForm((f:any)=>({...f,drogue:e.target.value}))}/>
                      <GroupeInput groupes={groupes} placeholder="Revendiquée par" value={editZoneForm.revendique_par||""} onChange={v=>setEditZoneForm((f:any)=>({...f,revendique_par:v}))}/>
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button className="btn btn-gold btn-sm" onClick={()=>saveZone(z.id)} style={{flex:1}}>OK</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditZoneId(null)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{fontWeight:700,marginBottom:"0.2rem"}}>{z.nom}</div>
                        <div style={{display:"flex",gap:"0.3rem"}}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>{setEditZoneId(z.id);setEditZoneForm(z);}}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>delZone(z.id)} style={{color:"var(--danger)"}}>🗑️</button>
                        </div>
                      </div>
                      {z.bonus&&<div style={{fontSize:"0.72rem",color:"var(--success)",fontWeight:600}}>+{z.bonus}</div>}
                      {z.drogue&&<div style={{fontSize:"0.68rem",color:"#8b5cf6"}}>💊 {z.drogue}</div>}
                      {z.revendique_par&&<div style={{fontSize:"0.68rem",color:"var(--danger)",marginTop:"0.3rem"}}>🚩 {z.revendique_par}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="card" style={{maxWidth:500}}>
            <div className="section-title" style={{marginBottom:"0.75rem"}}>+ Ajouter une zone</div>
            <div className="form-grid" style={{marginBottom:"0.5rem"}}>
              <input placeholder="Nom de la zone" value={newZone.nom} onChange={e=>setNewZone(f=>({...f,nom:e.target.value}))}/>
              <input placeholder="Bonus (ex: 10%)" value={newZone.bonus} onChange={e=>setNewZone(f=>({...f,bonus:e.target.value}))}/>
            </div>
            <div className="form-grid" style={{marginBottom:"0.75rem"}}>
              <input placeholder="Drogue associée" value={newZone.drogue} onChange={e=>setNewZone(f=>({...f,drogue:e.target.value}))}/>
              <GroupeInput groupes={groupes} placeholder="Revendiquée par (gang/orga)" value={newZone.revendique_par} onChange={v=>setNewZone(f=>({...f,revendique_par:v}))}/>
            </div>
            <button className="btn btn-gold" onClick={addZone} disabled={!newZone.nom} style={{width:"100%",justifyContent:"center"}}>+ Ajouter</button>
          </div>
        </>
      )}

      </>}
      <Toast toast={toast} />
    </div>
  );
}