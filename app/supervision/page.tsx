"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser, canAccess, getMemberColor } from "@/lib/auth";

interface MembreStats {
  nom: string;
  couleur: string;
  clients: number;
  dossiers: number;
  dossiersOuverts: number;
  dossiersGagnes: number;
  dossiersPerdus: number;
  factures: number;
  ca: number;
  enAttente: number;
  casiers: number;
  audiences: number;
}

interface ActivityItem {
  type: "casier" | "dossier" | "facture" | "audience" | "client";
  label: string;
  detail: string;
  by: string;
  at: string;
  color: string;
  icon: string;
}

const ACTIVITY_CONFIG: Record<ActivityItem["type"], { icon: string; color: string; label: string }> = {
  casier:   { icon: "⚖️", color: "#7c3aed", label: "Casier"    },
  dossier:  { icon: "📁", color: "#c9a84c", label: "Dossier"   },
  facture:  { icon: "🧾", color: "#22c55e", label: "Facture"   },
  audience: { icon: "🏛️", color: "#3b82f6", label: "Audience"  },
  client:   { icon: "👤", color: "#f97316", label: "Client"    },
};

export default function SupervisionPage() {
  const router = useRouter();
  const user = getUser();
  const [loading, setLoading]       = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats]           = useState<MembreStats[]>([]);
  const [totaux, setTotaux]         = useState({ clients: 0, dossiers: 0, ca: 0, enAttente: 0, casiers: 0, audiences: 0 });
  const [activity, setActivity]     = useState<ActivityItem[]>([]);
  const [caChart, setCaChart]         = useState<{mois:string;total:number}[]>([]);
  const [dossiersTypes, setDossiersTypes] = useState<{type:string;count:number}[]>([]);
  const [actLoading, setActLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState<"stats" | "activite">("stats");
  const [filterMember, setFilterMember] = useState("");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!canAccess(user.role, "admin")) { setAuthorized(false); setLoading(false); return; }
    setAuthorized(true);
    load();
    loadActivity();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const { data: membres } = await supabase.from("membres").select("nom, couleur");
    if (!membres) { setLoading(false); return; }

    const results: MembreStats[] = [];
    let totClients = 0, totDossiers = 0, totCa = 0, totAttente = 0, totCasiers = 0, totAudiences = 0;

    for (const m of membres) {
      const [
        { count: clients },
        { count: dossiers },
        { count: ouverts },
        { count: gagnes },
        { count: perdus },
        { data: factures },
        { count: casiers },
        { count: audiences },
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("created_by", m.nom),
        supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", m.nom),
        supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", m.nom).eq("statut", "Ouvert"),
        supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", m.nom).eq("statut", "Gagné"),
        supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", m.nom).eq("statut", "Perdu"),
        supabase.from("factures").select("montant,statut").eq("created_by", m.nom),
        supabase.from("casier").select("*", { count: "exact", head: true }).eq("created_by", m.nom),
        supabase.from("audiences").select("*", { count: "exact", head: true }).eq("created_by", m.nom),
      ]);

      const ca = (factures || []).filter((f: any) => f.statut === "Payée").reduce((s: number, f: any) => s + f.montant, 0);
      const enAttente = (factures || []).filter((f: any) => f.statut === "En attente").reduce((s: number, f: any) => s + f.montant, 0);

      if ((clients || 0) + (dossiers || 0) + (factures || []).length > 0) {
        results.push({
          nom: m.nom, couleur: m.couleur || getMemberColor(m.nom),
          clients: clients || 0, dossiers: dossiers || 0,
          dossiersOuverts: ouverts || 0, dossiersGagnes: gagnes || 0, dossiersPerdus: perdus || 0,
          factures: (factures || []).length, ca, enAttente,
          casiers: casiers || 0, audiences: audiences || 0,
        });
      }
      totClients += clients || 0; totDossiers += dossiers || 0; totCa += ca; totAttente += enAttente;
      totCasiers += casiers || 0; totAudiences += audiences || 0;
    }

    results.sort((a, b) => b.ca - a.ca);
    setStats(results);
    setTotaux({ clients: totClients, dossiers: totDossiers, ca: totCa, enAttente: totAttente, casiers: totCasiers, audiences: totAudiences });

    // CA chart (6 derniers mois)
    const { data: allFacs } = await supabase.from("factures").select("montant,statut,created_at");
    const moisLabels = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const now = new Date();
    const buckets = Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
      return {mois:moisLabels[d.getMonth()],total:0,year:d.getFullYear(),month:d.getMonth()};
    });
    (allFacs||[]).filter((f:any)=>f.statut==="Payée").forEach((f:any)=>{
      const fd=new Date(f.created_at);
      const b=buckets.find(b=>b.year===fd.getFullYear()&&b.month===fd.getMonth());
      if(b) b.total+=f.montant;
    });
    setCaChart(buckets.map(b=>({mois:b.mois,total:b.total})));

    // Dossiers par type
    const { data: allDoss } = await supabase.from("dossiers").select("type_affaire");
    const typeCount: Record<string,number> = {};
    (allDoss||[]).forEach((d:any)=>{ const t=d.type_affaire||"Autre"; typeCount[t]=(typeCount[t]||0)+1; });
    setDossiersTypes(Object.entries(typeCount).map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count).slice(0,7));
    setLoading(false);
  }

  async function loadActivity() {
    if (!supabase) { setActLoading(false); return; }
    setActLoading(true);

    const [
      { data: casiers },
      { data: dossiers },
      { data: factures },
      { data: audiences },
      { data: clients },
    ] = await Promise.all([
      supabase.from("casier").select("client_nom,infraction,categorie,created_by,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("dossiers").select("reference,client,type_affaire,statut,created_by,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("factures").select("numero,client,montant,statut,created_by,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("audiences").select("titre,client,type,created_by,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("clients").select("nom_rp,type_client,created_by,created_at").order("created_at", { ascending: false }).limit(30),
    ]);

    const items: ActivityItem[] = [
      ...(casiers || []).map((r: any) => ({
        type: "casier" as const, icon: "⚖️", color: "#7c3aed",
        label: r.client_nom, detail: `${r.infraction} (${r.categorie})`,
        by: r.created_by, at: r.created_at,
      })),
      ...(dossiers || []).map((r: any) => ({
        type: "dossier" as const, icon: "📁", color: "#c9a84c",
        label: r.reference, detail: `${r.client} — ${r.type_affaire} · ${r.statut}`,
        by: r.created_by, at: r.created_at,
      })),
      ...(factures || []).map((r: any) => ({
        type: "facture" as const, icon: "🧾", color: "#22c55e",
        label: r.numero || "Facture", detail: `${r.client} — ${(r.montant || 0).toLocaleString("fr-FR")} $ · ${r.statut}`,
        by: r.created_by, at: r.created_at,
      })),
      ...(audiences || []).map((r: any) => ({
        type: "audience" as const, icon: "🏛️", color: "#3b82f6",
        label: r.titre, detail: `${r.type}${r.client ? ` · ${r.client}` : ""}`,
        by: r.created_by, at: r.created_at,
      })),
      ...(clients || []).map((r: any) => ({
        type: "client" as const, icon: "👤", color: "#f97316",
        label: r.nom_rp, detail: `Nouveau client · ${r.type_client || "—"}`,
        by: r.created_by, at: r.created_at,
      })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);

    setActivity(items);
    setActLoading(false);
  }

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const maxCa = Math.max(...stats.map(s => s.ca), 1);

  const uniqueMembers = [...new Set(activity.map(a => a.by))].filter(Boolean).sort();
  const filteredActivity = filterMember ? activity.filter(a => a.by === filterMember) : activity;

  function timeAgo(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    const days = Math.floor(diff / 86400);
    if (days < 7) return `Il y a ${days} j`;
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }

  if (!authorized && !loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Accès réservé</div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Cette page nécessite la permission d'administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Supervision du cabinet</h1>
          <p className="page-subtitle">Activité globale · Statistiques · Journaux · Vue Patron</p>
          <div className="gold-line" />
        </div>
        <span className="badge badge-danger" style={{ padding: "0.4rem 1rem" }}>🛡️ Patron uniquement</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {([["stats", "📊 Statistiques"], ["activite", "📋 Journal d'activité"]] as [string, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setActiveTab(k as any)} style={{
            padding: "0.55rem 1.25rem", borderRadius: "var(--radius)", cursor: "pointer",
            fontFamily: "'Inter',sans-serif", fontSize: "0.85rem", fontWeight: activeTab === k ? 700 : 400,
            background: activeTab === k ? "var(--gold-muted)" : "var(--surface)",
            border: `1px solid ${activeTab === k ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
            color: activeTab === k ? "var(--gold)" : "var(--text-muted)", transition: "all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {loading && activeTab === "stats" ? (
        <div style={{ color: "var(--text-dim)" }}>Chargement…</div>
      ) : activeTab === "stats" ? (
        <>
          {/* Totaux globaux */}
          <div className="stat-grid">
            {[
              { label: "Clients (cabinet)", value: totaux.clients, icon: "◉" },
              { label: "Dossiers (cabinet)", value: totaux.dossiers, icon: "◫" },
              { label: "Audiences planifiées", value: totaux.audiences, icon: "🏛️" },
              { label: "Casiers enregistrés", value: totaux.casiers, icon: "⚖️" },
              { label: "CA total payé", value: fmt(totaux.ca), icon: "◳", isMoney: true },
              { label: "En attente de paiement", value: fmt(totaux.enAttente), icon: "◐", isMoney: true, color: "var(--warning)" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ fontFamily: "monospace", color: "var(--gold)", opacity: 0.6 }}>{s.icon}</div>
                <div className="stat-value" style={{ fontSize: (s as any).isMoney ? "1.3rem" : "1.875rem", color: (s as any).color || "var(--gold)" }}>{s.value}</div>
                <div className="stat-label" style={{ marginTop: "0.35rem" }}>{s.label}</div>
              </div>
            ))}
          </div>


            {/* ─── Graphiques ─── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem",marginBottom:"1.75rem"}}>
              {/* CA 6 mois */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"1rem"}}>CA cabinet — 6 derniers mois</div>
                {caChart.some(b=>b.total>0) ? (
                  <div style={{display:"flex",alignItems:"flex-end",gap:"0.5rem",height:100}}>
                    {caChart.map((b,i)=>{
                      const max=Math.max(...caChart.map(x=>x.total),1);
                      const h=Math.max((b.total/max)*100,b.total>0?6:2);
                      const isCurrent=i===5;
                      return (
                        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.3rem"}}>
                          {b.total>0&&<div style={{fontSize:"0.55rem",color:"var(--text-dim)",whiteSpace:"nowrap"}}>{(b.total/1000).toFixed(0)}k</div>}
                          <div style={{width:"100%",height:`${h}%`,minHeight:4,borderRadius:"3px 3px 0 0",background:isCurrent?"var(--gold)":"var(--border-light)",transition:"height 0.4s"}}/>
                          <div style={{fontSize:"0.6rem",color:isCurrent?"var(--gold)":"var(--text-dim)"}}>{b.mois}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{fontSize:"0.8rem",color:"var(--text-dim)",textAlign:"center",padding:"1.5rem 0"}}>Aucune donnée</div>
                )}
              </div>
              {/* Types dossiers */}
              <div className="card">
                <div className="section-title" style={{marginBottom:"0.875rem"}}>Types d'affaires</div>
                {dossiersTypes.length === 0 ? (
                  <div style={{fontSize:"0.8rem",color:"var(--text-dim)",textAlign:"center",padding:"1.5rem 0"}}>Aucune donnée</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:"0.45rem"}}>
                    {dossiersTypes.map((d,i)=>{
                      const maxCount=dossiersTypes[0]?.count||1;
                      const COLORS=["var(--gold)","var(--info)","var(--success)","var(--warning)","var(--danger)","#a855f7","#06b6d4"];
                      const col=COLORS[i%COLORS.length];
                      return (
                        <div key={d.type} style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
                          <div style={{width:80,fontSize:"0.68rem",color:"var(--text-dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}} title={d.type}>{d.type}</div>
                          <div style={{flex:1,height:10,background:"var(--surface)",borderRadius:5,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${(d.count/maxCount)*100}%`,background:col,borderRadius:5,transition:"width 0.4s"}}/>
                          </div>
                          <div style={{fontSize:"0.68rem",color:col,fontWeight:700,flexShrink:0,minWidth:20,textAlign:"right"}}>{d.count}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          {/* Performance par membre */}
          <div style={{ marginTop: "1.75rem" }}>
            <div className="section-title" style={{ marginBottom: "1rem" }}>Performance par membre</div>
            {stats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-title">Aucune activité enregistrée</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {stats.map((s, i) => {
                  const totalDossiersClotures = s.dossiersGagnes + s.dossiersPerdus;
                  const tauxReussite = totalDossiersClotures > 0 ? Math.round((s.dossiersGagnes / totalDossiersClotures) * 100) : null;
                  const caRatio = Math.round((s.ca / maxCa) * 100);
                  return (
                    <div key={s.nom} className="card">
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, background: s.couleur, boxShadow: `0 0 8px ${s.couleur}80` }} />
                        <div style={{ fontWeight: 700, fontSize: "1rem", flex: 1 }}>{s.nom}</div>
                        {i === 0 && stats.length > 1 && <span className="badge badge-gold">🏆 Top performeur</span>}
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--gold)" }}>
                          {fmt(s.ca)}
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "0.625rem" }}>
                        {[
                          { label: "Clients",    value: s.clients },
                          { label: "Dossiers",   value: s.dossiers },
                          { label: "Ouverts",    value: s.dossiersOuverts,  color: "var(--info)"    },
                          { label: "Gagnés",     value: s.dossiersGagnes,   color: "var(--success)" },
                          { label: "Perdus",     value: s.dossiersPerdus,   color: "var(--danger)"  },
                          { label: "Casiers",    value: s.casiers,           color: "#7c3aed"        },
                          { label: "Audiences",  value: s.audiences,         color: "#3b82f6"        },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign: "center", padding: "0.5rem", background: "var(--surface)", borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: m.color || "var(--text)" }}>{m.value}</div>
                            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Barre CA relative */}
                      <div style={{ marginTop: "0.875rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                          <span>Part du CA cabinet</span>
                          <span style={{ fontWeight: 600, color: s.couleur }}>{caRatio}%</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${caRatio}%`, background: s.couleur }} />
                        </div>
                      </div>

                      {tauxReussite !== null && (
                        <div style={{ marginTop: "0.625rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                            <span>Taux de réussite</span>
                            <span style={{ fontWeight: 600, color: s.couleur }}>{tauxReussite}%</span>
                          </div>
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${tauxReussite}%`, background: s.couleur }} />
                          </div>
                        </div>
                      )}

                      {s.enAttente > 0 && (
                        <div style={{ marginTop: "0.625rem", fontSize: "0.72rem", color: "var(--warning)" }}>
                          ⚠ {fmt(s.enAttente)} en attente de paiement
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ─── Journal d'activité ─── */
        <div>
          {/* Filtre membre */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Membre</span>
            {["", ...uniqueMembers].map(m => (
              <button key={m || "_all"} onClick={() => setFilterMember(m)} style={{
                padding: "0.3rem 0.75rem", borderRadius: 999, cursor: "pointer",
                fontFamily: "'Inter',sans-serif", fontSize: "0.78rem",
                fontWeight: filterMember === m ? 700 : 400,
                background: filterMember === m ? "var(--gold-muted)" : "var(--surface)",
                border: `1px solid ${filterMember === m ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
                color: filterMember === m ? "var(--gold)" : "var(--text-muted)",
              }}>
                {m || "Tous"}
              </button>
            ))}
          </div>

          {/* Légende types */}
          <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {Object.entries(ACTIVITY_CONFIG).map(([type, cfg]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "var(--text-dim)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                {cfg.label}
              </div>
            ))}
          </div>

          {actLoading ? (
            <div style={{ color: "var(--text-dim)" }}>Chargement du journal…</div>
          ) : filteredActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">Aucune activité</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {filteredActivity.map((item, i) => {
                const cfg = ACTIVITY_CONFIG[item.type];
                const memberCol = stats.find(s => s.nom === item.by)?.couleur || "#c9a84c";
                return (
                  <div key={i} style={{ display: "flex", gap: "0.875rem", position: "relative", padding: "0.75rem 0" }}>
                    {i < filteredActivity.length - 1 && (
                      <div style={{ position: "absolute", left: 15, top: 36, bottom: 0, width: 2, background: "var(--border)" }} />
                    )}
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0, zIndex: 1,
                      background: cfg.color + "18", border: `2px solid ${cfg.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem",
                    }}>
                      {cfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.15rem" }}>
                        <span style={{ fontSize: "0.65rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: cfg.color + "15", color: cfg.color, border: `1px solid ${cfg.color}30`, fontWeight: 600 }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>
                          {item.label}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-dim)", flexShrink: 0 }}>
                          {timeAgo(item.at)}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "0.1rem" }}>{item.detail}</div>
                      <div style={{ fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: memberCol, flexShrink: 0 }} />
                        <span style={{ color: memberCol }}>{item.by}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
