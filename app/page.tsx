"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  clients: number;
  dossiers: number;
  factures: number;
  operations: number;
  chiffreAffaires: number;
  dossierOuverts: number;
}

const NAV = [
  { href: "/clients", icon: "👤", label: "Clients", desc: "Gestion des clients" },
  { href: "/dossiers", icon: "📁", label: "Dossiers", desc: "Suivi des affaires" },
  { href: "/factures", icon: "🧾", label: "Factures", desc: "Facturation & PDF" },
  { href: "/operations", icon: "💸", label: "Opérations", desc: "Flux financiers" },
  { href: "/comptabilite", icon: "📊", label: "Comptabilité", desc: "Solde & bilans" },
  { href: "/blanchiment", icon: "🔄", label: "Blanchiment", desc: "Conversion argent sale" },
  { href: "/simulateur", icon: "⚙️", label: "Simulateur", desc: "Calcul honoraires" },
  { href: "/juridique", icon: "📜", label: "Juridique", desc: "Code pénal & textes" },
  { href: "/parametres", icon: "⚙️", label: "Paramètres", desc: "Configuration cabinet" },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    clients: 0,
    dossiers: 0,
    factures: 0,
    operations: 0,
    chiffreAffaires: 0,
    dossierOuverts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) { setLoading(false); return; }
      try {
        const [
          { count: clients },
          { count: dossiers },
          { count: factures },
          { count: operations },
          { data: facturesData },
          { count: ouverts },
        ] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("dossiers").select("*", { count: "exact", head: true }),
          supabase.from("factures").select("*", { count: "exact", head: true }),
          supabase.from("operations").select("*", { count: "exact", head: true }),
          supabase.from("factures").select("montant"),
          supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("statut", "Ouvert"),
        ]);

        const ca = (facturesData || []).reduce((s: number, f: { montant: number }) => s + (f.montant || 0), 0);

        setStats({
          clients: clients || 0,
          dossiers: dossiers || 0,
          factures: factures || 0,
          operations: operations || 0,
          chiffreAffaires: ca,
          dossierOuverts: ouverts || 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "3rem 0 2.5rem", position: "relative" }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.75rem",
          letterSpacing: "0.3em",
          color: "var(--gold)",
          textTransform: "uppercase",
          marginBottom: "1rem",
          opacity: 0.8,
        }}>
          Established · Los Santos · SA
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "0.75rem",
        }}>
          Cabinet{" "}
          <span className="gold-shimmer">Varelli</span>
        </h1>

        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.9rem",
          color: "var(--text-muted)",
          letterSpacing: "0.15em",
          marginBottom: "2.5rem",
        }}>
          « Seul Dieu peut juger »
        </p>

        {/* Gold divider */}
        <div style={{
          width: 80,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
          margin: "0 auto",
        }} />
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: "2.5rem" }}>
        {[
          { label: "Clients", value: loading ? "—" : stats.clients, icon: "👤" },
          { label: "Dossiers actifs", value: loading ? "—" : stats.dossierOuverts, icon: "📂" },
          { label: "Total dossiers", value: loading ? "—" : stats.dossiers, icon: "📁" },
          { label: "Factures", value: loading ? "—" : stats.factures, icon: "🧾" },
          { label: "Chiffre d'affaires", value: loading ? "—" : fmt(stats.chiffreAffaires), icon: "💰", wide: true },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card"
            style={s.wide ? { gridColumn: "span 2" } as React.CSSProperties : {}}
          >
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: s.wide ? "2.25rem" : "2rem" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <div style={{ marginBottom: "1rem" }}>
        <h2 className="section-title">Modules</h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "1rem",
      }}>
        {NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none" }}
          >
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--gold-muted)",
                border: "1px solid rgba(212,175,55,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "0.2rem",
                  fontSize: "0.95rem",
                }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {item.desc}
                </div>
              </div>
              <div style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: "1rem" }}>›</div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "3rem",
        textAlign: "center",
        color: "var(--text-dim)",
        fontSize: "0.78rem",
        paddingBottom: "2rem",
        letterSpacing: "0.05em",
      }}>
        CABINET VARELLI · LOS SANTOS · CONFIDENTIEL
      </div>
    </div>
  );
}
