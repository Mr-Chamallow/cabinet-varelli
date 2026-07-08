"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

interface Drogue {
  id: string; nom: string; emoji: string;
  prix_min: number; prix_max: number;
  semaines_revend: number; actif: boolean; ordre: number;
}

const DEFAULT_DROGUES: Drogue[] = [
  { id:"1",nom:"Cocaïne",   emoji:"❄️", prix_min:429,prix_max:449,semaines_revend:17,actif:true,ordre:1 },
  { id:"2",nom:"Tranq",     emoji:"💉", prix_min:285,prix_max:300,semaines_revend:1, actif:true,ordre:2 },
  { id:"3",nom:"Meth Bleue",emoji:"🔵", prix_min:279,prix_max:299,semaines_revend:3, actif:true,ordre:3 },
  { id:"4",nom:"Weed",      emoji:"🌿", prix_min:422,prix_max:444,semaines_revend:11,actif:true,ordre:4 },
  { id:"5",nom:"Purple",    emoji:"🟣", prix_min:312,prix_max:334,semaines_revend:0, actif:true,ordre:5 },
  { id:"6",nom:"Crack",     emoji:"💎", prix_min:319,prix_max:339,semaines_revend:7, actif:true,ordre:6 },
  { id:"7",nom:"Mexicana",  emoji:"🌶️",prix_min:339,prix_max:359,semaines_revend:9, actif:true,ordre:7 },
  { id:"8",nom:"Ecstasy",   emoji:"💊", prix_min:180,prix_max:300,semaines_revend:0, actif:true,ordre:8 },
  { id:"9",nom:"Lean",      emoji:"🥤", prix_min:300,prix_max:350,semaines_revend:0, actif:true,ordre:9 },
  { id:"10",nom:"B-Magic",  emoji:"✨", prix_min:450,prix_max:470,semaines_revend:0, actif:true,ordre:10 },
];

const TYPES_CLIENT = [
  { key:"Gang / Organisation", taux:0.20, desc:"20% commission — tarif préférentiel" },
  { key:"Petite frappe",       taux:0.25, desc:"25% commission — tarif standard" },
  { key:"Indépendant",         taux:0.30, desc:"30% commission — tarif plein" },
];

const fmt  = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const fmtN = (n:number) => n.toLocaleString("fr-FR",{maximumFractionDigits:0});

export default function CalculatricePage() {
  const [drogues, setDrogues] = useState<Drogue[]>(DEFAULT_DROGUES);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"convert"|"equiv"|"config">("convert");

  // Convert
  const [typeClient, setTypeClient] = useState("Gang / Organisation");
  const [montant, setMontant]       = useState(0);
  const [sens, setSens]             = useState<"sale_to_propre"|"propre_to_sale">("sale_to_propre");

  // Config
  const [editId, setEditId]         = useState<string|null>(null);
  const [editForm, setEditForm]     = useState<Partial<Drogue>>({});
  const [newForm, setNewForm]       = useState({nom:"",emoji:"💊",prix_min:0,prix_max:0,semaines_revend:0});
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      if (supabase) {
        const { data } = await supabase.from("calculatrice_config").select("*").order("ordre");
        if (data && data.length > 0) { setDrogues(data); setLoading(false); return; }
      }
      setLoading(false);
    })();
  }, []);

  function showT(msg:string) { setToast(msg); setTimeout(()=>setToast(null),3000); }

  const taux = TYPES_CLIENT.find(t=>t.key===typeClient)?.taux || 0.2;

  const { resultat, commission } = useMemo(() => {
    if (!montant) return { resultat:0, commission:0 };
    if (sens === "sale_to_propre") {
      const c = Math.round(montant * taux);
      return { resultat: montant - c, commission: c };
    } else {
      const sale = Math.round(montant / (1 - taux));
      return { resultat: sale, commission: Math.round(sale * taux) };
    }
  }, [montant, taux, sens]);

  const montantPropre = sens === "sale_to_propre" ? resultat : montant;

  const equivalents = useMemo(() =>
    drogues.filter(d=>d.actif).map(d => {
      const mid = (d.prix_min + d.prix_max) / 2;
      return { ...d, mid, units: mid > 0 ? Math.floor(montantPropre / mid) : 0 };
    }), [drogues, montantPropre]
  );

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    if (supabase) await supabase.from("calculatrice_config").update(editForm).eq("id", editId);
    setDrogues(ds => ds.map(d => d.id===editId ? {...d,...editForm} as Drogue : d));
    setEditId(null); showT("Mis à jour"); setSaving(false);
  }

  async function addDrogue() {
    if (!newForm.nom.trim()) return;
    setSaving(true);
    const row = {...newForm, actif:true, ordre:drogues.length+1};
    if (supabase) {
      const { data } = await supabase.from("calculatrice_config").insert([row]).select().single();
      if (data) setDrogues(ds=>[...ds,data]);
    } else {
      setDrogues(ds=>[...ds,{...row,id:String(Date.now())}]);
    }
    setNewForm({nom:"",emoji:"💊",prix_min:0,prix_max:0,semaines_revend:0});
    showT("Drogue ajoutée"); setSaving(false);
  }

  async function toggleActif(d:Drogue) {
    if (supabase) await supabase.from("calculatrice_config").update({actif:!d.actif}).eq("id",d.id);
    setDrogues(ds=>ds.map(x=>x.id===d.id?{...x,actif:!x.actif}:x));
  }

  const maxUnits = Math.max(...equivalents.map(e=>e.units), 1);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calculatrice</h1>
          <p className="page-subtitle">Blanchiment · Équivalents drogues · Configuration des prix</p>
          <div className="gold-line"/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.5rem"}}>
        {([["convert","💰 Convertisseur"],["equiv","💊 Équivalents"],["config","⚙️ Config prix"]] as [string,string][]).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)} style={{padding:"0.55rem 1.25rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.85rem",fontWeight:tab===k?700:400,background:tab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${tab===k?"rgba(196,179,137,0.4)":"var(--border)"}`,color:tab===k?"var(--gold)":"var(--text-muted)",transition:"all 0.15s"}}>{l}</button>
        ))}
      </div>

      {/* ── CONVERTISSEUR ── */}
      {tab==="convert" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem"}}>
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div className="card">
              <div className="section-title" style={{marginBottom:"1rem"}}>Type de client</div>
              {TYPES_CLIENT.map(t=>(
                <button key={t.key} onClick={()=>setTypeClient(t.key)} style={{display:"flex",alignItems:"center",gap:"0.75rem",width:"100%",padding:"0.625rem 0.875rem",borderRadius:"var(--radius)",background:typeClient===t.key?"var(--gold-muted)":"var(--surface)",border:`1px solid ${typeClient===t.key?"rgba(196,179,137,0.4)":"var(--border)"}`,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginBottom:"0.35rem",textAlign:"left"}}>
                  <div style={{width:14,height:14,borderRadius:"50%",flexShrink:0,border:`2px solid ${typeClient===t.key?"var(--gold)":"var(--border-light)"}`,background:typeClient===t.key?"var(--gold)":"transparent",transition:"all 0.15s"}}/>
                  <div>
                    <div style={{fontSize:"0.82rem",fontWeight:typeClient===t.key?600:400,color:typeClient===t.key?"var(--gold)":"var(--text-muted)"}}>{t.key}</div>
                    <div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="card">
              <div className="section-title" style={{marginBottom:"0.875rem"}}>Sens du calcul</div>
              <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
                {[["sale_to_propre","💰 Sale → Propre"],["propre_to_sale","💎 Propre → Sale"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setSens(k as any)} style={{flex:1,padding:"0.5rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.78rem",fontWeight:sens===k?700:400,background:sens===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${sens===k?"rgba(196,179,137,0.4)":"var(--border)"}`,color:sens===k?"var(--gold)":"var(--text-muted)"}}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Montant {sens==="sale_to_propre"?"sale":"propre"} ($)</label>
                <input type="number" min={0} value={montant||""} placeholder="Ex: 1 000 000"
                  onChange={e=>setMontant(Math.max(0,parseInt(e.target.value)||0))}
                  style={{fontSize:"1.1rem",fontWeight:700,color:"var(--text)"}}/>
              </div>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div className="card" style={{background:"linear-gradient(135deg,var(--card),rgba(196,179,137,0.04))",border:"1px solid rgba(196,179,137,0.25)"}}>
              <div style={{textAlign:"center",padding:"1rem 0 1.5rem"}}>
                <div style={{fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--text-dim)",marginBottom:"0.625rem"}}>
                  {sens==="sale_to_propre"?"ARGENT PROPRE RÉCUPÉRÉ":"ARGENT SALE À FOURNIR"}
                </div>
                <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:resultat>9999999?"2.2rem":"2.75rem",color:resultat>0?"var(--gold)":"var(--text-dim)",lineHeight:1}}>
                  {resultat>0?fmt(resultat):"—"}
                </div>
              </div>
              {montant>0 && (
                <div style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"1rem",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                  {[
                    [sens==="sale_to_propre"?"Montant sale":"Montant propre", fmt(montant), "var(--text)"],
                    [`Commission (${Math.round(taux*100)}%)`, `− ${fmt(commission)}`, "var(--danger)"],
                    [sens==="sale_to_propre"?"Net propre":"Montant sale", fmt(resultat), "var(--success)"],
                  ].map(([l,v,c],i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:i===2?"0.9rem":"0.82rem",fontWeight:i===2?700:400,borderTop:i===2?"1px solid var(--border)":"none",paddingTop:i===2?"0.4rem":"0"}}>
                      <span style={{color:"var(--text-dim)"}}>{l}</span>
                      <span style={{color:String(c)}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {montantPropre>0 && (
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}>
                  <div className="section-title" style={{marginBottom:0}}>Top 5 équivalents</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setTab("equiv")}>Voir tout →</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                  {equivalents.slice(0,5).map(d=>(
                    <div key={d.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.4rem 0.75rem",background:"var(--surface)",borderRadius:"var(--radius)"}}>
                      <span style={{fontSize:"0.82rem"}}>{d.emoji} {d.nom}</span>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:700,color:"var(--gold)",fontSize:"0.875rem"}}>{fmtN(d.units)} u.</div>
                        <div style={{fontSize:"0.6rem",color:"var(--text-dim)"}}>{fmt(d.mid)}/u</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ÉQUIVALENTS ── */}
      {tab==="equiv" && (
        <>
          <div className="card" style={{marginBottom:"1.25rem"}}>
            <div style={{display:"flex",gap:"1rem",alignItems:"flex-end",flexWrap:"wrap"}}>
              <div className="form-group" style={{flex:1,minWidth:220,marginBottom:0}}>
                <label>Montant en argent propre ($)</label>
                <input type="number" min={0} value={montant||""} placeholder="Ex: 500 000"
                  onChange={e=>setMontant(Math.max(0,parseInt(e.target.value)||0))}
                  style={{fontSize:"1rem",fontWeight:600,color:"var(--text)"}}/>
              </div>
              <div style={{fontSize:"0.75rem",color:"var(--text-dim)",paddingBottom:"0.5rem"}}>
                Nombre d'unités achetables au prix de vente PNJ actuel
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"0.75rem"}}>
            {equivalents.map(d=>{
              const bar = maxUnits>0 ? (d.units/maxUnits)*100 : 0;
              return (
                <div key={d.id} className="card" style={{opacity:d.actif?1:0.4,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,var(--gold) ${bar}%,transparent ${bar}%)`}}/>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"}}>
                    <span style={{fontSize:"1.4rem"}}>{d.emoji}</span>
                    <div>
                      <div style={{fontWeight:600,fontSize:"0.875rem"}}>{d.nom}</div>
                      <div style={{fontSize:"0.6rem",color:"var(--text-dim)"}}>
                        {fmt(d.prix_min)}–{fmt(d.prix_max)}/u
                        {d.semaines_revend>0&&<span style={{color:"var(--success)",marginLeft:"0.3rem"}}>+{d.semaines_revend}sem</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.75rem",color:montantPropre>0&&d.units>0?"var(--gold)":"var(--text-dim)",lineHeight:1,marginBottom:"0.3rem"}}>
                    {montantPropre>0?fmtN(d.units):"—"}
                    {montantPropre>0&&<span style={{fontSize:"0.75rem",fontWeight:400,color:"var(--text-dim)",marginLeft:"0.3rem"}}>unités</span>}
                  </div>
                  {montantPropre>0&&d.units>0&&(
                    <div style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>
                      Valeur estimée : {fmt(d.units*d.mid)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── CONFIG ── */}
      {tab==="config" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:"1.5rem"}}>
          <div>
            <div className="section-title" style={{marginBottom:"1rem"}}>Prix de vente actuels</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
              {drogues.map(d=>(
                <div key={d.id} className="card" style={{opacity:d.actif?1:0.45}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                    <span style={{fontSize:"1.25rem",flexShrink:0}}>{d.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:"0.875rem"}}>{d.nom}</div>
                      <div style={{fontSize:"0.68rem",color:"var(--text-dim)"}}>
                        {fmt(d.prix_min)} – {fmt(d.prix_max)} / unité
                        {d.semaines_revend>0&&<span style={{color:"var(--success)",marginLeft:"0.5rem"}}>· {d.semaines_revend} sem. revendication</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:"0.35rem",flexShrink:0}}>
                      <button className="btn btn-outline btn-sm" onClick={()=>{setEditId(d.id);setEditForm({prix_min:d.prix_min,prix_max:d.prix_max,semaines_revend:d.semaines_revend});}}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>toggleActif(d)} style={{color:d.actif?"var(--warning)":"var(--success)",fontSize:"0.72rem"}}>
                        {d.actif?"Masquer":"Afficher"}
                      </button>
                    </div>
                  </div>
                  {editId===d.id&&(
                    <div style={{marginTop:"0.875rem",paddingTop:"0.875rem",borderTop:"1px solid var(--border)"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"0.625rem"}}>
                        {[["Prix min ($)","prix_min"],["Prix max ($)","prix_max"],["Semaines revend.","semaines_revend"]].map(([l,k])=>(
                          <div key={k} className="form-group" style={{marginBottom:0}}>
                            <label>{l}</label>
                            <input type="number" value={(editForm as any)[k]||0} onChange={e=>setEditForm(f=>({...f,[k]:+e.target.value}))}/>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end"}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setEditId(null)}>Annuler</button>
                        <button className="btn btn-gold btn-sm" onClick={saveEdit} disabled={saving}>{saving?"…":"Sauvegarder"}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{alignSelf:"start"}}>
            <div className="section-title" style={{marginBottom:"1rem"}}>Ajouter une drogue</div>
            <div className="form-group"><label>Nom</label><input placeholder="Ex: Héroïne" value={newForm.nom} onChange={e=>setNewForm(f=>({...f,nom:e.target.value}))}/></div>
            <div className="form-group"><label>Emoji</label><input placeholder="💊" value={newForm.emoji} onChange={e=>setNewForm(f=>({...f,emoji:e.target.value}))} style={{width:70}}/></div>
            <div className="form-grid">
              <div className="form-group"><label>Prix min ($)</label><input type="number" value={newForm.prix_min||""} onChange={e=>setNewForm(f=>({...f,prix_min:+e.target.value}))}/></div>
              <div className="form-group"><label>Prix max ($)</label><input type="number" value={newForm.prix_max||""} onChange={e=>setNewForm(f=>({...f,prix_max:+e.target.value}))}/></div>
            </div>
            <div className="form-group" style={{marginBottom:"1.25rem"}}><label>Semaines de revendication</label><input type="number" min={0} value={newForm.semaines_revend||""} onChange={e=>setNewForm(f=>({...f,semaines_revend:+e.target.value}))}/></div>
            <button className="btn btn-gold" onClick={addDrogue} disabled={saving||!newForm.nom.trim()} style={{width:"100%",justifyContent:"center"}}>+ Ajouter</button>
          </div>
        </div>
      )}

      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
