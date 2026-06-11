"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser, canAccess, ROLE_BADGES, type User } from "@/lib/auth";

interface Stats {
  clients: number;
  dossiers: number;
  factures: number;
  chiffreAffaires: number;
  dossierOuverts: number;
  facturesAttente: number;
  totalEntrees: number;
  totalSorties: number;
}

const ALL_MODULES = [
  { href: "/clients", icon: "👤", label: "Clients", desc: "Gestion des clients", permission: "clients" },
  { href: "/dossiers", icon: "📁", label: "Dossiers", desc: "Suivi des affaires", permission: "dossiers" },
  { href: "/factures", icon: "🧾", label: "Factures", desc: "Facturation & PDF", permission: "factures" },
  { href: "/operations", icon: "💸", label: "Opérations", desc: "Flux financiers", permission: "operations" },
  { href: "/comptabilite", icon: "📊", label: "Comptabilité", desc: "Solde & bilans", permission: "comptabilite" },
  { href: "/blanchiment", icon: "🔄", label: "Blanchiment", desc: "Conversion argent sale", permission: "blanchiment" },
  { href: "/simulateur", icon: "⚙️", label: "Simulateur", desc: "Calcul honoraires", permission: "simulateur" },
  { href: "/juridique", icon: "📜", label: "Juridique", desc: "Code pénal & textes", permission: "juridique" },
  { href: "/admin", icon: "🛡️", label: "Administration", desc: "Gestion des accès", permission: "admin" },
  { href: "/parametres", icon: "🔧", label: "Paramètres", desc: "Configuration cabinet", permission: "parametres" },
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    clients: 0, dossiers: 0, factures: 0,
    chiffreAffaires: 0, dossierOuverts: 0,
    facturesAttente: 0, totalEntrees: 0, totalSorties: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    load();
  }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    try {
      const [
        { count: clients },
        { count: dossiers },
        { count: factures },
        { count: ouverts },
        { data: facturesData },
        { data: opsData },
      ] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact", head: true }),
        supabase.from("dossiers").select("*", { count: "exact", head: true }),
        supabase.from("factures").select("*", { count: "exact", head: true }),
        supabase.from("dossiers").select("*", { count: "exact", head: true }).eq("statut", "Ouvert"),
        supabase.from("factures").select("montant, statut"),
        supabase.from("operations").select("type, montant"),
      ]);

      const ca = (facturesData || []).reduce((s: number, f: { montant: number }) => s + (f.montant || 0), 0);
      const attente = (facturesData || []).filter((f: { statut: string }) => f.statut === "En attente").reduce((s: number, f: { montant: number }) => s + (f.montant || 0), 0);
      const entrees = (opsData || []).filter((o: { type: string }) => o.type === "Entrée").reduce((s: number, o: { montant: number }) => s + (o.montant || 0), 0);
      const sorties = (opsData || []).filter((o: { type: string }) => o.type === "Sortie").reduce((s: number, o: { montant: number }) => s + (o.montant || 0), 0);

      setStats({
        clients: clients || 0,
        dossiers: dossiers || 0,
        factures: factures || 0,
        chiffreAffaires: ca,
        dossierOuverts: ouverts || 0,
        facturesAttente: attente,
        totalEntrees: entrees,
        totalSorties: sorties,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const solde = stats.totalEntrees - stats.totalSorties;
  const visibleModules = ALL_MODULES.filter((m) => user && canAccess(user.role, m.permission));

  return (
    <div className="page-container">
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "2.5rem 0 2rem", position: "relative" }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.7rem",
          letterSpacing: "0.3em",
          color: "var(--gold)",
          textTransform: "uppercase",
          marginBottom: "0.75rem",
          opacity: 0.7,
        }}>
          Established · Los Santos · SA
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: "0.6rem",
        }}>
          Cabinet <span className="gold-shimmer">Varelli</span>
        </h1>
        <p style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          letterSpacing: "0.15em",
          marginBottom: "1.5rem",
        }}>
          « Seul Dieu peut juger »
        </p>

        {/* User badge */}
        {user && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Connecté en tant que</span>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>{user.nom}</span>
            <span className={`badge ${ROLE_BADGES[user.role]}`}>{user.role}</span>
          </div>
        )}

        <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", margin: "1.5rem auto 0" }} />
      </div>

      {/* Stats — visibles selon rôle */}
      {user && canAccess(user.role, "comptabilite") && (
        <div className="stat-grid" style={{ marginBottom: "2rem" }}>
          {[
            { label: "Clients", value: loading ? "—" : stats.clients, icon: "👤" },
            { label: "Dossiers actifs", value: loading ? "—" : stats.dossierOuverts, icon: "📂" },
            { label: "Chiffre d'affaires", value: loading ? "—" : fmt(stats.chiffreAffaires), icon: "💰" },
            { label: "En attente", value: loading ? "—" : fmt(stats.facturesAttente), icon: "⏳" },
            { label: "Solde trésorerie", value: loading ? "—" : fmt(solde), icon: solde >= 0 ? "📈" : "📉", color: solde >= 0 ? "var(--success)" : "var(--danger)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: "1.6rem", color: s.color || "var(--gold)" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {user && !canAccess(user.role, "comptabilite") && canAccess(user.role, "dossiers") && (
        <div className="stat-grid" style={{ marginBottom: "2rem" }}>
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <div className="stat-label">Clients</div>
            <div className="stat-value">{loading ? "—" : stats.clients}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📂</div>
            <div className="stat-label">Dossiers actifs</div>
            <div className="stat-value">{loading ? "—" : stats.dossierOuverts}</div>
          </div>
        </div>
      )}

      {/* Modules */}
      <div style={{ marginBottom: "1rem" }}>
        <h2 className="section-title">Modules accessibles</h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
        gap: "0.875rem",
      }}>
        {visibleModules.map((item) => (
          <a key={item.href} href={item.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "var(--gold-muted)",
                border: "1px solid rgba(212,175,55,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.15rem", fontSize: "0.9rem" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
              <div style={{ color: "var(--text-dim)", fontSize: "0.9rem", flexShrink: 0 }}>›</div>
            </div>
          </a>
        ))}
      </div>

      <div style={{
        marginTop: "3rem",
        textAlign: "center",
        color: "var(--text-dim)",
        fontSize: "0.75rem",
        paddingBottom: "2rem",
        letterSpacing: "0.05em",
      }}>
        CABINET VARELLI · LOS SANTOS · V8 · CONFIDENTIEL
      </div>
    </div>
  );
}
