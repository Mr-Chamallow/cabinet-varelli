"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Op {
  type: string;
  montant: number;
  motif: string;
  created_at: string;
}

interface Facture {
  montant: number;
  statut: string;
  created_at: string;
}

export default function ComptabilitePage() {
  const [ops, setOps] = useState<Op[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: o }, { data: f }] = await Promise.all([
      supabase.from("operations").select("type, montant, motif, created_at").order("created_at", { ascending: false }),
      supabase.from("factures").select("montant, statut, created_at").order("created_at", { ascending: false }),
    ]);
    setOps(o || []);
    setFactures(f || []);
    setLoading(false);
  }

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const totalEntrees = ops.filter(o => o.type === "Entrée").reduce((s, o) => s + (o.montant || 0), 0);
  const totalSorties = ops.filter(o => o.type === "Sortie").reduce((s, o) => s + (o.montant || 0), 0);
  const solde = totalEntrees - totalSorties;

  const totalFactures = factures.reduce((s, f) => s + (f.montant || 0), 0);
  const facturesPayees = factures.filter(f => f.statut === "Payée").reduce((s, f) => s + (f.montant || 0), 0);
  const facturesAttente = factures.filter(f => f.statut === "En attente").reduce((s, f) => s + (f.montant || 0), 0);

  // Dernières 5 ops
  const recentOps = ops.slice(0, 8);

  const dateStr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-subtitle">Bilan financier du Cabinet Varelli</p>
          <div className="gold-line" />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="empty-icon" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>📊</div><div className="empty-title">Chargement…</div></div>
      ) : (
        <>
          {/* Solde principal */}
          <div style={{
            background: "var(--card)",
            border: `2px solid ${solde >= 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            textAlign: "center",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              background: solde >= 0
                ? "radial-gradient(ellipse at top, rgba(16,185,129,0.06) 0%, transparent 60%)"
                : "radial-gradient(ellipse at top, rgba(239,68,68,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Solde de trésorerie
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "3rem",
              fontWeight: 900,
              color: solde >= 0 ? "var(--success)" : "var(--danger)",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}>
              {solde >= 0 ? "+" : ""}{fmt(solde)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Basé sur {ops.length} opération{ops.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Stats ops */}
          <h2 className="section-title">Opérations</h2>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "2rem" }}>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-label">Entrées totales</div>
              <div className="stat-value" style={{ fontSize: "1.6rem", color: "var(--success)" }}>{fmt(totalEntrees)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📉</div>
              <div className="stat-label">Sorties totales</div>
              <div className="stat-value" style={{ fontSize: "1.6rem", color: "var(--danger)" }}>{fmt(totalSorties)}</div>
            </div>
          </div>

          {/* Stats factures */}
          <h2 className="section-title">Facturation</h2>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "2rem" }}>
            <div className="stat-card">
              <div className="stat-icon">🧾</div>
              <div className="stat-label">Facturé total</div>
              <div className="stat-value" style={{ fontSize: "1.4rem" }}>{fmt(totalFactures)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-label">Encaissé</div>
              <div className="stat-value" style={{ fontSize: "1.4rem", color: "var(--success)" }}>{fmt(facturesPayees)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-label">En attente</div>
              <div className="stat-value" style={{ fontSize: "1.4rem", color: "var(--warning)" }}>{fmt(facturesAttente)}</div>
            </div>
          </div>

          {/* Flux récents */}
          {recentOps.length > 0 && (
            <>
              <h2 className="section-title">Flux récents</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Motif</th>
                      <th style={{ textAlign: "right" }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOps.map((o, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-dim)", whiteSpace: "nowrap" }}>{dateStr(o.created_at)}</td>
                        <td>
                          <span className={`badge ${o.type === "Entrée" ? "badge-success" : "badge-danger"}`}>
                            {o.type === "Entrée" ? "↑" : "↓"} {o.type}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", maxWidth: 300 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.motif}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: o.type === "Entrée" ? "var(--success)" : "var(--danger)" }}>
                          {o.type === "Entrée" ? "+" : "-"}{fmt(o.montant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {ops.length > 8 && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <a href="/operations" className="btn btn-outline btn-sm">Voir toutes les opérations →</a>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
