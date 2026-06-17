"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Modele {
  id: string;
  titre: string;
  type: string;
  contenu: string;
  created_by: string;
  created_at: string;
}

const TYPES = ["Plaidoirie","Conclusions","Demande de nullité","Requête","Lettre au client","Autre"];

const TEMPLATES_DEFAUT = [
  {
    titre: "Demande de nullité — Vice Miranda",
    type: "Demande de nullité",
    contenu: `Maître [Nom de l'avocat], au nom de [Nom du client],

DEMANDE DE NULLITÉ DE PROCÉDURE

Fondement : Violation des droits Miranda — Article 41 & 42 du Code de Procédure Pénale

Faits :
Mon client a été arrêté le [date] à [heure] par [matricule des agents]. Les droits Miranda ont été [non lus / lus tardivement / incomplets].

Moyens soulevés :
• Dépassement du délai de 15 minutes pour la lecture des droits (Art. 41 CPP)
• [Autre vice de procédure]

En conséquence, je sollicite l'annulation de l'ensemble de la procédure et la mise en liberté immédiate de mon client.

Fait à Los Santos, le [date]
Cabinet Varelli — Seul Dieu peut juger`,
  },
  {
    titre: "Plaidoirie — Défense pénale standard",
    type: "Plaidoirie",
    contenu: `Mesdames et Messieurs les membres de cette cour,

Mon client, [Nom du client], comparaît aujourd'hui devant vous accusé de [chefs d'inculpation].

Je souhaite, avant toute chose, rappeler un principe fondamental de notre droit : la présomption d'innocence. Mon client est innocent jusqu'à preuve du contraire.

Sur les faits :
[Exposé des faits de la défense]

Sur le droit :
[Argumentation juridique]

Sur les circonstances atténuantes :
[Éléments favorables au client]

En conclusion, je vous demande de bien vouloir [relaxer / requalifier / atténuer la peine de] mon client.

La justice, dans sa sagesse, saura distinguer la vérité.

Maître Marco Varelli
Cabinet Varelli — Los Santos`,
  },
  {
    titre: "Requête d'expungement",
    type: "Requête",
    contenu: `REQUÊTE EN EFFACEMENT DE CASIER JUDICIAIRE

Demandeur : [Nom du client]
Représenté par : Maître Marco Varelli, Cabinet Varelli

À l'attention du Tribunal de Los Santos,

Par la présente, je sollicite l'effacement du casier judiciaire de mon client pour les motifs suivants :

1. [Chef à effacer] — condamnation datant du [date]
2. Bonne conduite depuis lors
3. [Autres motifs]

Fondement légal : [Article applicable]

Documents joints :
□ Extrait de casier judiciaire
□ Justificatifs de bonne conduite
□ [Autres pièces]

Je me tiens à disposition pour tout renseignement complémentaire.

Maître Marco Varelli
Cabinet Varelli`,
  },
];

export default function ModelesPage() {
  const user = getUser();
  const [modeles, setModeles] = useState<Modele[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Modele|null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre:"", type:"Plaidoirie", contenu:"" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const { data } = await supabase.from("modeles").select("*")
      .eq("created_by", user.nom).order("created_at", { ascending: false });
    setModeles(data || []);
    setLoading(false);
  }

  async function save() {
    if (!supabase || !user || !form.titre.trim()) return;
    setSaving(true);
    if (editMode && selected) {
      await supabase.from("modeles").update(form).eq("id", selected.id);
      setModeles(m => m.map(x => x.id===selected.id ? {...x,...form} : x));
      setSelected(prev => prev ? {...prev,...form} : null);
    } else {
      const { data } = await supabase.from("modeles").insert([{...form, created_by:user.nom}]).select().single();
      if (data) { setModeles(m => [data,...m]); setSelected(data); }
    }
    setSaving(false);
    setShowForm(false);
    setEditMode(false);
    showT("Modèle sauvegardé");
  }

  async function saveDefault(t: typeof TEMPLATES_DEFAUT[0]) {
    if (!supabase || !user) return;
    const { data } = await supabase.from("modeles").insert([{...t, created_by:user.nom}]).select().single();
    if (data) { setModeles(m => [data,...m]); setSelected(data); }
    showT("Template importé");
  }

  async function deleteModele(id:string) {
    if (!supabase) return;
    await supabase.from("modeles").delete().eq("id", id);
    setModeles(m => m.filter(x=>x.id!==id));
    if (selected?.id===id) setSelected(null);
    showT("Modèle supprimé");
  }

  function copyContent() {
    if (!selected) return;
    navigator.clipboard.writeText(selected.contenu);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function showT(msg:string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const filtered = modeles.filter(m =>
    (!search || m.titre.toLowerCase().includes(search.toLowerCase()) || m.contenu.toLowerCase().includes(search.toLowerCase())) &&
    (!filterType || m.type === filterType)
  );

  const TYPE_COLORS: Record<string,string> = {
    "Plaidoirie":"var(--gold)", "Conclusions":"var(--info)", "Demande de nullité":"var(--danger)",
    "Requête":"#a855f7", "Lettre au client":"var(--success)", "Autre":"var(--text-dim)",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Modèles de plaidoirie</h1>
          <p className="page-subtitle">Bibliothèque de templates juridiques</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({titre:"",type:"Plaidoirie",contenu:""}); setEditMode(false); setShowForm(true); }}>
          + Nouveau modèle
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:"1.5rem" }}>

        {/* ─── LISTE ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>

          {/* Templates par défaut si aucun modèle */}
          {modeles.length === 0 && !loading && (
            <div className="card" style={{ borderColor:"rgba(201,168,76,0.2)" }}>
              <div className="section-title" style={{ marginBottom:"0.75rem" }}>Templates de démarrage</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                {TEMPLATES_DEFAUT.map((t,i) => (
                  <button key={i} onClick={() => saveDefault(t)} style={{
                    textAlign:"left", padding:"0.6rem 0.75rem", borderRadius:"var(--radius)",
                    background:"var(--surface)", border:"1px solid var(--border)",
                    cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"border-color 0.1s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                    <div style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text)", marginBottom:"0.15rem" }}>{t.titre}</div>
                    <div style={{ fontSize:"0.7rem", color:TYPE_COLORS[t.type]||"var(--text-dim)" }}>{t.type}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtres */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
            <input placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)} />
            <select value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="">Tous les types</option>
              {TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Liste modèles */}
          {loading ? (
            <div style={{ color:"var(--text-dim)", fontSize:"0.8rem" }}>Chargement…</div>
          ) : filtered.length === 0 && modeles.length > 0 ? (
            <div style={{ color:"var(--text-dim)", fontSize:"0.8rem", textAlign:"center", padding:"1rem" }}>Aucun résultat</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
              {filtered.map(m => (
                <div key={m.id} onClick={() => setSelected(m)} style={{
                  padding:"0.75rem",
                  borderRadius:"var(--radius)",
                  background: selected?.id===m.id ? "var(--gold-muted)" : "var(--card)",
                  border:`1px solid ${selected?.id===m.id ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                  cursor:"pointer", transition:"all 0.12s",
                  borderLeft:`3px solid ${TYPE_COLORS[m.type]||"var(--border)"}`,
                }}>
                  <div style={{ fontWeight:600, fontSize:"0.825rem", marginBottom:"0.2rem",
                    color:selected?.id===m.id?"var(--gold)":"var(--text)",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{m.titre}</div>
                  <div style={{ fontSize:"0.7rem", color:TYPE_COLORS[m.type]||"var(--text-dim)" }}>{m.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── APERÇU ─── */}
        <div>
          {!selected ? (
            <div className="card" style={{ textAlign:"center", padding:"4rem 2rem" }}>
              <div style={{ fontSize:"2rem", marginBottom:"1rem", opacity:0.3 }}>📄</div>
              <div style={{ color:"var(--text-dim)", fontSize:"0.875rem" }}>
                Sélectionnez un modèle pour le consulter
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1rem" }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.1rem", fontWeight:700, marginBottom:"0.25rem" }}>
                    {selected.titre}
                  </div>
                  <span style={{ fontSize:"0.72rem", padding:"0.15rem 0.5rem", borderRadius:999,
                    background:(TYPE_COLORS[selected.type]||"var(--text-dim)")+"18",
                    color:TYPE_COLORS[selected.type]||"var(--text-dim)",
                    border:`1px solid ${(TYPE_COLORS[selected.type]||"var(--text-dim)")}30` }}>
                    {selected.type}
                  </span>
                </div>
                <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
                  <button className="btn btn-outline btn-sm" onClick={copyContent}>
                    {copied ? "✅ Copié !" : "📋 Copier"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm({titre:selected.titre,type:selected.type,contenu:selected.contenu}); setEditMode(true); setShowForm(true); }}>
                    ✏️
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteModele(selected.id)}>🗑️</button>
                </div>
              </div>

              <div style={{ height:1, background:"var(--border)", marginBottom:"1rem" }} />

              <pre style={{
                whiteSpace:"pre-wrap", wordBreak:"break-word",
                fontFamily:"'Inter',sans-serif", fontSize:"0.825rem",
                color:"var(--text-muted)", lineHeight:1.75,
                background:"var(--surface)", borderRadius:"var(--radius)",
                padding:"1.25rem", maxHeight:"60vh", overflowY:"auto",
              }}>{selected.contenu}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">{editMode?"Modifier le modèle":"Nouveau modèle"}</h2>
              <button className="modal-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Titre *</label>
                  <input placeholder="Ex : Plaidoirie de défense" value={form.titre} onChange={e=>setForm(f=>({...f,titre:e.target.value}))} autoFocus />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Contenu</label>
                <textarea rows={16} value={form.contenu}
                  onChange={e=>setForm(f=>({...f,contenu:e.target.value}))}
                  placeholder="Rédigez votre modèle… Utilisez [crochets] pour les zones à remplir."
                  style={{ fontFamily:"'Inter',sans-serif", lineHeight:1.7 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving||!form.titre.trim()} style={{opacity:saving?0.7:1}}>
                {saving?"Sauvegarde…":"Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">✅ {toast}</div>
        </div>
      )}
    </div>
  );
}
