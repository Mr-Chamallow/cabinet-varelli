"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Client {
  id: string; nom_rp: string; telephone: string; organisation: string;
  email: string; discord: string; notes: string; statut: string;
  blacklist: boolean; created_by: string; created_at: string;
  total_facture: number; total_paye: number; total_restant: number;
}
interface Dossier { id:string; reference:string; type_affaire:string; statut:string; created_at:string; created_by:string; }
interface Facture { id:string; numero:string; montant:number; statut:string; created_at:string; }
interface CasierEntry { id:string; infraction:string; categorie:string; date_condamnation:string; amende_prononcee:string; }

const STATUTS = ["Actif","Inactif","VIP","Suspect"];
const STATUT_COLORS: Record<string,string> = { Actif:"var(--success)", Inactif:"var(--text-dim)", VIP:"var(--gold)", Suspect:"var(--danger)" };
const CAT_COLORS: Record<string,string> = { Contravention:"#64748b","Délit mineur":"#f59e0b","Délit majeur":"#ef4444",Crime:"#7c3aed" };
const STATUT_DOSSIER: Record<string,string> = { Ouvert:"var(--info)","En cours":"var(--warning)",Clôturé:"var(--text-dim)",Gagné:"var(--success)",Perdu:"var(--danger)",Condamné:"#7c3aed" };
const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
const dateStr = (s:string) => s ? new Date(s+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const EMPTY_FORM = { nom_rp:"", telephone:"", organisation:"", email:"", discord:"", notes:"", statut:"Actif", blacklist:false };

export default function ClientsPage() {
  const user = getUser();
  const [clients, setClients]     = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client|null>(null);
  const [clientTab, setClientTab] = useState<"info"|"dossiers"|"factures"|"casier">("info");
  const [dossiers, setDossiers]   = useState<Dossier[]>([]);
  const [factures, setFactures]   = useState<Facture[]>([]);
  const [casier, setCasier]       = useState<CasierEntry[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState<string|null>(null);
  const [toast, setToast]         = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("clients").select("*").order("nom_rp");
    setClients(data || []); setLoading(false);
  }

  async function openClient(c: Client) {
    setSelectedClient(c); setClientTab("info");
    if (!supabase) return;
    const [{ data:d },{ data:f },{ data:cas }] = await Promise.all([
      supabase.from("dossiers").select("id,reference,type_affaire,statut,created_at,created_by").eq("client", c.nom_rp).order("created_at",{ascending:false}),
      supabase.from("factures").select("id,numero,montant,statut,created_at").eq("client", c.nom_rp).order("created_at",{ascending:false}),
      supabase.from("casier").select("id,infraction,categorie,date_condamnation,amende_prononcee").eq("client_nom", c.nom_rp).order("date_condamnation",{ascending:false}),
    ]);
    setDossiers(d||[]); setFactures(f||[]); setCasier(cas||[]);
  }

  async function saveClient() {
    if (!supabase || !user || !form.nom_rp.trim()) return;
    setSaving(true);
    if (editMode && selectedClient) {
      const { data } = await supabase.from("clients").update(form).eq("id",selectedClient.id).select().single();
      if (data) { setClients(cs=>cs.map(c=>c.id===selectedClient.id?data:c)); setSelectedClient(data); }
    } else {
      const { data } = await supabase.from("clients").insert([{...form,created_by:user.nom}]).select().single();
      if (data) { setClients(cs=>[data,...cs]); }
    }
    setShowForm(false); setEditMode(false); showT(editMode?"Client mis à jour":"Client créé");
    setSaving(false);
  }

  async function deleteClient(id:string) {
    if (!supabase) return;
    await supabase.from("clients").delete().eq("id",id);
    setClients(cs=>cs.filter(c=>c.id!==id));
    setSelectedClient(null); setConfirm(null); showT("Client supprimé");
  }

  async function toggleBlacklist(c:Client) {
    if (!supabase) return;
    await supabase.from("clients").update({blacklist:!c.blacklist}).eq("id",c.id);
    const updated = {...c,blacklist:!c.blacklist};
    setClients(cs=>cs.map(x=>x.id===c.id?updated:x));
    setSelectedClient(updated);
  }

  function showT(msg:string){ setToast(msg); setTimeout(()=>setToast(null),3000); }

  const filtered = useMemo(() => clients.filter(c =>
    (showBlacklist ? c.blacklist : !c.blacklist) &&
    (!filterStatut || c.statut===filterStatut) &&
    (!search || c.nom_rp.toLowerCase().includes(search.toLowerCase()) || (c.organisation||"").toLowerCase().includes(search.toLowerCase()))
  ), [clients,search,filterStatut,showBlacklist]);

  const stats = useMemo(() => ({
    total: clients.length,
    actifs: clients.filter(c=>c.statut==="Actif"&&!c.blacklist).length,
    vip: clients.filter(c=>c.statut==="VIP").length,
    blacklist: clients.filter(c=>c.blacklist).length,
  }), [clients]);

  const totalFacturesClient = useMemo(() => ({
    total: factures.reduce((s,f)=>s+f.montant,0),
    paye: factures.filter(f=>f.statut==="Payée").reduce((s,f)=>s+f.montant,0),
    attente: factures.filter(f=>f.statut==="En attente").reduce((s,f)=>s+f.montant,0),
  }), [factures]);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Registre complet · {clients.length} client{clients.length!==1?"s":""} enregistrés</p>
          <div className="gold-line"/>
        </div>
        <button className="btn btn-gold" onClick={()=>{setForm({...EMPTY_FORM});setEditMode(false);setShowForm(true);}}>+ Nouveau client</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{marginBottom:"1.5rem"}}>
        {[
          {label:"Total clients",  value:stats.total,     icon:"👥", color:"var(--gold)"},
          {label:"Clients actifs", value:stats.actifs,    icon:"✓",  color:"var(--success)"},
          {label:"VIP",           value:stats.vip,        icon:"⭐", color:"var(--gold)"},
          {label:"Blacklist",     value:stats.blacklist,  icon:"⛔", color:"var(--danger)"},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:"1.25rem",alignItems:"start"}}>

        {/* ── LISTE ── */}
        <div>
          {/* Filtres */}
          <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",marginBottom:"0.875rem"}}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input placeholder="Nom RP, organisation…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer"}}>×</button>}
            </div>
            <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap"}}>
              <select value={filterStatut} onChange={e=>setFilterStatut(e.target.value)} style={{flex:1,minWidth:100}}>
                <option value="">Tous statuts</option>
                {STATUTS.map(s=><option key={s}>{s}</option>)}
              </select>
              <button onClick={()=>setShowBlacklist(!showBlacklist)} style={{padding:"0.35rem 0.75rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.75rem",fontWeight:showBlacklist?700:400,background:showBlacklist?"rgba(239,68,68,0.12)":"var(--surface)",border:`1px solid ${showBlacklist?"rgba(239,68,68,0.3)":"var(--border)"}`,color:showBlacklist?"var(--danger)":"var(--text-muted)"}}>
                ⛔ Blacklist
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">Chargement…</div></div>
          ) : filtered.length===0 ? (
            <div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">Aucun client trouvé</div></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"0.375rem"}}>
              {filtered.map(c=>{
                const isSelected = selectedClient?.id===c.id;
                const col = STATUT_COLORS[c.statut]||"var(--text-dim)";
                return (
                  <button key={c.id} onClick={()=>openClient(c)} style={{
                    display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 0.875rem",
                    borderRadius:"var(--radius-lg)",background:isSelected?"var(--gold-muted)":"var(--card)",
                    border:`1px solid ${isSelected?"rgba(196,179,137,0.4)":"var(--border)"}`,
                    cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s",
                    width:"100%",
                  }}>
                    <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:col+"15",border:`1px solid ${col}30`,fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1rem",color:col}}>
                      {c.nom_rp.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        <span style={{fontWeight:600,fontSize:"0.85rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nom_rp}</span>
                        {c.blacklist&&<span style={{fontSize:"0.58rem",padding:"0.05rem 0.3rem",borderRadius:999,background:"rgba(239,68,68,0.12)",color:"var(--danger)",flexShrink:0}}>BL</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"0.4rem"}}>
                        {c.organisation&&<span style={{fontSize:"0.65rem",color:"var(--text-dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.organisation}</span>}
                        <span style={{fontSize:"0.62rem",padding:"0.05rem 0.35rem",borderRadius:999,background:col+"15",color:col,marginLeft:"auto",flexShrink:0}}>{c.statut}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── PROFIL ── */}
        {selectedClient ? (
          <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            {/* Header profil */}
            <div className="card" style={{border:`1px solid ${STATUT_COLORS[selectedClient.statut]||"var(--border)"}30`}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"1rem",marginBottom:"1rem"}}>
                <div style={{width:52,height:52,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:(STATUT_COLORS[selectedClient.statut]||"var(--gold)")+"15",border:`2px solid ${(STATUT_COLORS[selectedClient.statut]||"var(--gold)")}30`,fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.4rem",color:STATUT_COLORS[selectedClient.statut]||"var(--gold)"}}>
                  {selectedClient.nom_rp.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem",flexWrap:"wrap"}}>
                    <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.2rem",margin:0}}>{selectedClient.nom_rp}</h2>
                    {selectedClient.blacklist&&<span style={{fontSize:"0.65rem",padding:"0.1rem 0.5rem",borderRadius:999,background:"rgba(239,68,68,0.12)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.3)",fontWeight:700}}>⛔ BLACKLIST</span>}
                    <span style={{fontSize:"0.72rem",padding:"0.12rem 0.55rem",borderRadius:999,background:(STATUT_COLORS[selectedClient.statut]||"var(--text-dim)")+"15",color:STATUT_COLORS[selectedClient.statut]||"var(--text-dim)",border:`1px solid ${(STATUT_COLORS[selectedClient.statut]||"var(--text-dim)")}30`,fontWeight:600}}>{selectedClient.statut}</span>
                  </div>
                  {selectedClient.organisation&&<div style={{fontSize:"0.78rem",color:"var(--text-dim)"}}>{selectedClient.organisation}</div>}
                </div>
                <div style={{display:"flex",gap:"0.35rem",flexShrink:0}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>{setForm({nom_rp:selectedClient.nom_rp,telephone:selectedClient.telephone||"",organisation:selectedClient.organisation||"",email:selectedClient.email||"",discord:selectedClient.discord||"",notes:selectedClient.notes||"",statut:selectedClient.statut,blacklist:selectedClient.blacklist});setEditMode(true);setShowForm(true);}}>✏️ Modifier</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toggleBlacklist(selectedClient)} style={{color:selectedClient.blacklist?"var(--success)":"var(--danger)"}}>
                    {selectedClient.blacklist?"✓ Retirer BL":"⛔ Blacklist"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(selectedClient.id)} style={{color:"var(--danger)"}}>🗑️</button>
                </div>
              </div>

              {/* Stats client */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.625rem"}}>
                {[
                  {l:"Dossiers",v:String(dossiers.length),c:"var(--info)"},
                  {l:"CA total",v:fmt(totalFacturesClient.total),c:"var(--gold)"},
                  {l:"Payé",v:fmt(totalFacturesClient.paye),c:"var(--success)"},
                  {l:"En attente",v:fmt(totalFacturesClient.attente),c:"var(--warning)"},
                  {l:"Condamnations",v:String(casier.length),c:casier.length>=3?"var(--danger)":"var(--text-dim)"},
                  {l:"Client depuis",v:dateStr(selectedClient.created_at),c:"var(--text-dim)"},
                ].map(s=>(
                  <div key={s.l} style={{background:"var(--surface)",borderRadius:"var(--radius)",padding:"0.625rem",textAlign:"center"}}>
                    <div style={{fontWeight:700,fontSize:"0.875rem",color:s.c}}>{s.v}</div>
                    <div style={{fontSize:"0.62rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs profil */}
            <div style={{display:"flex",gap:"0.4rem"}}>
              {([["info","ℹ️ Infos"],["dossiers",`📁 Dossiers (${dossiers.length})`],["factures",`🧾 Factures (${factures.length})`],["casier",`⚖️ Casier (${casier.length})`]] as [string,string][]).map(([k,l])=>(
                <button key={k} onClick={()=>setClientTab(k as any)} style={{padding:"0.4rem 0.875rem",borderRadius:"var(--radius)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:"0.8rem",fontWeight:clientTab===k?700:400,background:clientTab===k?"var(--gold-muted)":"var(--surface)",border:`1px solid ${clientTab===k?"rgba(196,179,137,0.4)":"var(--border)"}`,color:clientTab===k?"var(--gold)":"var(--text-muted)"}}>
                  {l}
                </button>
              ))}
            </div>

            {/* Infos */}
            {clientTab==="info" && (
              <div className="card">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.875rem"}}>
                  {[
                    ["📞 Téléphone",selectedClient.telephone],
                    ["💬 Discord",selectedClient.discord],
                    ["✉️ Email",selectedClient.email],
                    ["🏢 Organisation",selectedClient.organisation],
                  ].map(([l,v])=>(
                    <div key={l as string}>
                      <div style={{fontSize:"0.65rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.25rem"}}>{l}</div>
                      <div style={{fontSize:"0.875rem",color:v?"var(--text)":"var(--text-dim)",fontStyle:v?"normal":"italic"}}>{v||"Non renseigné"}</div>
                    </div>
                  ))}
                </div>
                {selectedClient.notes&&(
                  <div style={{marginTop:"1rem",paddingTop:"1rem",borderTop:"1px solid var(--border)"}}>
                    <div style={{fontSize:"0.65rem",color:"var(--text-dim)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"0.25rem"}}>📝 Notes</div>
                    <div style={{fontSize:"0.82rem",color:"var(--text-muted)",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{selectedClient.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Dossiers */}
            {clientTab==="dossiers" && (
              <div>
                {dossiers.length===0?(<div className="empty-state"><div className="empty-icon">📁</div><div className="empty-title">Aucun dossier</div></div>):(
                  <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                    {dossiers.map(d=>{
                      const col = STATUT_DOSSIER[d.statut]||"var(--text-dim)";
                      return (
                        <a key={d.id} href={`/dossiers/${d.id}`} style={{textDecoration:"none"}}>
                          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between",borderLeft:`3px solid ${col}`}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:"0.85rem",marginBottom:"0.15rem"}}>{d.reference}</div>
                              <div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>{d.type_affaire||"—"} · {dateStr(d.created_at)} · {d.created_by}</div>
                            </div>
                            <span style={{fontSize:"0.72rem",padding:"0.15rem 0.55rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,fontWeight:600,flexShrink:0}}>{d.statut}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Factures */}
            {clientTab==="factures" && (
              <div>
                {factures.length===0?(<div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">Aucune facture</div></div>):(
                  <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                    {factures.map(f=>{
                      const col = f.statut==="Payée"?"var(--success)":f.statut==="En attente"?"var(--warning)":"var(--danger)";
                      return (
                        <div key={f.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div>
                            <div style={{fontWeight:600,fontSize:"0.85rem",marginBottom:"0.15rem"}}>{f.numero}</div>
                            <div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>{dateStr(f.created_at)}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontWeight:700,color:col,fontSize:"0.95rem"}}>{fmt(f.montant)}</div>
                            <span style={{fontSize:"0.65rem",padding:"0.08rem 0.4rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`}}>{f.statut}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Casier */}
            {clientTab==="casier" && (
              <div>
                {casier.length===0?(<div className="empty-state"><div className="empty-icon">⚖️</div><div className="empty-title">Casier vierge</div></div>):(
                  <>
                    {casier.length>=3&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius)",padding:"0.625rem 0.875rem",marginBottom:"0.75rem",fontSize:"0.78rem",color:"var(--danger)",fontWeight:600}}>⚠️ Récidiviste — {casier.length} condamnations</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                      {casier.map(e=>{
                        const col = CAT_COLORS[e.categorie]||"var(--text-dim)";
                        return (
                          <div key={e.id} style={{background:"var(--card)",border:`1px solid ${col}20`,borderRadius:"var(--radius-lg)",padding:"0.75rem 1rem",borderLeft:`3px solid ${col}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.2rem",flexWrap:"wrap"}}>
                              <span style={{fontWeight:600,fontSize:"0.82rem"}}>{e.infraction}</span>
                              <span style={{fontSize:"0.62rem",padding:"0.08rem 0.4rem",borderRadius:999,background:col+"15",color:col,border:`1px solid ${col}25`,fontWeight:600}}>{e.categorie}</span>
                              <span style={{marginLeft:"auto",fontSize:"0.65rem",color:"var(--text-dim)"}}>{dateStr(e.date_condamnation)}</span>
                            </div>
                            {e.amende_prononcee&&<div style={{fontSize:"0.72rem",color:"var(--text-dim)"}}>💰 {e.amende_prononcee}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{alignSelf:"start",padding:"3rem"}}>
            <div className="empty-icon">👤</div>
            <div className="empty-title">Sélectionnez un client</div>
            <p style={{fontSize:"0.82rem",color:"var(--text-dim)",marginTop:"0.5rem",textAlign:"center"}}>Cliquez sur un client dans la liste pour voir son profil complet.</p>
          </div>
        )}
      </div>

      {/* Modal création/édition */}
      {showForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editMode?"Modifier le client":"Nouveau client"}</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Nom RP *</label><input autoFocus placeholder="Ex: Pierre Durand" value={form.nom_rp} onChange={e=>setForm(f=>({...f,nom_rp:e.target.value}))}/></div>
                <div className="form-group"><label>Organisation</label><input placeholder="Ex: Los Santos MC" value={form.organisation} onChange={e=>setForm(f=>({...f,organisation:e.target.value}))}/></div>
                <div className="form-group"><label>Téléphone</label><input placeholder="Ex: 555-0123" value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))}/></div>
                <div className="form-group"><label>Discord</label><input placeholder="Ex: pierre#0001" value={form.discord} onChange={e=>setForm(f=>({...f,discord:e.target.value}))}/></div>
                <div className="form-group"><label>Email</label><input placeholder="Ex: pierre@ls.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))}>
                    {STATUTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{marginBottom:"0.875rem"}}>
                <label>Notes</label>
                <textarea rows={3} placeholder="Informations complémentaires, contexte RP, relations…" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:"0.625rem",cursor:"pointer",padding:"0.5rem 0.75rem",borderRadius:"var(--radius)",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)"}}>
                <input type="checkbox" checked={form.blacklist} onChange={e=>setForm(f=>({...f,blacklist:e.target.checked}))} style={{width:16,height:16}}/>
                <span style={{fontSize:"0.82rem",color:"var(--danger)",fontWeight:500}}>⛔ Ajouter à la blacklist</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={saveClient} disabled={saving||!form.nom_rp.trim()} style={{opacity:saving?0.7:1}}>
                {saving?"Enregistrement…":editMode?"Mettre à jour":"Créer le client"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm&&(<div className="confirm-overlay"><div className="confirm-box"><div className="confirm-icon">⚠️</div><div className="confirm-title">Supprimer ce client ?</div><div className="confirm-msg">Ses dossiers et factures ne seront pas supprimés.</div><div className="confirm-actions"><button className="btn btn-outline" onClick={()=>setConfirm(null)}>Annuler</button><button className="btn btn-danger" onClick={()=>deleteClient(confirm)}>Supprimer</button></div></div></div>)}
      {toast&&<div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
