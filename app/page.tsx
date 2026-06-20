"use client";

import { useEffect, useState } from "react";
import { getUser, canAccess, ROLE_BADGES, getMemberColor, type User } from "@/lib/auth";
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
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    load(u);
  }, []);

  async function load(u: User) {
    if (!supabase) { setLoading(false); return; }

    const today = new Date().toISOString().split("T")[0];

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
      supabase.from("factures").select("montant, statut").eq("created_by", u.nom),
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
    setAudiences(audienceData || []);
    setFactures(facturesRecentes || []);
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
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          {greeting()}, <span style={{ color: "var(--gold)" }}>{user.nom.split(" ")[0]}</span>
        </div>
        <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="gold-line" style={{ marginTop: "0.75rem" }} />
      </div>

      {loading ? (
        <div style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>Chargement…</div>
      ) : (
        <>
          {/* Stats */}
          <div className="stat-grid">
            {[
              { label: "Clients", value: stats?.clients || 0, icon: "◉", href: "/clients" },
              { label: "Dossiers", value: stats?.dossiers || 0, icon: "◫", href: "/dossiers" },
              { label: "Ouverts", value: stats?.dossiersOuverts || 0, icon: "◐", href: "/dossiers" },
              { label: "Factures", value: stats?.factures || 0, icon: "◳", href: "/factures" },
            ].map(s => (
              <a key={s.label} href={s.href} style={{ textDecoration: "none" }}>
                <div className="stat-card">
                  <div className="stat-icon" style={{ fontFamily: "monospace", color: "var(--gold)", opacity: 0.6 }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label" style={{ marginTop: "0.35rem" }}>{s.label}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Chiffres financiers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "0.875rem" }}>
            <div className="card" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>Chiffre d'affaires (factures payées)</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--success)" }}>
                {fmt(stats?.chiffreAffaires || 0)}
              </div>
            </div>
            <div className="card" style={{ borderColor: "rgba(234,179,8,0.2)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>En attente de paiement</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--warning)" }}>
                {fmt(stats?.facturesEnAttente || 0)}
              </div>
            </div>
          </div>

          {/* Taux de réussite */}
          {((stats?.dossiersGagnes||0) + (stats?.dossiersPerdus||0)) > 0 && (
            <div className="card" style={{ marginBottom: "1.75rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"0.75rem" }}>
                <div className="stat-label" style={{ marginBottom:0 }}>Taux de réussite des dossiers clôturés</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"1.1rem", color:"var(--gold)" }}>
                  {Math.round((stats!.dossiersGagnes/(stats!.dossiersGagnes+stats!.dossiersPerdus))*100)}%
                </div>
              </div>
              <div className="progress-bar-track" style={{ marginBottom:"0.625rem" }}>
                <div className="progress-bar-fill" style={{
                  width:`${(stats!.dossiersGagnes/(stats!.dossiersGagnes+stats!.dossiersPerdus))*100}%`,
                  background:"linear-gradient(90deg, var(--success), #16a34a)",
                }} />
              </div>
              <div style={{ display:"flex", gap:"1.25rem", fontSize:"0.78rem" }}>
                <span style={{ color:"var(--success)" }}>● {stats?.dossiersGagnes} gagné{stats?.dossiersGagnes!==1?"s":""}</span>
                <span style={{ color:"var(--danger)" }}>● {stats?.dossiersPerdus} perdu{stats?.dossiersPerdus!==1?"s":""}</span>
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
                  {audiences.map(a => {
                    const isToday = a.date === today;
                    const memberColor = getMemberColor(a.created_by || "default");
                    return (
                      <a key={a.id} href="/audiences" style={{ textDecoration: "none" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.875rem",
                          padding: "0.7rem 0.875rem",
                          borderRadius: "var(--radius)",
                          background: isToday ? "rgba(201,168,76,0.06)" : "var(--surface)",
                          border: `1px solid ${isToday ? "rgba(201,168,76,0.2)" : "var(--border)"}`,
                          transition: "border-color 0.15s",
                        }}>
                          {/* Indicateur couleur membre */}
                          <div style={{ width: 3, height: 36, borderRadius: 2, background: memberColor, flexShrink: 0 }} />

                          {/* Date */}
                          <div style={{ flexShrink: 0, textAlign: "center", minWidth: 36 }}>
                            <div style={{ fontSize: "1rem", fontWeight: 700, color: isToday ? "var(--gold)" : "var(--text)", lineHeight: 1 }}>
                              {new Date(a.date + "T12:00:00").getDate()}
                            </div>
                            <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                              {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                            </div>
                          </div>

                          {/* Infos */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.825rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.titre}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.1rem", display: "flex", gap: "0.5rem" }}>
                              {a.heure && <span>⏱ {a.heure}</span>}
                              {a.client && <span>· {a.client}</span>}
                            </div>
                          </div>

                          {/* Badge membre */}
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
                  {factures.map(f => (
                    <a key={f.id} href="/factures" style={{ textDecoration: "none" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.7rem 0.875rem",
                        borderRadius: "var(--radius)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        transition: "border-color 0.15s",
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
