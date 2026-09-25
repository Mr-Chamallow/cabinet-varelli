"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { hasPermission } from "@/lib/auth";

const fmt=(n:number)=>n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});

const ACCS=[{nom:"Chargeurs Pistolets",prix:225000},{nom:"Chargeurs Auto",prix:500000},{nom:"Chargeurs Lourdes",prix:750000},{nom:"Silencieux Pistolets",prix:17500},{nom:"Silencieux Auto",prix:25000},{nom:"Silencieux Lourdes",prix:30000},{nom:"Viseurs Pistolets",prix:17500},{nom:"Viseurs Auto",prix:25000},{nom:"Viseurs Lourdes",prix:30000},{nom:"Poignées Lourdes",prix:30000},{nom:"Lampes Pistolets",prix:17500},{nom:"Lampes Lourdes",prix:30000},{nom:"Compensateurs Pistolets",prix:17500},{nom:"Freins Auto",prix:25000},{nom:"Freins Lourdes",prix:30000},{nom:"Canons Auto",prix:25000},{nom:"Canons Lourdes",prix:30000}];

export default function PrixPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_prix"))) { window.location.href = "/"; } }, [user, userLoading]);

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

  // ── Drogues ──
  async function addDrogue(){
    if(!supabase||!newDrogue.nom)return;
    const{data,error}=await supabase.from("obsidian_drogues").insert([{...newDrogue,ordre:drogues.length+1}]).select().single();
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>[...d,data]);setNewDrogue({nom:"",emoji:"💊",prix_min:0,prix_max:0,semaines_revend:0});showToast("Drogue ajoutée");
  }
  async function saveDrogue(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_drogues").update(editDrogueForm).eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>d.map(x=>x.id===id?{...x,...editDrogueForm}:x));setEditDrogueId(null);showToast("Mis à jour");
  }
  async function delDrogue(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_drogues").delete().eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setDrogues(d=>d.filter(x=>x.id!==id));showToast("Supprimée");
  }

  // ── Armes ──
  async function addArme(){
    if(!supabase||!newArme.nom)return;
    const{data,error}=await supabase.from("obsidian_armes_prix").insert([{...newArme,ordre:armes.length+1}]).select().single();
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>[...a,data]);setNewArme({nom:"",prix:0});showToast("Arme ajoutée");
  }
  async function saveArme(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_armes_prix").update(editArmeForm).eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>a.map(x=>x.id===id?{...x,...editArmeForm}:x));setEditArmeId(null);showToast("Mis à jour");
  }
  async function delArme(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_armes_prix").delete().eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setArmes(a=>a.filter(x=>x.id!==id));showToast("Supprimée");
  }

  // ── Zones ──
  async function addZone(){
    if(!supabase||!newZone.nom)return;
    const{data,error}=await supabase.from("obsidian_zones").insert([{...newZone,ordre:zones.length+1}]).select().single();
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>[...z,data]);setNewZone({nom:"",bonus:"",drogue:"",revendique_par:""});showToast("Zone ajoutée");
  }
  async function saveZone(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_zones").update(editZoneForm).eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>z.map(x=>x.id===id?{...x,...editZoneForm}:x));setEditZoneId(null);showToast("Mis à jour");
  }
  async function delZone(id:string){
    if(!supabase)return;
    const{error}=await supabase.from("obsidian_zones").delete().eq("id",id);
    if(error){alert("❌ "+error.message);return;}
    setZones(z=>z.filter(x=>x.id!==id));showToast("Supprimée");
  }

  if (userLoading || !user) return null;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">💲 Tableau des prix</h1><p className="page-subtitle">Drogues · Armes · Accessoires · Zones — Personnalisable</p><div className="gold-line"/></div></div>

      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        {[["drogues","💊 Drogues"],["armes","🔫 Armes"],["accessoires","🔧 Accessoires"],["zones","🗺️ Zones"]].map(([k,l])=>
          <button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.5rem 1rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.82rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(139,92,246,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)"}}>{l}</button>
        )}
      </div>

      {loading ? <div style={{color:"var(--text-dim)"}}>Chargement…</div> : <>

      {/* ── DROGUES ── */}
      {tab==="drogues" && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"0.75rem",marginBottom:"1.5rem"}}>
            {drogues.map(d=>{
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
                        <button className="btn btn-gold btn-sm" onClick={()=>saveDrogue(d.id)} style={{flex:1}}>✓</button>
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
                      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,color:"var(--gold)"}}>{fmt(d.prix_min)} – {fmt(d.prix_max)}</div>
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

      {/* ── ARMES ── */}
      {tab==="armes" && (
        <>
          <div style={{display:"flex",flexDirection:"column",gap:"0.375rem",marginBottom:"1.5rem"}}>
            {armes.map(a=>{
              const isEdit=editArmeId===a.id;
              return (
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}>
                  {isEdit ? (
                    <>
                      <input value={editArmeForm.nom} onChange={e=>setEditArmeForm((f:any)=>({...f,nom:e.target.value}))} style={{flex:1}}/>
                      <input type="number" value={editArmeForm.prix} onChange={e=>setEditArmeForm((f:any)=>({...f,prix:+e.target.value}))} style={{width:140}}/>
                      <button className="btn btn-gold btn-sm" onClick={()=>saveArme(a.id)}>✓</button>
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

      {/* ── ACCESSOIRES (statique, comme avant) ── */}
      {tab==="accessoires" && (
        <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>
          {ACCS.map(a=><div key={a.nom} style={{display:"flex",justifyContent:"space-between",padding:"0.625rem 1rem",background:"var(--card)",borderRadius:"var(--radius)",border:"1px solid var(--border)"}}><span style={{fontWeight:500}}>{a.nom}</span><span style={{fontWeight:700,color:"var(--gold)"}}>{fmt(a.prix)}</span></div>)}
        </div>
      )}

      {/* ── ZONES ── */}
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
                      <input placeholder="Revendiquée par" value={editZoneForm.revendique_par||""} onChange={e=>setEditZoneForm((f:any)=>({...f,revendique_par:e.target.value}))}/>
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button className="btn btn-gold btn-sm" onClick={()=>saveZone(z.id)} style={{flex:1}}>✓</button>
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
              <input placeholder="Revendiquée par (gang/orga)" value={newZone.revendique_par} onChange={e=>setNewZone(f=>({...f,revendique_par:e.target.value}))}/>
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