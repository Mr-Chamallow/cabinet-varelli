"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Facture {
  id: string; numero: string; client: string; dossier: string;
  montant: number; description: string; statut: string;
  date_echeance: string; created_by: string; created_at: string;
}

const STATUTS = ["En attente","Payée","En retard","Annulée"];
const STATUT_COLORS: Record<string,string> = { "En attente":"var(--warning)", Payée:"var(--success)", "En retard":"var(--danger)", Annulée:"var(--text-dim)" };
const STATUT_ICONS: Record<string,string> = { "En attente":"⏳", Payée:"✅", "En retard":"🔴", Annulée:"❌" };

const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const dateStr = (s:string) => s ? new Date(s.includes("T")?s:s+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—";

function genNum() { return `FAC-${new Date().getFullYear()}-${Math.floor(Math.random()*90000)+10000}`; }

const EMPTY = { numero:"", client:"", dossier:"", montant:0, description:"", statut:"En attente", date_echeance:"" };

export default function FacturesPage() {
  const user = getUser();
  const [factures, setFactures]   = useState<Facture[]>([]);
  const [clients, setClients]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [search, setSearch]       = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string|null>(null);
  const [form, setForm]           = useState({ ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState<string|null>(null);
  const [toast, setToast]         = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data:f },{ data:c }] = await Promise.all([
      supabase.from("factures").select("*").order("created_at",{ascending:false}),
      supabase.from("clients").select("nom_rp").order("nom_rp"),
    ]);
    setFactures(f||[]); setClients((c||[]).map((x:any)=>x.nom_rp)); setLoading(false);
  }

  function showT(msg:string){ setToast(msg); setTimeout(()=>setToast(null),3000); }

  const stats = useMemo(() => ({
    total: factures.reduce((s,f)=>s+f.montant,0),
    paye: factures.filter(f=>f.statut==="Payée").reduce((s,f)=>s+f.montant,0),
    attente: factures.filter(f=>f.statut==="En attente").reduce((s,f)=>s+f.montant,0),
    retard: factures.filter(f=>f.statut==="En retard").reduce((s,f)=>s+f.montant,0),
    nbAttente: factures.filter(f=>f.statut==="En attente").length,
    nbRetard: factures.filter(f=>f.statut==="En retard").length,
  }), [factures]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return factures.filter(f=>
      (!filterStatut || f.statut===filterStatut) &&
      (!filterMember || f.created_by===filterMember) &&
      (!q || f.client.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q) || (f.description||"").toLowerCase().includes(q))
    );
  }, [factures,filterStatut,filterMember,search]);

  const uniqueMembers = [...new Set(factures.map(f=>f.created_by))].filter(Boolean);

  async function save() {
    if (!supabase||!user||!form.client.trim()||form.montant<=0) return;
    setSaving(true);
    const payload = { ...form, created_by:user.nom };
    if (editId) {
      const { data } = await supabase.from("factures").update(payload).eq("id",editId).select().single();
      if (data) setFactures(fs=>fs.map(f=>f.id===editId?data:f));
      showT("Facture mise à jour");
    } else {
      const num = form.numero.trim() || genNum();
      const { data } = await supabase.from("factures").insert([{...payload,numero:num}]).select().single();
      if (data) setFactures(fs=>[data,...fs]);
      showT("Facture créée");
    }
    setShowForm(false); setEditId(null); setForm({...EMPTY}); setSaving(false);
  }

  async function markPaid(id:string) {
    if (!supabase) return;
    await supabase.from("factures").update({statut:"Payée"}).eq("id",id);
    setFactures(fs=>fs.map(f=>f.id===id?{...f,statut:"Payée"}:f));
    showT("Facture marquée comme payée");
  }

  async function changeStatut(id:string, statut:string) {
    if (!supabase) return;
    await supabase.from("factures").update({statut}).eq("id",id);
    setFactures(fs=>fs.map(f=>f.id===id?{...f,statut}:f));
  }

  async function del(id:string) {
    if (!supabase) return;
    await supabase.from("factures").delete().eq("id",id);
    setFactures(fs=>fs.filter(f=>f.id!==id));
    setConfirm(null); showT("Facture supprimée");
  }

  function openEdit(f:Facture) {
    setForm({numero:f.numero,client:f.client,dossier:f.dossier||"",montant:f.montant,description:f.description||"",statut:f.statut,date_echeance:f.date_echeance||""});
    setEditId(f.id); setShowForm(true);
  }

  const taux = stats.total > 0 ? Math.round((stats.paye/stats.total)*100) : 0;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Factures</h1>
          <p className="page-subtitle">Historique · Paiements · Suivi financier</p>
          <div className="gold-line"/>
        </div>
        <button className="btn btn-gold" onClick={()=>{setForm({...EMPTY,numero:genNum()});setEditId(null);setShowForm(true);}}>+ Nouvelle facture</button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:"1rem",marginBottom:"1.5rem"}}>
        {/* Barre de progression CA */}
        <div className="card" style={{gridColumn:"1"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"0.625rem"}}>
            <div>
              <div style={{fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-dim)",marginBottom:"0.2rem"}}>Chiffre d'affaires total</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.75rem",color:"var(--gold)",lineHeight:1}}>{fmt(stats.total)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:"1.1rem",color:"var(--success)"}}>{taux}% encaissé</div>
              <div style={{fontSize:"0.7rem",color:"var(--text-dim)"}}>Taux de recouvrement</div>
            </div>
          </div>
          <div style={{background:"var(--surface)",borderRadius:99,height:10,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${taux}%`,background:"linear-gradient(90deg,var(--success),var(--gold))",borderRadius:99,transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"0.4rem"}}>
            <span style={{fontSize:"0.68rem",color:"var(--success)"}}>Payé: {fmt(stats.paye)}</span>
            <span style={{fontSize:"0.68rem",color:"var(--warning)"}}>Attente: {fmt(stats.attente)}</span>
            <span style={{fontSize:"0.68rem",color:"var(--danger)"}}>Retard: {fmt(stats.retard)}</span>
          </div>
        </div>

        {[
          {label:"En attente",  value:stats.nbAttente, amount:stats.attente,  color:"var(--warning)", icon:"⏳", statut:"En attente"},
          {label:"En retard",   value:stats.nbRetard,  amount:stats.retard,   color:"var(--danger)",  icon:"🔴", statut:"En retard"},
          {label:"Payées",      value:factures.filter(f=>f.statut==="Payée").length, amount:stats.paye, color:"var(--success)", icon:"✅", statut:"Payée"},
          {label:"Total",       value:factures.length, amount:stats.total,    color:"var(--text-dim)",icon:"📋", statut:""},
        ].map(s=>(
          <button key={s.label} onClick={()=>setFilterStatut(filterStatut===s.statut?"":s.statut)} style={{background:"var(--card)",border:`1px solid ${filterStatut===s.statut?s.color+"40":"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"1rem",cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s"}}>
            <div style={{fontSize:"0.62rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--text-dim)",marginBottom:"0.25rem"}}>{s.label}</div>
            <div style={{fontWeight:700,fontSize:"1.25rem",color:s.color,marginBottom:"0.1rem"}}>{s.value}</div>
            <div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>{fmt(s.amount)}</div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
        <div className="search-bar" style={{flex:1,minWidth:200}}>
          <span className="search-icon">🔍</span>
          <input placeholder="Client, numéro, description…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer"}}>×</button>}
        </div>
        <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
          {["","En attente","Payée","En retard","Annulée"].map(s=>(
            <button key={s||"all"} onClick={()=>setFilterStatut(s)} style={{padding:"0.3rem 0.75rem",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:filterStatut===s?700:400,background:filterStatut===s?(s?STATUT_COLORS[s]+"18":"var(--gold-muted)"):"var(--surface)",border:`1px solid ${filterStatut===s?(s?STATUT_COLORS[s]+"40":"rgba(196,179,137,0.4)"):"var(--border)"}`,color:filterStatut===s?(s?STATUT_COLORS[s]:"var(--gold)"):"var(--text-muted)"}}>
              {s?`${STATUT_ICONS[s]} ${s}`:"Toutes"}
            </button>
          ))}
        </div>
        <select value={filterMember} onChange={e=>setFilterMember(e.target.value)} style={{width:"auto",minWidth:140}}>
          <option value="">Tous les avocats</option>
          {uniqueMembers.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>

      <div style={{fontSize:"0.75rem",color:"var(--text-dim)",marginBottom:"0.75rem"}}>
        {filtered.length} facture{filtered.length!==1?"s":""} · {fmt(filtered.reduce((s,f)=>s+f.montant,0))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">Chargement…</div></div>
      ) : filtered.length===0 ? (
        <div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">Aucune facture</div></div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
          {filtered.map(f=>{
            const col = STATUT_COLORS[f.statut]||"var(--text-dim)";
            const isOverdue = f.statut==="En attente" && f.date_echeance && new Date(f.date_echeance)<new Date();
            return (
              <div key={f.id} style={{background:"var(--card)",border:`1px solid ${isOverdue?"rgba(239,68,68,0.3)":"var(--border)"}`,borderRadius:"var(--radius-lg)",padding:"0.875rem 1.25rem",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.3rem",flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontSize:"0.72rem",color:"var(--text-dim)",fontWeight:600}}>{f.numero}</span>
                    <span style={{fontWeight:700,fontSize:"0.9rem"}}>{f.client}</span>
                    {isOverdue&&<span style={{fontSize:"0.6rem",padding:"0.08rem 0.35rem",borderRadius:999,background:"rgba(239,68,68,0.12)",color:"var(--danger)",fontWeight:700}}>ÉCHU</span>}
                    <span style={{marginLeft:"auto",fontSize:"0.65rem",color:"var(--text-dim)",flexShrink:0}}>{f.created_by} · {dateStr(f.created_at)}</span>
                  </div>
                  <div style={{display:"flex",gap:"1rem",fontSize:"0.75rem",color:"var(--text-dim)",flexWrap:"wrap"}}>
                    {f.description&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:300}}>{f.description}</span>}
                    {f.dossier&&<span>📁 {f.dossier}</span>}
                    {f.date_echeance&&<span>📅 Échéance: {dateStr(f.date_echeance)}</span>}
                  </div>
                </div>

                <div style={{display:"flex",alignItems:"center",gap:"0.875rem",flexShrink:0}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.2rem",color:"var(--gold)"}}>{fmt(f.montant)}</div>
                    <span style={{fontSize:"0.68rem",padding:"0.1rem 0.45rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,fontWeight:600}}>{STATUT_ICONS[f.statut]} {f.statut}</span>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:"0.3rem"}}>
                    {f.statut!=="Payée"&&f.statut!=="Annulée"&&(
                      <button className="btn btn-sm" onClick={()=>markPaid(f.id)} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",color:"var(--success)",fontSize:"0.72rem",padding:"0.25rem 0.625rem"}}>✓ Payée</button>
                    )}
                    <select value={f.statut} onChange={e=>changeStatut(f.id,e.target.value)} style={{fontSize:"0.68rem",padding:"0.2rem 0.35rem",borderRadius:"var(--radius)"}}>
                      {STATUTS.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <div style={{display:"flex",gap:"0.25rem"}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(f)} style={{flex:1,fontSize:"0.65rem",padding:"0.2rem"}}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(f.id)} style={{color:"var(--danger)",flex:1,fontSize:"0.65rem",padding:"0.2rem"}}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editId?"Modifier la facture":"Nouvelle facture"}</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>N° Facture</label><input placeholder="Auto-généré" value={form.numero} onChange={e=>setForm(f=>({...f,numero:e.target.value}))}/></div>
                <div className="form-group">
                  <label>Client *</label>
                  <input list="fac-clients" placeholder="Nom du client" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} autoFocus/>
                  <datalist id="fac-clients">{clients.map(c=><option key={c} value={c}/>)}</datalist>
                </div>
                <div className="form-group"><label>Montant ($) *</label><input type="number" min={0} value={form.montant||""} onChange={e=>setForm(f=>({...f,montant:+e.target.value}))} style={{fontWeight:700}}/></div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>
                    {STATUTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Dossier lié</label><input placeholder="Référence dossier" value={form.dossier} onChange={e=>setForm(f=>({...f,dossier:e.target.value}))}/></div>
                <div className="form-group"><label>Date d'échéance</label><input type="date" value={form.date_echeance} onChange={e=>setForm(f=>({...f,date_echeance:e.target.value}))}/></div>
              </div>
              <div className="form-group" style={{marginBottom:0}}>
                <label>Description / Prestations</label>
                <textarea rows={3} placeholder="Détail des prestations, chefs d'inculpation, honoraires…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving||!form.client.trim()||form.montant<=0} style={{opacity:saving?0.7:1}}>
                {saving?"Enregistrement…":editId?"Mettre à jour":"Créer la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm&&(<div className="confirm-overlay"><div className="confirm-box"><div className="confirm-icon">⚠️</div><div className="confirm-title">Supprimer cette facture ?</div><div className="confirm-msg">Action irréversible.</div><div className="confirm-actions"><button className="btn btn-outline" onClick={()=>setConfirm(null)}>Annuler</button><button className="btn btn-danger" onClick={()=>del(confirm)}>Supprimer</button></div></div></div>)}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
