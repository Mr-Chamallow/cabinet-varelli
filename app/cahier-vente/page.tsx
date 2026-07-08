"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Transaction {
  id: string;
  type: "entrée" | "sortie";
  montant: number;
  categorie: string;
  motif: string;
  produit_nom: string;
  quantite: number;
  type_argent: string;
  created_by: string;
  created_at: string;
}

interface Produit {
  id: string;
  nom: string;
  type: string;
  emoji: string;
  prix_propre: number;
  prix_sale: number;
  actif: boolean;
  ordre: number;
}

interface FormState {
  type: "entrée" | "sortie";
  montant: number;
  categorie: string;
  motif: string;
  produit_nom: string;
  quantite: number;
  type_argent: string;
}

const CATEGORIES_ENTREE = ["Vente drogue","Vente arme","Braquage","Trafic","Extorsion","Service rendu","Autre"];
const CATEGORIES_SORTIE = ["Achat matériel","Achat drogue","Achat arme","Dépense opérationnelle","Paiement membre","Corruption","Amende","Autre"];
const TYPES_ARGENT = ["propre","sale","mixte"];

const fmt = (n: number) => n.toLocaleString("fr-FR", { style:"currency", currency:"USD", maximumFractionDigits:0 });
const fmtDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const EMPTY_FORM: FormState = { type:"entrée", montant:0, categorie:"Vente drogue", motif:"", produit_nom:"", quantite:0, type_argent:"propre" };

export default function CahierVentePage() {
  const user = getUser();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [produits, setProduits]         = useState<Produit[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<"apercu"|"historique"|"saisie"|"produits">("apercu");

  // Filtres historique
  const [filterType, setFilterType]       = useState("");
  const [filterCat, setFilterCat]         = useState("");
  const [filterMember, setFilterMember]   = useState("");
  const [search, setSearch]               = useState("");

  // Formulaire saisie
  const [form, setForm]     = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<string|null>(null);
  const [confirm, setConfirm] = useState<string|null>(null);

  // Produit rapide
  const [produitForm, setProduitForm] = useState({ nom:"", type:"drogue", emoji:"💊", prix_propre:0, prix_sale:0, actif:true, ordre:0 });
  const [editProduitId, setEditProduitId] = useState<string|null>(null);
  const [editProduitForm, setEditProduitForm] = useState<Partial<Produit>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from("cahier_transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("cahier_produits").select("*").order("ordre"),
    ]);
    setTransactions(t || []);
    setProduits(p || []);
    setLoading(false);
  }

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  // ── Stats ──
  const stats = useMemo(() => {
    const entrees = transactions.filter(t => t.type === "entrée").reduce((s, t) => s + t.montant, 0);
    const sorties = transactions.filter(t => t.type === "sortie").reduce((s, t) => s + t.montant, 0);
    const solde = entrees - sorties;
    const mois = new Date(); mois.setDate(1); mois.setHours(0,0,0,0);
    const entresMois  = transactions.filter(t => t.type === "entrée" && new Date(t.created_at) >= mois).reduce((s,t) => s + t.montant, 0);
    const sortiesMois = transactions.filter(t => t.type === "sortie" && new Date(t.created_at) >= mois).reduce((s,t) => s + t.montant, 0);
    return { entrees, sorties, solde, entresMois, sortiesMois };
  }, [transactions]);

  // ── Historique filtré ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t =>
      (!filterType || t.type === filterType) &&
      (!filterCat || t.categorie === filterCat) &&
      (!filterMember || t.created_by === filterMember) &&
      (!q || t.motif.toLowerCase().includes(q) || t.categorie.toLowerCase().includes(q) || t.produit_nom.toLowerCase().includes(q))
    );
  }, [transactions, filterType, filterCat, filterMember, search]);

  // ── Stats par catégorie pour aperçu ──
  const byCategorie = useMemo(() => {
    const map: Record<string, { entree: number; sortie: number }> = {};
    transactions.forEach(t => {
      if (!map[t.categorie]) map[t.categorie] = { entree:0, sortie:0 };
      if (t.type === "entrée") map[t.categorie].entree += t.montant;
      else map[t.categorie].sortie += t.montant;
    });
    return Object.entries(map).sort((a,b) => (b[1].entree + b[1].sortie) - (a[1].entree + a[1].sortie));
  }, [transactions]);

  // ── Saisie rapide depuis produit ──
  function quickSell(p: Produit) {
    setForm({ type:"entrée", montant:p.prix_propre, categorie:"Vente drogue", motif:`Vente de ${p.nom}`, produit_nom:p.nom, quantite:1, type_argent:"propre" });
    setTab("saisie");
  }

  // ── Sauvegarder transaction ──
  async function saveTransaction() {
    if (!supabase || !user || !form.motif.trim() || form.montant <= 0) return;
    setSaving(true);
    const { data } = await supabase.from("cahier_transactions").insert([{
      ...form, created_by: user.nom,
    }]).select().single();
    if (data) { setTransactions(ts => [data, ...ts]); showT("Transaction enregistrée"); setForm({ ...EMPTY_FORM }); setTab("apercu"); }
    setSaving(false);
  }

  async function deleteTransaction(id: string) {
    if (!supabase) return;
    await supabase.from("cahier_transactions").delete().eq("id", id);
    setTransactions(ts => ts.filter(t => t.id !== id));
    setConfirm(null); showT("Supprimé");
  }

  // ── Produits CRUD ──
  async function saveProduit() {
    if (!produitForm.nom.trim() || !supabase) return;
    setSaving(true);
    const { data } = await supabase.from("cahier_produits").insert([{ ...produitForm, ordre: produits.length+1 }]).select().single();
    if (data) { setProduits(ps => [...ps, data]); showT("Produit ajouté"); setProduitForm({ nom:"", type:"drogue", emoji:"💊", prix_propre:0, prix_sale:0, actif:true, ordre:0 }); }
    setSaving(false);
  }

  async function updateProduit(id: string) {
    if (!supabase) return;
    await supabase.from("cahier_produits").update(editProduitForm).eq("id", id);
    setProduits(ps => ps.map(p => p.id === id ? { ...p, ...editProduitForm } as Produit : p));
    setEditProduitId(null); showT("Produit mis à jour");
  }

  async function deleteProduit(id: string) {
    if (!supabase) return;
    await supabase.from("cahier_produits").delete().eq("id", id);
    setProduits(ps => ps.filter(p => p.id !== id));
  }

  const uniqueMembers = [...new Set(transactions.map(t => t.created_by))].filter(Boolean);
  const allCats = [...new Set(transactions.map(t => t.categorie))].filter(Boolean);

  const soldeColor = stats.solde > 0 ? "var(--success)" : stats.solde < 0 ? "var(--danger)" : "var(--text-dim)";

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cahier de vente</h1>
          <p className="page-subtitle">Livre de compte · Entrées & Sorties · Suivi économique du groupe</p>
          <div className="gold-line"/>
        </div>
        <button className="btn btn-gold" onClick={() => setTab("saisie")}>+ Nouvelle transaction</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {([
          ["apercu",    "📊 Aperçu"],
          ["historique","📋 Historique"],
          ["saisie",    "➕ Saisie"],
          ["produits",  "📦 Produits"],
        ] as [string,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k as any)} style={{
            padding:"0.55rem 1.25rem", borderRadius:"var(--radius)", cursor:"pointer",
            fontFamily:"'Inter',sans-serif", fontSize:"0.85rem", fontWeight:tab===k?700:400,
            background:tab===k?"var(--gold-muted)":"var(--surface)",
            border:`1px solid ${tab===k?"rgba(196,179,137,0.4)":"var(--border)"}`,
            color:tab===k?"var(--gold)":"var(--text-muted)", transition:"all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {/* ── APERÇU ── */}
      {tab === "apercu" && (
        <>
          {/* Stats globales */}
          <div className="stat-grid" style={{ marginBottom:"1.5rem" }}>
            {[
              { label:"Solde total",         value:fmt(stats.solde),    color:soldeColor,       icon:"⚖️" },
              { label:"Total entrées",        value:fmt(stats.entrees),  color:"var(--success)", icon:"↑"  },
              { label:"Total sorties",        value:fmt(stats.sorties),  color:"var(--danger)",  icon:"↓"  },
              { label:"Entrées ce mois",      value:fmt(stats.entresMois), color:"var(--gold)",  icon:"📅" },
              { label:"Sorties ce mois",      value:fmt(stats.sortiesMois),color:"var(--warning)","icon":"📅"},
              { label:"Transactions",         value:String(transactions.length), color:"var(--text-muted)", icon:"#" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color:s.color, fontSize:"1.25rem" }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Graphe solde visuel */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1.25rem" }}>
            {/* Répartition par catégorie */}
            <div className="card">
              <div className="section-title" style={{ marginBottom:"0.875rem" }}>Par catégorie</div>
              {byCategorie.length === 0 ? (
                <div style={{ color:"var(--text-dim)", fontSize:"0.8rem", textAlign:"center", padding:"1rem 0" }}>Aucune donnée</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                  {byCategorie.slice(0,8).map(([cat, vals]) => (
                    <div key={cat} style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                      <div style={{ width:90, fontSize:"0.68rem", color:"var(--text-dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }} title={cat}>{cat}</div>
                      <div style={{ flex:1 }}>
                        {vals.entree > 0 && <div style={{ height:5, width:`${(vals.entree/(stats.entrees||1))*100}%`, background:"var(--success)", borderRadius:3, marginBottom:2, minWidth:4 }}/>}
                        {vals.sortie > 0 && <div style={{ height:5, width:`${(vals.sortie/(stats.sorties||1))*100}%`, background:"var(--danger)", borderRadius:3, minWidth:4 }}/>}
                      </div>
                      <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", flexShrink:0, textAlign:"right", minWidth:70 }}>
                        {vals.entree > 0 && <div style={{ color:"var(--success)" }}>+{fmt(vals.entree)}</div>}
                        {vals.sortie > 0 && <div style={{ color:"var(--danger)" }}>-{fmt(vals.sortie)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dernières transactions */}
            <div className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.875rem" }}>
                <div className="section-title" style={{ marginBottom:0 }}>Dernières transactions</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab("historique")}>Voir tout</button>
              </div>
              {transactions.length === 0 ? (
                <div style={{ color:"var(--text-dim)", fontSize:"0.8rem", textAlign:"center", padding:"1rem 0" }}>Aucune transaction</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                  {transactions.slice(0,6).map(t => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.35rem 0.625rem", background:"var(--surface)", borderRadius:"var(--radius)", borderLeft:`3px solid ${t.type==="entrée"?"var(--success)":"var(--danger)"}` }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"0.78rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.motif||t.categorie}</div>
                        <div style={{ fontSize:"0.62rem", color:"var(--text-dim)" }}>{t.created_by} · {fmtDate(t.created_at).split(" ").slice(0,3).join(" ")}</div>
                      </div>
                      <div style={{ fontWeight:700, color:t.type==="entrée"?"var(--success)":"var(--danger)", flexShrink:0, marginLeft:"0.5rem" }}>
                        {t.type==="entrée"?"+":"-"}{fmt(t.montant)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accès rapide produits */}
          {produits.filter(p=>p.actif).length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom:"0.875rem" }}>Vente rapide</div>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                {produits.filter(p=>p.actif).map(p => (
                  <button key={p.id} onClick={() => quickSell(p)} style={{
                    padding:"0.5rem 0.875rem", borderRadius:"var(--radius)", cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:"0.8rem", fontWeight:500,
                    background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text-muted)",
                    display:"flex", alignItems:"center", gap:"0.4rem", transition:"all 0.15s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(196,179,137,0.4)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                    <span>{p.emoji}</span> {p.nom}
                    <span style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>{fmt(p.prix_propre)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORIQUE ── */}
      {tab === "historique" && (
        <>
          {/* Filtres */}
          <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
            <div className="search-bar" style={{ flex:1, minWidth:200 }}>
              <span className="search-icon">🔍</span>
              <input placeholder="Chercher un motif, catégorie…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer" }}>×</button>}
            </div>
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ width:"auto",minWidth:140 }}>
              <option value="">Toutes opérations</option>
              <option value="entrée">Entrées ↑</option>
              <option value="sortie">Sorties ↓</option>
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ width:"auto",minWidth:160 }}>
              <option value="">Toutes catégories</option>
              {allCats.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterMember} onChange={e=>setFilterMember(e.target.value)} style={{ width:"auto",minWidth:150 }}>
              <option value="">Tous les membres</option>
              {uniqueMembers.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ marginBottom:"0.75rem", fontSize:"0.78rem", color:"var(--text-dim)" }}>
            {filtered.length} transaction{filtered.length!==1?"s":""} ·
            <span style={{ color:"var(--success)",marginLeft:"0.3rem" }}>↑ {fmt(filtered.filter(t=>t.type==="entrée").reduce((s,t)=>s+t.montant,0))}</span>
            <span style={{ color:"var(--danger)",marginLeft:"0.3rem" }}>↓ {fmt(filtered.filter(t=>t.type==="sortie").reduce((s,t)=>s+t.montant,0))}</span>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Chargement…</div></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucune transaction</div></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {filtered.map(t => (
                <div key={t.id} style={{
                  background:"var(--card)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius-lg)", padding:"0.75rem 1.125rem",
                  borderLeft:`4px solid ${t.type==="entrée"?"var(--success)":"var(--danger)"}`,
                  display:"flex", alignItems:"center", gap:"1rem",
                }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:t.type==="entrée"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", fontSize:"1rem" }}>
                    {t.type==="entrée"?"↑":"↓"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.2rem", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:600, fontSize:"0.875rem" }}>{t.motif || t.categorie}</span>
                      <span style={{ fontSize:"0.65rem", padding:"0.08rem 0.4rem", borderRadius:999, background:t.type==="entrée"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", color:t.type==="entrée"?"var(--success)":"var(--danger)", border:`1px solid ${t.type==="entrée"?"rgba(34,197,94,0.25)":"rgba(239,68,68,0.25)"}`, fontWeight:600, flexShrink:0 }}>{t.categorie}</span>
                      {t.produit_nom && <span style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>{t.produit_nom}{t.quantite>0?` ×${t.quantite}`:""}</span>}
                      <span style={{ fontSize:"0.65rem", padding:"0.08rem 0.4rem", borderRadius:999, background:"var(--surface)", color:"var(--text-dim)", border:"1px solid var(--border)" }}>{t.type_argent}</span>
                      <span style={{ marginLeft:"auto", fontSize:"0.65rem", color:"var(--text-dim)", flexShrink:0 }}>{t.created_by} · {fmtDate(t.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.1rem", color:t.type==="entrée"?"var(--success)":"var(--danger)", flexShrink:0 }}>
                    {t.type==="entrée"?"+":"-"}{fmt(t.montant)}
                  </div>
                  {t.created_by === user?.nom && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(t.id)} style={{ color:"var(--danger)", flexShrink:0 }}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── SAISIE ── */}
      {tab === "saisie" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
          <div className="card">
            <div className="section-title" style={{ marginBottom:"1rem" }}>Nouvelle transaction</div>

            {/* Type entrée/sortie */}
            <div className="form-group">
              <label>Type d'opération</label>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                {(["entrée","sortie"] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type:t, categorie:t==="entrée"?"Vente drogue":"Achat matériel" }))} style={{
                    flex:1, padding:"0.625rem", borderRadius:"var(--radius)", cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontWeight:form.type===t?700:400, fontSize:"0.875rem",
                    background:form.type===t?(t==="entrée"?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)"):"var(--surface)",
                    border:`1px solid ${form.type===t?(t==="entrée"?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"):"var(--border)"}`,
                    color:form.type===t?(t==="entrée"?"var(--success)":"var(--danger)"):"var(--text-muted)",
                  }}>
                    {t==="entrée"?"↑ Entrée":"↓ Sortie"}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Montant ($) *</label>
              <input type="number" min={0} value={form.montant||""} placeholder="Ex: 50 000"
                onChange={e => setForm(f => ({ ...f, montant:+e.target.value }))}
                style={{ fontSize:"1.1rem", fontWeight:700, color:"var(--text)" }}/>
            </div>

            <div className="form-group">
              <label>Catégorie</label>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie:e.target.value }))}>
                {(form.type==="entrée"?CATEGORIES_ENTREE:CATEGORIES_SORTIE).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Motif / Description *</label>
              <textarea rows={2} placeholder="Ex: Vente 50 unités de cocaïne à Vlad Petrov…" value={form.motif}
                onChange={e => setForm(f => ({ ...f, motif:e.target.value }))}/>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Produit (optionnel)</label>
                <input list="produits-list" placeholder="Ex: Cocaïne" value={form.produit_nom}
                  onChange={e => setForm(f => ({ ...f, produit_nom:e.target.value }))}/>
                <datalist id="produits-list">{produits.map(p => <option key={p.id} value={p.nom}/>)}</datalist>
              </div>
              <div className="form-group">
                <label>Quantité</label>
                <input type="number" min={0} value={form.quantite||""} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, quantite:+e.target.value }))}/>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom:"1.25rem" }}>
              <label>Type d'argent</label>
              <div style={{ display:"flex", gap:"0.35rem" }}>
                {TYPES_ARGENT.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type_argent:t }))} style={{
                    padding:"0.35rem 0.75rem", borderRadius:"var(--radius)", cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:"0.78rem", fontWeight:form.type_argent===t?700:400,
                    background:form.type_argent===t?"var(--gold-muted)":"var(--surface)",
                    border:`1px solid ${form.type_argent===t?"rgba(196,179,137,0.4)":"var(--border)"}`,
                    color:form.type_argent===t?"var(--gold)":"var(--text-muted)",
                  }}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button className="btn btn-outline" onClick={() => setForm({ ...EMPTY_FORM })}>Réinitialiser</button>
              <button className="btn btn-gold" onClick={saveTransaction}
                disabled={saving||!form.motif.trim()||form.montant<=0}
                style={{ flex:1, justifyContent:"center", opacity:saving?0.7:1 }}>
                {saving?"Enregistrement…":"✓ Enregistrer la transaction"}
              </button>
            </div>
          </div>

          {/* Aperçu et produits rapides */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
            {form.montant > 0 && (
              <div className="card" style={{ border:`1px solid ${form.type==="entrée"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)"}` }}>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Aperçu</div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.35rem" }}>
                  <span style={{ color:"var(--text-dim)" }}>Type</span>
                  <span style={{ color:form.type==="entrée"?"var(--success)":"var(--danger)", fontWeight:600 }}>{form.type==="entrée"?"↑ Entrée":"↓ Sortie"}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.35rem" }}>
                  <span style={{ color:"var(--text-dim)" }}>Montant</span>
                  <span style={{ fontWeight:700, color:form.type==="entrée"?"var(--success)":"var(--danger)", fontSize:"1.1rem" }}>{form.type==="entrée"?"+":"-"}{fmt(form.montant)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.35rem" }}>
                  <span style={{ color:"var(--text-dim)" }}>Catégorie</span><span>{form.categorie}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem" }}>
                  <span style={{ color:"var(--text-dim)" }}>Argent</span><span>{form.type_argent}</span>
                </div>
                {form.motif && <div style={{ marginTop:"0.5rem", fontSize:"0.75rem", color:"var(--text-dim)", fontStyle:"italic", borderTop:"1px solid var(--border)", paddingTop:"0.5rem" }}>{form.motif}</div>}
              </div>
            )}

            {produits.filter(p=>p.actif).length > 0 && (
              <div className="card">
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Saisie rapide — Produits</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                  {produits.filter(p=>p.actif).map(p => (
                    <button key={p.id} onClick={() => quickSell(p)} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"0.45rem 0.75rem", borderRadius:"var(--radius)",
                      background:"var(--surface)", border:"1px solid var(--border)", cursor:"pointer",
                      fontFamily:"'Inter',sans-serif",
                    }}>
                      <span style={{ fontSize:"0.82rem" }}>{p.emoji} {p.nom}</span>
                      <div style={{ display:"flex", gap:"0.5rem", fontSize:"0.68rem", color:"var(--text-dim)" }}>
                        <span>Propre: {fmt(p.prix_propre)}</span>
                        {p.prix_sale > 0 && <span>Sale: {fmt(p.prix_sale)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRODUITS ── */}
      {tab === "produits" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"1.5rem" }}>
          <div>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Articles configurés</div>
            {produits.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📦</div><div className="empty-title">Aucun produit configuré</div></div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {produits.map(p => (
                  <div key={p.id} className="card" style={{ opacity:p.actif?1:0.45 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
                      <span style={{ fontSize:"1.25rem", flexShrink:0 }}>{p.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{p.nom}</div>
                        <div style={{ fontSize:"0.68rem", color:"var(--text-dim)" }}>
                          {p.type} · Propre: {fmt(p.prix_propre)} · Sale: {fmt(p.prix_sale)}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"0.35rem", flexShrink:0 }}>
                        {editProduitId !== p.id && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditProduitId(p.id); setEditProduitForm({ nom:p.nom, emoji:p.emoji, prix_propre:p.prix_propre, prix_sale:p.prix_sale, actif:p.actif }); }}>✏️</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteProduit(p.id)} style={{ color:"var(--danger)" }}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                    {editProduitId === p.id && (
                      <div style={{ marginTop:"0.875rem", paddingTop:"0.875rem", borderTop:"1px solid var(--border)" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr 1fr", gap:"0.5rem", marginBottom:"0.5rem" }}>
                          <div className="form-group" style={{ marginBottom:0 }}><label>Emoji</label><input value={editProduitForm.emoji||""} onChange={e=>setEditProduitForm(f=>({...f,emoji:e.target.value}))}/></div>
                          <div className="form-group" style={{ marginBottom:0 }}><label>Nom</label><input value={editProduitForm.nom||""} onChange={e=>setEditProduitForm(f=>({...f,nom:e.target.value}))}/></div>
                          <div className="form-group" style={{ marginBottom:0 }}><label>Prix propre</label><input type="number" value={editProduitForm.prix_propre||0} onChange={e=>setEditProduitForm(f=>({...f,prix_propre:+e.target.value}))}/></div>
                          <div className="form-group" style={{ marginBottom:0 }}><label>Prix sale</label><input type="number" value={editProduitForm.prix_sale||0} onChange={e=>setEditProduitForm(f=>({...f,prix_sale:+e.target.value}))}/></div>
                        </div>
                        <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditProduitId(null)}>Annuler</button>
                          <button className="btn btn-gold btn-sm" onClick={() => updateProduit(p.id)}>Sauvegarder</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ alignSelf:"start" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Ajouter un produit</div>
            <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.625rem" }}>
              <div className="form-group" style={{ width:70, marginBottom:0 }}><label>Emoji</label><input value={produitForm.emoji} onChange={e=>setProduitForm(f=>({...f,emoji:e.target.value}))}/></div>
              <div className="form-group" style={{ flex:1, marginBottom:0 }}><label>Nom *</label><input placeholder="Ex: Cocaïne" value={produitForm.nom} onChange={e=>setProduitForm(f=>({...f,nom:e.target.value}))}/></div>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={produitForm.type} onChange={e=>setProduitForm(f=>({...f,type:e.target.value}))}>
                <option value="drogue">Drogue</option>
                <option value="arme">Arme</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group"><label>Prix propre ($)</label><input type="number" value={produitForm.prix_propre||""} onChange={e=>setProduitForm(f=>({...f,prix_propre:+e.target.value}))}/></div>
              <div className="form-group"><label>Prix sale ($)</label><input type="number" value={produitForm.prix_sale||""} onChange={e=>setProduitForm(f=>({...f,prix_sale:+e.target.value}))}/></div>
            </div>
            <button className="btn btn-gold" onClick={saveProduit} disabled={saving||!produitForm.nom.trim()} style={{ width:"100%", justifyContent:"center" }}>+ Ajouter</button>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette transaction ?</div>
            <div className="confirm-msg">Cette action est irréversible.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => deleteTransaction(confirm)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
