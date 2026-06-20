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
}

export default function SupervisionPage() {
  const router = useRouter();
  const user = getUser();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<MembreStats[]>([]);
  const [totaux, setTotaux] = useState({ clients:0, dossiers:0, ca:0, enAttente:0 });

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    if (!canAccess(user.role, "admin")) { setAuthorized(false); setLoading(false); return; }
    setAuthorized(true);
    load();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const { data: membres } = await supabase.from("membres").select("nom, couleur");
    if (!membres) { setLoading(false); return; }

    const results: MembreStats[] = [];
    let totClients=0, totDossiers=0, totCa=0, totAttente=0;

    for (const m of membres) {
      const [{ count:clients }, { count:dossiers }, { count:ouverts }, { count:gagnes }, { count:perdus }, { data:factures }] = await Promise.all([
        supabase.from("clients").select("*",{count:"exact",head:true}).eq("created_by", m.nom),
        supabase.from("dossiers").select("*",{count:"exact",head:true}).eq("created_by", m.nom),
        supabase.from("dossiers").select("*",{count:"exact",head:true}).eq("created_by", m.nom).eq("statut","Ouvert"),
        supabase.from("dossiers").select("*",{count:"exact",head:true}).eq("created_by", m.nom).eq("statut","Gagné"),
        supabase.from("dossiers").select("*",{count:"exact",head:true}).eq("created_by", m.nom).eq("statut","Perdu"),
        supabase.from("factures").select("montant,statut").eq("created_by", m.nom),
      ]);

      const ca = (factures||[]).filter((f:any)=>f.statut==="Payée").reduce((s:number,f:any)=>s+f.montant,0);
      const enAttente = (factures||[]).filter((f:any)=>f.statut==="En attente").reduce((s:number,f:any)=>s+f.montant,0);

      if ((clients||0) + (dossiers||0) + (factures||[]).length > 0) {
        results.push({
          nom: m.nom, couleur: m.couleur || getMemberColor(m.nom),
          clients: clients||0, dossiers: dossiers||0,
          dossiersOuverts: ouverts||0, dossiersGagnes: gagnes||0, dossiersPerdus: perdus||0,
          factures: (factures||[]).length, ca, enAttente,
        });
      }
      totClients += clients||0; totDossiers += dossiers||0; totCa += ca; totAttente += enAttente;
    }

    results.sort((a,b) => b.ca - a.ca);
    setStats(results);
    setTotaux({ clients:totClients, dossiers:totDossiers, ca:totCa, enAttente:totAttente });
    setLoading(false);
  }

  const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});
  const maxCa = Math.max(...stats.map(s=>s.ca), 1);

  if (!authorized && !loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <div className="empty-title">Accès réservé</div>
          <p style={{ fontSize:"0.875rem", marginTop:"0.5rem" }}>Cette page nécessite la permission d'administration.</p>
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
          <p className="page-subtitle">Activité de tous les membres · Vue Patron</p>
          <div className="gold-line" />
        </div>
      </div>

      {loading ? (
        <div style={{ color:"var(--text-dim)" }}>Chargement…</div>
      ) : (
        <>
          {/* Totaux globaux */}
          <div className="stat-grid">
            {[
              { label:"Clients (cabinet)", value:totaux.clients, icon:"◉" },
              { label:"Dossiers (cabinet)", value:totaux.dossiers, icon:"◫" },
              { label:"CA total payé", value:fmt(totaux.ca), icon:"◳", isMoney:true },
              { label:"En attente (cabinet)", value:fmt(totaux.enAttente), icon:"◐", isMoney:true, color:"var(--warning)" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ fontFamily:"monospace", color:"var(--gold)", opacity:0.6 }}>{s.icon}</div>
                <div className="stat-value" style={{ fontSize:s.isMoney?"1.4rem":"1.875rem", color:s.color||"var(--gold)" }}>{s.value}</div>
                <div className="stat-label" style={{ marginTop:"0.35rem" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Classement par membre */}
          <div style={{ marginTop:"1.75rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Performance par membre</div>
            {stats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-title">Aucune activité enregistrée</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {stats.map((s, i) => {
                  const totalDossiersClotures = s.dossiersGagnes + s.dossiersPerdus;
                  const tauxReussite = totalDossiersClotures > 0 ? Math.round((s.dossiersGagnes/totalDossiersClotures)*100) : null;
                  return (
                    <div key={s.nom} className="card">
                      <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1rem", flexWrap:"wrap" }}>
                        <div style={{
                          width:14, height:14, borderRadius:"50%", flexShrink:0,
                          background:s.couleur, boxShadow:`0 0 8px ${s.couleur}80`,
                        }} />
                        <div style={{ fontWeight:700, fontSize:"1rem", flex:1 }}>{s.nom}</div>
                        {i===0 && stats.length>1 && <span className="badge badge-gold">🏆 Top performeur</span>}
                        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.2rem", color:"var(--gold)" }}>
                          {fmt(s.ca)}
                        </div>
                      </div>

                      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"0.75rem" }}>
                        {[
                          { label:"Clients", value:s.clients },
                          { label:"Dossiers", value:s.dossiers },
                          { label:"Ouverts", value:s.dossiersOuverts, color:"var(--info)" },
                          { label:"Gagnés", value:s.dossiersGagnes, color:"var(--success)" },
                          { label:"Perdus", value:s.dossiersPerdus, color:"var(--danger)" },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign:"center", padding:"0.5rem", background:"var(--surface)", borderRadius:8 }}>
                            <div style={{ fontWeight:700, fontSize:"1.1rem", color:m.color||"var(--text)" }}>{m.value}</div>
                            <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", marginTop:"0.15rem" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {tauxReussite !== null && (
                        <div style={{ marginTop:"0.875rem" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>
                            <span>Taux de réussite</span><span style={{ fontWeight:600, color:s.couleur }}>{tauxReussite}%</span>
                          </div>
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width:`${tauxReussite}%`, background:s.couleur }} />
                          </div>
                        </div>
                      )}

                      {s.enAttente > 0 && (
                        <div style={{ marginTop:"0.625rem", fontSize:"0.72rem", color:"var(--warning)" }}>
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
      )}
    </div>
  );
}
