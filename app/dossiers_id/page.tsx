"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import jsPDF from "jspdf";

const DOCUMENTS_DEFAUT = [
  "Pièce d'identité du client",
  "Procès-verbal d'arrestation",
  "Rapport de police",
  "Témoignages / déclarations",
  "Preuves matérielles (photos, vidéos)",
  "Casier judiciaire à jour",
  "Mandat / ordonnance",
  "Convocation officielle",
];

// Code pénal simplifié pour la picklist
import { CHEFS_PENAL, type ChefPenal } from "@/lib/code-penal";

const EVENT_TYPES = [
  { key:"note",      label:"Note",            icon:"📝", color:"var(--text-muted)" },
  { key:"audience",  label:"Audience",        icon:"⚖️", color:"var(--gold)" },
  { key:"document",  label:"Document reçu",  icon:"📄", color:"var(--info)" },
  { key:"decision",  label:"Décision",        icon:"🔨", color:"#a855f7" },
  { key:"contact",   label:"Contact client", icon:"📞", color:"var(--success)" },
  { key:"alerte",    label:"Alerte",          icon:"⚠️", color:"var(--danger)" },
];

function renderWithMentions(text: string) {
  const parts = text.split(/(@[\p{L}\d]+(?:\s[\p{L}\d]+)?)/gu);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return <span key={i} style={{ color:"var(--info)", fontWeight:600, background:"rgba(99,102,241,0.1)", padding:"0 0.2rem", borderRadius:4 }}>{part}</span>;
    }
    return part;
  });
}

const CAT_COLORS: Record<string,string> = {
  "Contravention": "#64748b",
  "Délit mineur":  "#f59e0b",
  "Délit majeur":  "#ef4444",
  "Crime":         "#7c3aed",
};

interface Dossier {
  id:string; reference:string; client:string; type_affaire:string;
  type_client:string; risque:string; montant:number; statut:string;
  notes:string; created_at:string; created_by:string; audience_id?:string;
}
interface Chef { id:string; code:string; infraction:string; categorie:string; amende:string; detention:string; }
interface Event { id:string; type:string; contenu:string; created_by:string; created_at:string; }
interface Document { id:string; label:string; obtenu:boolean; }
interface Audience { id:string; titre:string; date:string; heure:string; }


export default function DossierDetailPage() {
  const params = useParams();
  const user = getUser();
  const id = params?.id as string;

  const [dossier, setDossier] = useState<Dossier|null>(null);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [audiencesList, setAudiencesList] = useState<Audience[]>([]);
  const [membersList, setMembersList] = useState<string[]>([]);
  const [linkedAudience, setLinkedAudience] = useState<Audience|null>(null);
  const [loading, setLoading] = useState(true);

  // Edit dossier
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Dossier>>({});
  const [saving, setSaving] = useState(false);

  // Stratégie défense (champ notes enrichi)
  const [strategie, setStrategie] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const strategieTimer = useRef<NodeJS.Timeout|null>(null);

  function handleStrategieChange(val: string) {
    setStrategie(val);
    setAutoSaved(false);
    if (strategieTimer.current) clearTimeout(strategieTimer.current);
    strategieTimer.current = setTimeout(async () => {
      if (!supabase) return;
      await supabase.from("dossiers").update({ notes: val }).eq("id", id);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 2500);
  }

  // Chefs inculpation
  const [showChefPicker, setShowChefPicker] = useState(false);
  const [chefSearch, setChefSearch] = useState("");

  // Timeline
  const [newEvent, setNewEvent] = useState("");
  const [newEventType, setNewEventType] = useState("note");
  const [addingEvent, setAddingEvent] = useState(false);

  // Documents
  const [newDocLabel, setNewDocLabel] = useState("");
  const [showDocPicker, setShowDocPicker] = useState(false);

  // Audience link
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);

  // Export
  const [showExport, setShowExport] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [{ data:d }, { data:c }, { data:e }, { data:doc }, { data:aud }, { data:mem }] = await Promise.all([
      supabase.from("dossiers").select("*").eq("id",id).single(),
      supabase.from("dossier_chefs").select("*").eq("dossier_id",id).order("created_at"),
      supabase.from("dossier_events").select("*").eq("dossier_id",id).order("created_at",{ascending:false}),
      supabase.from("dossier_documents").select("*").eq("dossier_id",id).order("created_at"),
      supabase.from("audiences").select("id,titre,date,heure").order("date"),
      supabase.from("membres").select("nom"),
    ]);
    if (d) {
      setDossier(d); setEditForm(d); setStrategie(d.notes||"");
      if (d.audience_id && aud) {
        const found = aud.find((a:Audience) => a.id === d.audience_id);
        setLinkedAudience(found || null);
      }
    }
    setChefs(c||[]);
    setEvents(e||[]);
    setDocuments(doc||[]);
    setAudiencesList(aud||[]);
    setMembersList((mem||[]).map((m:any)=>m.nom));
    setLoading(false);
  }

  async function saveDossier() {
    if (!supabase||!dossier) return;
    setSaving(true);
    await supabase.from("dossiers").update(editForm).eq("id",id);
    setDossier({...dossier,...editForm} as Dossier);
    setEditMode(false);
    setSaving(false);
  }

  async function addChef(chef: typeof CHEFS_PENAL[0]) {
    if (!supabase) return;
    const { data } = await supabase.from("dossier_chefs").insert([{
      dossier_id:id, code:chef.code, infraction:chef.infraction,
      categorie:chef.categorie, amende:chef.amende, detention:chef.detention,
    }]).select().single();
    if (data) setChefs(c=>[...c,data]);
    setShowChefPicker(false);
  }

  async function removeChef(chefId:string) {
    if (!supabase) return;
    await supabase.from("dossier_chefs").delete().eq("id",chefId);
    setChefs(c=>c.filter(x=>x.id!==chefId));
  }

  async function addEvent() {
    if (!supabase||!user||!newEvent.trim()) return;
    setAddingEvent(true);
    const { data } = await supabase.from("dossier_events").insert([{
      dossier_id:id, type:newEventType, contenu:newEvent.trim(), created_by:user.nom,
    }]).select().single();
    if (data) setEvents(e=>[data,...e]);
    setNewEvent("");
    setAddingEvent(false);
  }

  async function deleteEvent(evtId:string) {
    if (!supabase) return;
    await supabase.from("dossier_events").delete().eq("id",evtId);
    setEvents(e=>e.filter(x=>x.id!==evtId));
  }

  // ─── DOCUMENTS ──────────────────────────────────────────────────────────────
  async function addDocument(label:string) {
    if (!supabase || !label.trim()) return;
    const { data } = await supabase.from("dossier_documents").insert([{
      dossier_id:id, label:label.trim(), obtenu:false,
    }]).select().single();
    if (data) setDocuments(d=>[...d,data]);
    setNewDocLabel("");
    setShowDocPicker(false);
  }

  async function toggleDocument(docId:string, current:boolean) {
    if (!supabase) return;
    await supabase.from("dossier_documents").update({ obtenu: !current }).eq("id", docId);
    setDocuments(d => d.map(x => x.id===docId ? {...x, obtenu: !current} : x));
  }

  async function removeDocument(docId:string) {
    if (!supabase) return;
    await supabase.from("dossier_documents").delete().eq("id", docId);
    setDocuments(d => d.filter(x => x.id !== docId));
  }

  // ─── AUDIENCE LINK ──────────────────────────────────────────────────────────
  async function linkAudience(aud: Audience | null) {
    if (!supabase) return;
    await supabase.from("dossiers").update({ audience_id: aud?.id || null }).eq("id", id);
    setLinkedAudience(aud);
    setShowAudiencePicker(false);
  }

  // ─── EXPORT TEXTE ───────────────────────────────────────────────────────────
  function generateExportText(): string {
    if (!dossier) return "";
    const lines = [
      `═══════════════════════════════════════`,
      `DOSSIER ${dossier.reference}`,
      `═══════════════════════════════════════`,
      ``,
      `Client : ${dossier.client}`,
      `Type d'affaire : ${dossier.type_affaire}`,
      `Type client : ${dossier.type_client}`,
      `Risque : ${dossier.risque}`,
      `Statut : ${dossier.statut}`,
      `Honoraires : ${dossier.montant ? dossier.montant.toLocaleString("fr-FR")+" $" : "—"}`,
      `Créé par : ${dossier.created_by}`,
      ``,
    ];
    if (linkedAudience) {
      lines.push(`AUDIENCE LIÉE`, `${linkedAudience.titre} — ${new Date(linkedAudience.date+"T12:00:00").toLocaleDateString("fr-FR")}${linkedAudience.heure?" à "+linkedAudience.heure:""}`, ``);
    }
    if (chefs.length > 0) {
      lines.push(`CHEFS D'INCULPATION (${chefs.length})`);
      chefs.forEach(c => lines.push(`  • [${c.code}] ${c.infraction} — ${c.amende}${c.detention&&c.detention!=="—"?` / ${c.detention}`:""}`));
      lines.push(`  Total amende max : ${amendeTotal.toLocaleString("fr-FR")} $`, ``);
    }
    if (documents.length > 0) {
      lines.push(`PIÈCES (${documents.filter(d=>d.obtenu).length}/${documents.length})`);
      documents.forEach(d => lines.push(`  [${d.obtenu?"x":" "}] ${d.label}`));
      lines.push(``);
    }
    if (strategie.trim()) {
      lines.push(`STRATÉGIE DE DÉFENSE`, strategie.trim(), ``);
    }
    if (events.length > 0) {
      lines.push(`TIMELINE (${events.length} événements)`);
      events.slice().reverse().forEach(e => {
        lines.push(`  ${new Date(e.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})} — [${e.type}] ${e.contenu} (par ${e.created_by})`);
      });
    }
    lines.push(``, `═══════════════════════════════════════`, `Cabinet BullHead — généré le ${new Date().toLocaleDateString("fr-FR")}`);
    return lines.join("\n");
  }

  function copyExport() {
    navigator.clipboard.writeText(generateExportText());
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }

  function exportPDF() {
    if (!dossier) return;
    const doc = new jsPDF();
    const gold: [number,number,number] = [201,168,76];
    const dark: [number,number,number] = [20,22,28];
    let y = 20;

    // Header bandeau noir/or
    doc.setFillColor(...dark);
    doc.rect(0, 0, 210, 32, "F");
    doc.setTextColor(...gold);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("CABINET BULLHEAD", 14, 16);
    doc.setFontSize(8);
    doc.setTextColor(180,180,180);
    doc.setFont("helvetica", "normal");
    doc.text("Law · Finance · Property", 14, 23);
    doc.setTextColor(...gold);
    doc.setFontSize(10);
    doc.text(dossier.reference, 196, 16, { align:"right" });
    doc.setTextColor(160,160,160);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("fr-FR"), 196, 23, { align:"right" });

    y = 42;
    doc.setTextColor(20,20,20);

    function section(title:string) {
      doc.setFont("helvetica","bold"); doc.setFontSize(11);
      doc.setTextColor(...gold);
      doc.text(title.toUpperCase(), 14, y);
      doc.setDrawColor(...gold); doc.setLineWidth(0.3);
      doc.line(14, y+1.5, 196, y+1.5);
      y += 8;
      doc.setTextColor(20,20,20); doc.setFont("helvetica","normal"); doc.setFontSize(9);
    }
    function line(label:string, value:string) {
      doc.setFont("helvetica","bold"); doc.text(label+" :", 14, y);
      doc.setFont("helvetica","normal");
      doc.text(value||"—", 60, y);
      y += 6;
    }
    function checkPage() { if (y > 270) { doc.addPage(); y = 20; } }

    section("Informations générales");
    line("Client", dossier.client);
    line("Type d'affaire", dossier.type_affaire);
    line("Type client", dossier.type_client);
    line("Risque", dossier.risque);
    line("Statut", dossier.statut);
    line("Honoraires", dossier.montant ? fmt(dossier.montant) : "—");
    line("Créé par", dossier.created_by);
    y += 3;

    if (linkedAudience) {
      checkPage(); section("Audience liée");
      line("Titre", linkedAudience.titre);
      line("Date", new Date(linkedAudience.date+"T12:00:00").toLocaleDateString("fr-FR") + (linkedAudience.heure?` à ${linkedAudience.heure}`:""));
      y += 3;
    }

    if (chefs.length > 0) {
      checkPage(); section(`Chefs d'inculpation (${chefs.length})`);
      chefs.forEach(c => {
        checkPage();
        doc.setFont("helvetica","bold"); doc.text(`[${c.code}]`, 14, y);
        doc.setFont("helvetica","normal");
        doc.text(c.infraction, 32, y);
        doc.text(c.amende||"—", 165, y);
        y += 5.5;
      });
      doc.setFont("helvetica","bold");
      doc.text(`Amende maximale cumulée : ${fmt(amendeTotal)}`, 14, y+2);
      y += 9;
    }

    if (documents.length > 0) {
      checkPage(); section(`Pièces (${documents.filter(d=>d.obtenu).length}/${documents.length})`);
      documents.forEach(d => {
        checkPage();
        doc.text(d.obtenu ? "[x]" : "[ ]", 14, y);
        doc.text(d.label, 24, y);
        y += 5.5;
      });
      y += 3;
    }

    if (strategie.trim()) {
      checkPage(); section("Stratégie de défense");
      const split = doc.splitTextToSize(strategie.trim(), 180);
      split.forEach((l:string) => { checkPage(); doc.text(l, 14, y); y += 5; });
      y += 3;
    }

    if (events.length > 0) {
      checkPage(); section(`Timeline (${events.length})`);
      events.slice().reverse().forEach(e => {
        checkPage();
        doc.setFont("helvetica","bold");
        doc.text(new Date(e.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}), 14, y);
        doc.setFont("helvetica","normal");
        const txt = doc.splitTextToSize(`[${e.type}] ${e.contenu} (par ${e.created_by})`, 150);
        doc.text(txt, 38, y);
        y += 5.5 * txt.length;
      });
    }

    doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.text(`Cabinet BullHead — Document généré le ${new Date().toLocaleDateString("fr-FR")}`, 105, 290, { align:"center" });

    doc.save(`${dossier.reference}.pdf`);
  }

  if (loading) return <div className="page-container"><div style={{color:"var(--text-dim)"}}>Chargement…</div></div>;
  if (!dossier) return <div className="page-container"><div style={{color:"var(--danger)"}}>Dossier introuvable</div></div>;

  const RISQUE_COLORS:Record<string,string> = {Aucun:"#64748b",Faible:"#22c55e",Moyen:"#f59e0b",Élevé:"#ef4444",Extrême:"#7c3aed"};
  const STATUT_COLORS:Record<string,string> = {Ouvert:"var(--info)","En cours":"var(--warning)",Clôturé:"var(--text-dim)",Gagné:"var(--success)",Perdu:"var(--danger)"};
  const amendeTotal = chefs.reduce((s,c) => { const n=parseInt(c.amende?.replace(/[^0-9]/g,"")||"0"); return s+n; }, 0);

  // Calcul auto honoraires : tarifs cabinet par catégorie × modificateur risque
  const TARIFS_HONORAIRES: Record<string,number> = { "Contravention":1500, "Délit mineur":3000, "Délit majeur":8000, "Crime":15000 };
  const MOD_RISQUE_DOSSIER: Record<string,number> = { Aucun:1.0, Faible:1.15, Moyen:1.3, Élevé:1.5, Extrême:1.8 };
  const honorairesBase = chefs.reduce((s,c) => s + (TARIFS_HONORAIRES[c.categorie]||0), 0);
  const honorairesSuggeres = Math.round(honorairesBase * (MOD_RISQUE_DOSSIER[dossier.risque]||1));

  const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
  const dateStr = (d:string) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
  const timeStr = (d:string) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  const filteredChefs = CHEFS_PENAL.filter(c =>
    !chefs.some(x=>x.code===c.code) &&
    (c.infraction.toLowerCase().includes(chefSearch.toLowerCase()) || c.code.toLowerCase().includes(chefSearch.toLowerCase()))
  );

  return (
    <div className="page-container">
      <a className="back-link" href="/dossiers">← Retour aux dossiers</a>

      {/* Header */}
      <div className="page-header">
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.375rem",flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontSize:"0.875rem",color:"var(--gold)",background:"var(--gold-muted)",
              padding:"0.2rem 0.6rem",borderRadius:6,border:"1px solid rgba(201,168,76,0.25)"}}>
              {dossier.reference}
            </span>
            <span style={{padding:"0.2rem 0.6rem",borderRadius:999,fontSize:"0.72rem",fontWeight:600,
              background:(RISQUE_COLORS[dossier.risque]||"#64748b")+"18",
              color:RISQUE_COLORS[dossier.risque]||"#64748b",
              border:`1px solid ${(RISQUE_COLORS[dossier.risque]||"#64748b")}30`}}>
              Risque {dossier.risque}
            </span>
            <span style={{padding:"0.2rem 0.6rem",borderRadius:999,fontSize:"0.72rem",fontWeight:600,
              background:(STATUT_COLORS[dossier.statut]||"var(--text-dim)")+"18",
              color:STATUT_COLORS[dossier.statut]||"var(--text-dim)",
              border:`1px solid ${(STATUT_COLORS[dossier.statut]||"var(--text-dim)")}30`}}>
              {dossier.statut}
            </span>
          </div>
          <h1 className="page-title">{dossier.client}</h1>
          <p className="page-subtitle">{dossier.type_affaire} · {dossier.type_client} · {dateStr(dossier.created_at)}</p>
          <div className="gold-line" />
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          {!editMode
            ? <button className="btn btn-outline btn-sm" onClick={()=>setEditMode(true)}>✏️ Modifier</button>
            : <>
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditMode(false)}>Annuler</button>
              <button className="btn btn-gold btn-sm" onClick={saveDossier} disabled={saving}>{saving?"…":"Sauvegarder"}</button>
            </>
          }
        </div>
      </div>

      {/* Edit inline */}
      {editMode && (
        <div className="card" style={{marginBottom:"1.5rem",borderColor:"rgba(201,168,76,0.3)"}}>
          <div className="section-title" style={{marginBottom:"1rem"}}>Modifier le dossier</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.875rem"}}>
            {[
              {label:"Risque",key:"risque",type:"select",opts:["Aucun","Faible","Moyen","Élevé","Extrême"]},
              {label:"Statut",key:"statut",type:"select",opts:["Ouvert","En cours","Clôturé","Gagné","Perdu"]},
              {label:"Montant ($)",key:"montant",type:"number"},
              {label:"Type d'affaire",key:"type_affaire",type:"select",opts:["Défense pénale","Appel / Expungement","Droit civil","Adoption","Divorce","Contrat","Conseil juridique","Autre"]},
              {label:"Type client",key:"type_client",type:"select",opts:["Indépendant","Gang","PF","Famille","Petit frappe"]},
            ].map(f=>(
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                {f.type==="select"
                  ? <select value={(editForm as any)[f.key]||""} onChange={e=>setEditForm(ef=>({...ef,[f.key]:e.target.value}))}>
                      {f.opts?.map(o=><option key={o}>{o}</option>)}
                    </select>
                  : <input type={f.type} value={(editForm as any)[f.key]||""} onChange={e=>setEditForm(ef=>({...ef,[f.key]:e.target.value}))} />
                }
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:"1.5rem"}}>

        {/* ─── COLONNE GAUCHE ─── */}
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

          {/* Chefs d'inculpation */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <div>
                <div className="section-title">Chefs d'inculpation</div>
                {chefs.length>0 && amendeTotal>0 && (
                  <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>
                    Amende maximale cumulée : <span style={{color:"var(--danger)",fontWeight:600}}>{fmt(amendeTotal)}</span>
                  </div>
                )}
              </div>
              <button className="btn btn-gold btn-sm" onClick={()=>setShowChefPicker(true)}>+ Ajouter</button>
            </div>

            {chefs.length===0 ? (
              <div style={{textAlign:"center",padding:"1.5rem 0",color:"var(--text-dim)",fontSize:"0.825rem"}}>
                Aucun chef d'inculpation — cliquez sur + Ajouter
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {chefs.map(c=>{
                  const col = CAT_COLORS[c.categorie]||"#64748b";
                  return (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:"0.75rem",
                      padding:"0.7rem 0.875rem",borderRadius:"var(--radius)",background:"var(--surface)",
                      border:`1px solid ${col}25`,borderLeft:`3px solid ${col}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.15rem"}}>
                          <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:col,
                            background:col+"15",padding:"0.1rem 0.4rem",borderRadius:4}}>{c.code}</span>
                          <span style={{fontWeight:600,fontSize:"0.825rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.infraction}</span>
                        </div>
                        <div style={{display:"flex",gap:"1rem",fontSize:"0.72rem",color:"var(--text-dim)"}}>
                          {c.amende&&<span>💰 {c.amende}</span>}
                          {c.detention&&c.detention!=="—"&&<span>⏱ {c.detention}</span>}
                        </div>
                      </div>
                      <span style={{fontSize:"0.7rem",padding:"0.15rem 0.5rem",borderRadius:999,
                        background:col+"15",color:col,border:`1px solid ${col}30`,flexShrink:0}}>{c.categorie}</span>
                      <button className="btn btn-ghost btn-sm" onClick={()=>removeChef(c.id)}
                        style={{color:"var(--danger)",padding:"0.2rem 0.4rem",flexShrink:0}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Honoraires suggérés selon chefs */}
            {chefs.length > 0 && honorairesSuggeres > 0 && (
              <div style={{marginTop:"1rem",padding:"0.875rem 1rem",background:"var(--gold-muted)",
                border:"1px solid rgba(201,168,76,0.3)",borderRadius:"var(--radius)",
                display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"0.5rem"}}>
                <div>
                  <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.15rem"}}>Honoraires suggérés</div>
                  <div style={{fontWeight:700,color:"var(--gold)",fontSize:"1.05rem"}}>{fmt(honorairesSuggeres)}</div>
                  <div style={{fontSize:"0.68rem",color:"var(--text-dim)"}}>Base {fmt(honorairesBase)} × risque {dossier.risque} ({(MOD_RISQUE_DOSSIER[dossier.risque]||1).toFixed(2)})</div>
                </div>
                <button className="btn btn-gold btn-sm" onClick={async()=>{
                  if(!supabase) return;
                  await supabase.from("dossiers").update({montant:honorairesSuggeres}).eq("id",id);
                  setDossier(d=>d?{...d,montant:honorairesSuggeres}:d);
                }}>
                  Appliquer au dossier
                </button>
              </div>
            )}
          </div>

          {/* Stratégie de défense */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}>
              <div className="section-title">Stratégie de défense</div>
              <span style={{ fontSize:"0.7rem", color: autoSaved ? "var(--success)" : "var(--text-dim)", transition:"color 0.2s" }}>
                {autoSaved ? "✓ Sauvegardé" : "Auto-save activé"}
              </span>
            </div>
            <textarea
              rows={8}
              placeholder="Arguments clés, axes de défense, vices de procédure identifiés, témoins, preuves à contester…"
              value={strategie}
              onChange={e=>handleStrategieChange(e.target.value)}
              style={{width:"100%",resize:"vertical",fontFamily:"'Inter',sans-serif",lineHeight:1.7}}
            />
            <div style={{ textAlign:"right", fontSize:"0.68rem", color:"var(--text-dim)", marginTop:"0.3rem" }}>
              {strategie.length} caractère{strategie.length!==1?"s":""}
            </div>
          </div>

          {/* Documents / Pièces */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}>
              <div>
                <div className="section-title">Pièces à fournir</div>
                {documents.length>0 && (
                  <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>
                    {documents.filter(d=>d.obtenu).length}/{documents.length} obtenue{documents.filter(d=>d.obtenu).length!==1?"s":""}
                  </div>
                )}
              </div>
              <button className="btn btn-gold btn-sm" onClick={()=>setShowDocPicker(true)}>+ Ajouter</button>
            </div>

            {documents.length===0 ? (
              <div style={{textAlign:"center",padding:"1rem 0",color:"var(--text-dim)",fontSize:"0.825rem"}}>
                Aucune pièce listée
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem"}}>
                {documents.map(doc=>(
                  <div key={doc.id} style={{display:"flex",alignItems:"center",gap:"0.625rem",
                    padding:"0.55rem 0.75rem",borderRadius:"var(--radius)",
                    background:doc.obtenu?"rgba(34,197,94,0.06)":"var(--surface)",
                    border:`1px solid ${doc.obtenu?"rgba(34,197,94,0.2)":"var(--border)"}`}}>
                    <button onClick={()=>toggleDocument(doc.id,doc.obtenu)} style={{
                      width:20,height:20,borderRadius:6,flexShrink:0,cursor:"pointer",
                      background:doc.obtenu?"var(--success)":"transparent",
                      border:`1.5px solid ${doc.obtenu?"var(--success)":"var(--border-light)"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#08090d",fontSize:"0.7rem",fontWeight:700,
                    }}>{doc.obtenu?"✓":""}</button>
                    <span style={{flex:1,fontSize:"0.825rem",
                      color:doc.obtenu?"var(--text-dim)":"var(--text)",
                      textDecoration:doc.obtenu?"line-through":"none"}}>{doc.label}</span>
                    <button onClick={()=>removeDocument(doc.id)} style={{
                      background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)",
                      fontSize:"0.85rem",flexShrink:0,
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── COLONNE DROITE — TIMELINE ─── */}
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>

          {/* Infos rapides */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Informations</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
              {[
                {label:"Client",value:dossier.client},
                {label:"Type d'affaire",value:dossier.type_affaire},
                {label:"Type client",value:dossier.type_client},
                {label:"Honoraires",value:dossier.montant?`${dossier.montant.toLocaleString("fr-FR")} $`:"—"},
                {label:"Créé par",value:dossier.created_by||"—"},
              ].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",paddingBottom:"0.4rem",borderBottom:"1px solid var(--border)"}}>
                  <span style={{color:"var(--text-dim)"}}>{r.label}</span>
                  <span style={{fontWeight:500,color:"var(--text)"}}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Audience liée */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.875rem"}}>
              <div className="section-title">Audience liée</div>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowAudiencePicker(true)}>
                {linkedAudience?"Changer":"+ Lier"}
              </button>
            </div>
            {linkedAudience ? (
              <a href="/audiences" style={{textDecoration:"none"}}>
                <div style={{padding:"0.75rem",borderRadius:"var(--radius)",background:"var(--gold-muted)",
                  border:"1px solid rgba(201,168,76,0.3)"}}>
                  <div style={{fontWeight:600,fontSize:"0.85rem",color:"var(--gold)",marginBottom:"0.2rem"}}>{linkedAudience.titre}</div>
                  <div style={{fontSize:"0.75rem",color:"var(--text-dim)"}}>
                    📅 {new Date(linkedAudience.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"})}
                    {linkedAudience.heure&&` à ${linkedAudience.heure}`}
                  </div>
                </div>
              </a>
            ) : (
              <div style={{textAlign:"center",padding:"1rem 0",color:"var(--text-dim)",fontSize:"0.8rem"}}>
                Aucune audience liée
              </div>
            )}
          </div>

          {/* Export */}
          <button className="btn btn-outline" onClick={()=>setShowExport(true)} style={{width:"100%",justifyContent:"center"}}>
            📄 Exporter le résumé
          </button>

          {/* Nouveau événement */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Ajouter un événement</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.35rem",marginBottom:"0.75rem"}}>
              {EVENT_TYPES.map(t=>(
                <button key={t.key} onClick={()=>setNewEventType(t.key)} style={{
                  padding:"0.25rem 0.6rem",borderRadius:999,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",fontSize:"0.72rem",
                  fontWeight:newEventType===t.key?700:400,
                  background:newEventType===t.key?t.color+"20":"var(--surface)",
                  border:`1px solid ${newEventType===t.key?t.color+"50":"var(--border)"}`,
                  color:newEventType===t.key?t.color:"var(--text-dim)",
                  transition:"all 0.1s",
                }}>{t.icon} {t.label}</button>
              ))}
            </div>
            <textarea rows={2} placeholder="Décrivez l'événement… (tapez @ pour mentionner)" value={newEvent}
              onChange={e=>setNewEvent(e.target.value)}
              style={{width:"100%",marginBottom:"0.5rem",resize:"none"}} />
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem", marginBottom:"0.625rem" }}>
              {["RAS","Relance client envoyée","En attente de retour client","Dossier transmis au procureur","Audience reportée"].map(t => (
                <button key={t} onClick={()=>setNewEvent(t)} style={{
                  padding:"0.2rem 0.55rem", borderRadius:999, cursor:"pointer",
                  background:"var(--surface)", border:"1px solid var(--border)",
                  fontSize:"0.68rem", color:"var(--text-dim)", fontFamily:"'Inter',sans-serif",
                }}>{t}</button>
              ))}
              {membersList.filter(m=>m!==user?.nom).map(m => (
                <button key={m} onClick={()=>setNewEvent(ev => ev + (ev?" ":"") + "@"+m+" ")} style={{
                  padding:"0.2rem 0.55rem", borderRadius:999, cursor:"pointer",
                  background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)",
                  fontSize:"0.68rem", color:"var(--info)", fontFamily:"'Inter',sans-serif",
                }}>@{m}</button>
              ))}
            </div>
            <button className="btn btn-gold btn-sm" style={{width:"100%",justifyContent:"center"}}
              onClick={addEvent} disabled={addingEvent||!newEvent.trim()}>
              {addingEvent?"Ajout…":"+ Ajouter à la timeline"}
            </button>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="section-title" style={{marginBottom:"0.875rem"}}>Timeline ({events.length})</div>
            {events.length===0 ? (
              <div style={{textAlign:"center",color:"var(--text-dim)",fontSize:"0.8rem",padding:"1rem 0"}}>
                Aucun événement enregistré
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
                {events.map((e,i)=>{
                  const t = EVENT_TYPES.find(x=>x.key===e.type)||EVENT_TYPES[0];
                  return (
                    <div key={e.id} style={{display:"flex",gap:"0.75rem",position:"relative"}}>
                      {/* Ligne verticale */}
                      {i<events.length-1 && (
                        <div style={{position:"absolute",left:11,top:24,bottom:0,width:2,background:"var(--border)"}}/>
                      )}
                      {/* Dot */}
                      <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,marginTop:2,
                        background:t.color+"20",border:`2px solid ${t.color}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:"0.6rem",zIndex:1}}>
                        {t.icon}
                      </div>
                      <div style={{flex:1,paddingBottom:"1rem"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.2rem"}}>
                          <span style={{fontSize:"0.72rem",fontWeight:600,color:t.color}}>{t.label}</span>
                          <div style={{display:"flex",gap:"0.25rem",alignItems:"center"}}>
                            <span style={{fontSize:"0.65rem",color:"var(--text-dim)"}}>{timeStr(e.created_at)}</span>
                            <button onClick={()=>deleteEvent(e.id)} style={{
                              background:"none",border:"none",cursor:"pointer",color:"var(--text-dim)",
                              fontSize:"0.75rem",padding:"0 0.2rem",lineHeight:1,
                              transition:"color 0.1s",
                            }} onMouseEnter={el=>el.currentTarget.style.color="var(--danger)"}
                              onMouseLeave={el=>el.currentTarget.style.color="var(--text-dim)"}>×</button>
                          </div>
                        </div>
                        <div style={{fontSize:"0.8rem",color:"var(--text-muted)",lineHeight:1.55}}>{renderWithMentions(e.contenu)}</div>
                        <div style={{fontSize:"0.68rem",color:"var(--text-dim)",marginTop:"0.15rem"}}>par {e.created_by}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal picker chefs */}
      {showChefPicker && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowChefPicker(false)}>
          <div className="modal modal-lg" style={{maxHeight:"80vh"}}>
            <div className="modal-header">
              <h2 className="modal-title">Ajouter un chef d'inculpation</h2>
              <button className="modal-close" onClick={()=>setShowChefPicker(false)}>×</button>
            </div>
            <div style={{padding:"1rem 1.5rem"}}>
              <input placeholder="Rechercher une infraction ou un code…"
                value={chefSearch} onChange={e=>setChefSearch(e.target.value)}
                autoFocus style={{width:"100%",marginBottom:"1rem"}} />
              <div style={{display:"flex",flexDirection:"column",gap:"0.35rem",maxHeight:"50vh",overflowY:"auto"}}>
                {["Contravention","Délit mineur","Délit majeur","Crime"].map(cat=>{
                  const items = filteredChefs.filter(c=>c.categorie===cat);
                  if (items.length===0) return null;
                  return (
                    <div key={cat}>
                      <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.1em",
                        color:CAT_COLORS[cat],fontWeight:700,padding:"0.5rem 0 0.3rem",
                        position:"sticky",top:0,background:"var(--card)"}}>{cat}</div>
                      {items.map(c=>(
                        <button key={c.code} onClick={()=>addChef(c)} style={{
                          display:"flex",alignItems:"center",justifyContent:"space-between",
                          width:"100%",padding:"0.6rem 0.75rem",borderRadius:"var(--radius)",
                          background:"var(--surface)",border:"1px solid var(--border)",
                          cursor:"pointer",marginBottom:"0.25rem",fontFamily:"'Inter',sans-serif",
                          transition:"border-color 0.1s",
                          textAlign:"left",
                        }}
                          onMouseEnter={el=>{el.currentTarget.style.borderColor=CAT_COLORS[cat];}}
                          onMouseLeave={el=>{el.currentTarget.style.borderColor="var(--border)";}}>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                              <span style={{fontFamily:"monospace",fontSize:"0.7rem",color:CAT_COLORS[cat],
                                background:CAT_COLORS[cat]+"15",padding:"0.1rem 0.4rem",borderRadius:4}}>{c.code}</span>
                              <span style={{fontSize:"0.825rem",fontWeight:500,color:"var(--text)"}}>{c.infraction}</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:"0.75rem",fontSize:"0.72rem",color:"var(--text-dim)",flexShrink:0}}>
                            <span>💰 {c.amende}</span>
                            {c.detention!=="—"&&<span>⏱ {c.detention}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                {filteredChefs.length===0&&(
                  <div style={{textAlign:"center",color:"var(--text-dim)",padding:"2rem"}}>Aucun résultat</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pièces */}
      {showDocPicker && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowDocPicker(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Ajouter une pièce</h2>
              <button className="modal-close" onClick={()=>setShowDocPicker(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nom de la pièce</label>
                <input placeholder="Ex : Témoignage de..." value={newDocLabel}
                  onChange={e=>setNewDocLabel(e.target.value)} autoFocus
                  onKeyDown={e=>e.key==="Enter"&&addDocument(newDocLabel)}/>
              </div>
              <div style={{fontSize:"0.72rem",color:"var(--text-dim)",marginBottom:"0.5rem"}}>Suggestions courantes</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem"}}>
                {DOCUMENTS_DEFAUT.filter(d=>!documents.some(x=>x.label===d)).map(d=>(
                  <button key={d} onClick={()=>addDocument(d)} style={{
                    padding:"0.35rem 0.7rem",borderRadius:999,cursor:"pointer",
                    background:"var(--surface)",border:"1px solid var(--border)",
                    fontSize:"0.75rem",color:"var(--text-muted)",fontFamily:"'Inter',sans-serif",
                  }}>+ {d}</button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowDocPicker(false)}>Fermer</button>
              <button className="btn btn-gold" onClick={()=>addDocument(newDocLabel)} disabled={!newDocLabel.trim()}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal audience picker */}
      {showAudiencePicker && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAudiencePicker(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Lier une audience</h2>
              <button className="modal-close" onClick={()=>setShowAudiencePicker(false)}>×</button>
            </div>
            <div className="modal-body">
              {linkedAudience && (
                <button className="btn btn-danger btn-sm" onClick={()=>linkAudience(null)} style={{marginBottom:"0.75rem"}}>
                  Délier l'audience actuelle
                </button>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:"0.4rem",maxHeight:"50vh",overflowY:"auto"}}>
                {audiencesList.length===0 ? (
                  <div style={{textAlign:"center",color:"var(--text-dim)",padding:"1.5rem"}}>Aucune audience planifiée</div>
                ) : audiencesList.map(a=>(
                  <button key={a.id} onClick={()=>linkAudience(a)} style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"0.65rem 0.875rem",borderRadius:"var(--radius)",
                    background:linkedAudience?.id===a.id?"var(--gold-muted)":"var(--surface)",
                    border:`1px solid ${linkedAudience?.id===a.id?"rgba(201,168,76,0.4)":"var(--border)"}`,
                    cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",
                  }}>
                    <span style={{fontSize:"0.85rem",fontWeight:500}}>{a.titre}</span>
                    <span style={{fontSize:"0.75rem",color:"var(--text-dim)"}}>
                      {new Date(a.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}{a.heure&&` ${a.heure}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal export */}
      {showExport && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowExport(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Exporter le résumé</h2>
              <button className="modal-close" onClick={()=>setShowExport(false)}>×</button>
            </div>
            <div className="modal-body">
              <pre style={{whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"monospace",
                fontSize:"0.78rem",color:"var(--text-muted)",lineHeight:1.6,
                background:"var(--surface)",borderRadius:"var(--radius)",padding:"1.25rem",
                maxHeight:"55vh",overflowY:"auto"}}>{generateExportText()}</pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setShowExport(false)}>Fermer</button>
              <button className="btn btn-outline" onClick={exportPDF}>📄 Télécharger PDF</button>
              <button className="btn btn-gold" onClick={copyExport}>
                {exportCopied?"✅ Copié !":"📋 Copier le texte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
