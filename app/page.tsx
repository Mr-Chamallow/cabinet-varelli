"use client";

import { useEffect, useState } from "react";
import { getUser, canAccess, getMemberColor, type User } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Stats {
  clients: number;
  dossiers: number;
  factures: number;
  dossiersOuverts: number;
  chiffreAffaires: number;
  facturesEnAttente: number;
  dossiersGagnes: number;
  dossiersPerdus: number;
}

interface Audience {
  id: string;
  titre: string;
  client: string;
  date: string;
  heure: string;
  type: string;
  created_by: string;
}

interface Facture {
  id: string;
  numero: string;
  client: string;
  montant: number;
  statut: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [evolutionCA, setEvolutionCA] = useState<{ mois: string; total: number }[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [memberColors, setMemberColors] = useState<Record<string, string>>({});
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [recidivistes, setRecidivistes] = useState<{nom:string;count:number}[]>([]);
  const [defcon, setDefconDash] = useState(5);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    const saved = parseInt(localStorage.getItem('cabinet_defcon') || '5');
    setDefconDash(isNaN(saved) ? 5 : Math.min(5, Math.max(1, saved)));
    load(u);
  }, []);

  async function load(u: User) {
    if (!supabase) { setLoading(false); return; }

    const today = new Date().toISOString().split("T")[0];

    supabase.from("membres").select("nom, couleur").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((m: any) => { if (m.couleur) map[m.nom] = m.couleur; });
        setMemberColors(map);
      }
    });

    const [
      { count: clients },
      { count: dossiers },
      { count: factureCount },
      { count: dossiersOuverts },
      { count: dossiersGagnes },
      { count: dossiersPerdus },
      { data: factureData },
      { data: audienceData },
      { data: facturesRecentes },
    ] = await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("created_by", u.nom),
      supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", u.nom),
      supabase.from("factures").select("*", { count: "exact", head: true }).eq("created_by", u.nom),
      supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", u.nom).eq("statut", "Ouvert"),
      supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", u.nom).eq("statut", "Gagné"),
      supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("created_by", u.nom).eq("statut", "Perdu"),
      supabase.from("factures").select("montant, statut, created_at").eq("created_by", u.nom),
      supabase.from("audiences").select("id, titre, client, date, heure, type, created_by")
        .gte("date", today).order("date").order("heure").limit(6),
      supabase.from("factures").select("id, numero, client, montant, statut")
        .eq("created_by", u.nom).eq("statut", "En attente").order("created_at", { ascending: false }).limit(4),
    ]);

    const ca = (factureData || []).filter((f: any) => f.statut === "Payée").reduce((s: number, f: any) => s + f.montant, 0);
    const enAttente = (factureData || []).filter((f: any) => f.statut === "En attente").reduce((s: number, f: any) => s + f.montant, 0);

    setStats({
      clients: clients || 0,
      dossiers: dossiers || 0,
      factures: factureCount || 0,
      dossiersOuverts: dossiersOuverts || 0,
      dossiersGagnes: dossiersGagnes || 0,
      dossiersPerdus: dossiersPerdus || 0,
      chiffreAffaires: ca,
      facturesEnAttente: enAttente,
    });

    const moisLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();
    const buckets: { mois: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ mois: moisLabels[d.getMonth()], total: 0 });
    }
    (factureData || []).filter((f: any) => f.statut === "Payée").forEach((f: any) => {
      const fd = new Date(f.created_at);
      const diffMonths = (now.getFullYear() - fd.getFullYear()) * 12 + (now.getMonth() - fd.getMonth());
      if (diffMonths >= 0 && diffMonths <= 5) {
        buckets[5 - diffMonths].total += f.montant;
      }
    });
    setEvolutionCA(buckets);

    setAudiences(audienceData || []);
    setFactures(facturesRecentes || []);

    // Load recidivistes (3+ entries in casier)
    const { data: casierData } = await supabase.from("casier").select("client_nom");
    if (casierData) {
      const counts: Record<string,number> = {};
      casierData.forEach((r:any) => { counts[r.client_nom] = (counts[r.client_nom]||0)+1; });
      const recids = Object.entries(counts).filter(([,n])=>n>=3).map(([nom,count])=>({nom,count})).sort((a,b)=>b.count-a.count).slice(0,5);
      setRecidivistes(recids);
    }

    setLoading(false);
  }

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const today = new Date().toISOString().split("T")[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (!user) return null;

  return (
    <div className="page-container" style={{ position: "relative" }}>
      <div className="ambient-glow" style={{ top: "-10%", left: "60%" }} />

      {/* Header */}
      <div style={{ marginBottom: "2.25rem", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: "2.1rem", fontWeight: 900,
          letterSpacing: "-0.02em", marginBottom: "0.3rem", lineHeight: 1.1,
        }}>
          {greeting()}, <span style={{ color: "var(--gold)" }}>{user.nom.split(" ")[0]}</span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="gold-line" style={{ marginTop: "0.8rem" }} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div className="stat-grid">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
          </div>
          <div className="skeleton skeleton-card" style={{ height: 140 }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="stat-grid">
            {[
              { label: "Clients", value: stats?.clients || 0, icon: "◉", href: "/clients" },
              { label: "Dossiers", value: stats?.dossiers || 0, icon: "◫", href: "/dossiers" },
              { label: "Ouverts", value: stats?.dossiersOuverts || 0, icon: "◐", href: "/dossiers" },
              { label: "Factures", value: stats?.factures || 0, icon: "◳", href: "/factures" },
            ].map((s, i) => (
              <a key={s.label} href={s.href} style={{ textDecoration: "none" }} className="stagger-item">
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontFamily: "monospace", color: "var(--gold)", opacity: 0.65 }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label" style={{ marginTop: "0.35rem" }}>{s.label}</div>
                </div>
              </a>
            ))}
          </div>


          {/* ─── Alertes ─── */}
          {(recidivistes.length > 0) && (
            <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--radius-lg)",padding:"0.875rem 1.125rem",marginBottom:"0.875rem",display:"flex",gap:"1rem",alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{flexShrink:0}}>
                <div style={{fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.08em",color:"var(--danger)",fontWeight:700,marginBottom:"0.35rem"}}>⚠ Récidivistes (3 condamnations+)</div>
                <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
                  {recidivistes.map(r=>(
                    <a key={r.nom} href="/casier" style={{textDecoration:"none"}}>
                      <span style={{fontSize:"0.72rem",padding:"0.2rem 0.65rem",borderRadius:999,background:"rgba(239,68,68,0.12)",color:"var(--danger)",border:"1px solid rgba(239,68,68,0.25)",fontWeight:600,display:"flex",alignItems:"center",gap:"0.3rem"}}>
                        {r.nom} <span style={{opacity:0.7}}>×{r.count}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chiffres financiers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "0.875rem" }}>
            <div className="card stagger-item" style={{ borderColor: "rgba(34,197,94,0.18)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>Chiffre d'affaires (factures payées)</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--success)" }}>
                {fmt(stats?.chiffreAffaires || 0)}
              </div>
            </div>
            <div className="card stagger-item" style={{ borderColor: "rgba(234,179,8,0.18)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>En attente de paiement</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 800, color: "var(--warning)" }}>
                {fmt(stats?.facturesEnAttente || 0)}
              </div>
            </div>
          </div>

          {/* Taux de réussite */}
          {((stats?.dossiersGagnes || 0) + (stats?.dossiersPerdus || 0)) > 0 && (
            <div className="card" style={{ marginBottom: "1.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                <div className="stat-label" style={{ marginBottom: 0 }}>Taux de réussite des dossiers clôturés</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--gold)" }}>
                  {Math.round((stats!.dossiersGagnes / (stats!.dossiersGagnes + stats!.dossiersPerdus)) * 100)}%
                </div>
              </div>
              <div className="progress-bar-track" style={{ marginBottom: "0.625rem" }}>
                <div className="progress-bar-fill" style={{
                  width: `${(stats!.dossiersGagnes / (stats!.dossiersGagnes + stats!.dossiersPerdus)) * 100}%`,
                  background: "linear-gradient(90deg, var(--success), #16a34a)",
                }} />
              </div>
              <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem" }}>
                <span style={{ color: "var(--success)" }}>● {stats?.dossiersGagnes} gagné{stats?.dossiersGagnes !== 1 ? "s" : ""}</span>
                <span style={{ color: "var(--danger)" }}>● {stats?.dossiersPerdus} perdu{stats?.dossiersPerdus !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {/* Évolution du CA */}
          {evolutionCA.some(b => b.total > 0) && (
            <div className="card" style={{ marginBottom: "1.75rem" }}>
              <div className="stat-label" style={{ marginBottom: "1rem" }}>Évolution du chiffre d'affaires (6 derniers mois)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 120 }}>
                {evolutionCA.map((b, i) => {
                  const max = Math.max(...evolutionCA.map(x => x.total), 1);
                  const h = Math.max((b.total / max) * 100, b.total > 0 ? 6 : 2);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
                        {b.total > 0 ? fmt(b.total).replace(",00 $", "$").replace(" $", "$") : ""}
                      </div>
                      <div style={{
                        width: "100%", maxWidth: 36, height: `${h}%`, minHeight: 4,
                        borderRadius: "4px 4px 0 0",
                        background: i === 5 ? "linear-gradient(180deg, var(--gold), var(--gold-dark))" : "var(--border-light)",
                        transition: "height 0.6s var(--ease)",
                      }} />
                      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{b.mois}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grille Agenda + Factures */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

            {/* Prochaines audiences */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.125rem" }}>
                <div>
                  <div className="section-title">Prochaines audiences</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>Agenda partagé du cabinet</div>
                </div>
                <a href="/audiences" className="btn btn-ghost btn-sm">Voir tout →</a>
              </div>

              {audiences.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-dim)", fontSize: "0.825rem" }}>
                  Aucune audience planifiée
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {audiences.map((a, i) => {
                    const isToday = a.date === today;
                    const memberColor = getMemberColor(a.created_by || "default", memberColors[a.created_by]);
                    return (
                      <a key={a.id} href="/audiences" style={{ textDecoration: "none" }} className="stagger-item">
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.875rem",
                          padding: "0.7rem 0.875rem",
                          borderRadius: "var(--radius)",
                          background: isToday ? "var(--gold-muted)" : "var(--surface)",
                          border: `1px solid ${isToday ? "rgba(196,179,137,0.2)" : "var(--border)"}`,
                          transition: "border-color var(--t-fast) var(--ease)",
                          animation: isToday ? "todayPulse 2.5s ease-in-out infinite" : "none",
                        }}>
                          <div style={{ width: 3, height: 36, borderRadius: 2, background: memberColor, flexShrink: 0 }} />

                          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 36 }}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: isToday ? "var(--gold)" : "var(--text)", lineHeight: 1 }}>
                              {new Date(a.date + "T12:00:00").getDate()}
                            </div>
                            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                              {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.825rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.titre}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.1rem", display: "flex", gap: "0.5rem" }}>
                              {a.heure && <span>⏱ {a.heure}</span>}
                              {a.client && <span>· {a.client}</span>}
                            </div>
                          </div>

                          <div style={{
                            fontSize: "0.62rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: 999,
                            background: memberColor + "18",
                            color: memberColor,
                            border: `1px solid ${memberColor}30`,
                            flexShrink: 0,
                            fontWeight: 600,
                          }}>
                            {(a.created_by || "?").split(" ")[0]}
                          </div>

                          {isToday && (
                            <span className="badge badge-gold" style={{ fontSize: "0.6rem", flexShrink: 0 }}>Aujourd'hui</span>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              <a href="/audiences" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
                + Nouvelle audience
              </a>
            </div>

            {/* Factures en attente */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.125rem" }}>
                <div>
                  <div className="section-title">Factures en attente</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>À encaisser</div>
                </div>
                <a href="/factures" className="btn btn-ghost btn-sm">Voir tout →</a>
              </div>

              {factures.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-dim)", fontSize: "0.825rem" }}>
                  Aucune facture en attente
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {factures.map((f) => (
                    <a key={f.id} href="/factures" style={{ textDecoration: "none" }} className="stagger-item">
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.7rem 0.875rem",
                        borderRadius: "var(--radius)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        transition: "border-color var(--t-fast) var(--ease)",
                        gap: "0.75rem",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.825rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {f.client}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "monospace" }}>{f.numero}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--warning)", fontSize: "0.9rem", flexShrink: 0 }}>
                          {fmt(f.montant)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <a href="/factures" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
                + Nouvelle facture
              </a>
            </div>
          </div>

          {/* Mini calendrier 7 jours */}
          <div className="card" style={{ marginTop: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div className="stat-label" style={{ marginBottom: 0 }}>Aperçu 7 prochains jours</div>
              <a href="/audiences" className="btn btn-ghost btn-sm">Agenda complet →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "0.4rem" }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const count = audiences.filter(a => a.date === dStr).length;
                const isToday = i === 0;
                return (
                  <a key={i} href="/audiences" style={{ textDecoration: "none" }}>
                    <div style={{
                      textAlign: "center", padding: "0.625rem 0.3rem", borderRadius: "var(--radius)",
                      background: isToday ? "var(--gold-muted)" : count > 0 ? "var(--surface)" : "transparent",
                      border: `1px solid ${isToday ? "rgba(196,179,137,0.3)" : count > 0 ? "var(--border)" : "transparent"}`,
                      transition: "border-color var(--t-fast) var(--ease)",
                    }}>
                      <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                        {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </div>
                      <div style={{ fontWeight: isToday ? 700 : 500, fontSize: "0.95rem", color: isToday ? "var(--gold)" : "var(--text)" }}>
                        {d.getDate()}
                      </div>
                      {count > 0 && (
                        <div style={{
                          marginTop: "0.3rem", width: 6, height: 6, borderRadius: "50%",
                          background: "var(--gold)", margin: "0.3rem auto 0",
                        }} />
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Accès rapides */}
          <div style={{ marginTop: "1.5rem" }}>
            <div className="section-title" style={{ marginBottom: "0.875rem" }}>Accès rapides</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {[
                { label: "Nouveau client", href: "/clients", icon: "◉" },
                { label: "Nouveau dossier", href: "/dossiers", icon: "◫" },
                { label: "Simulateur honoraires", href: "/simulateur", icon: "◐" },
                { label: "Calculateur blanchiment", href: "/blanchiment", icon: "◑" },
                { label: "Code pénal", href: "/juridique", icon: "◎" },
              ].filter(a => {
                const permMap: Record<string, string> = {
                  "/clients": "clients", "/dossiers": "dossiers",
                  "/simulateur": "simulateur", "/blanchiment": "blanchiment", "/juridique": "juridique",
                };
                return canAccess(user.role, permMap[a.href] || "dashboard");
              }).map(a => (
                <a key={a.href} href={a.href} className="btn btn-outline">
                  <span style={{ fontFamily: "monospace" }}>{a.icon}</span>
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
