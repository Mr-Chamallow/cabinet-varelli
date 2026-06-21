"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { getUser } from "@/lib/auth";

interface Facture {
  id: string;
  numero: string;
  client: string;
  montant: number;
  description: string;
  statut: string;
  created_at: string;
}

const STATUTS = ["En attente", "Payée", "Annulée", "Contentieux"];
const EMPTY_FORM = { numero: "", client: "", montant: 0, description: "", statut: "En attente" };

const BADGE_STATUT: Record<string, string> = {
  "En attente": "badge-warning",
  Payée: "badge-success",
  Annulée: "badge-muted",
  Contentieux: "badge-danger",
};

function genNumero() {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `FAC-${new Date().getFullYear()}-${n}`;
}

function formatMontant(n: number) {
  return n?.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) || "—";
}

function dateStr(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/* ─── PDF Generator ─────────────────────────────────────── */
function generatePDF(f: Facture) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;

  // Background
  doc.setFillColor(10, 15, 30);
  doc.rect(0, 0, W, H, "F");

  // Gold border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.rect(12, 12, W - 24, H - 24);

  // Inner subtle border
  doc.setLineWidth(0.2);
  doc.setDrawColor(42, 58, 85);
  doc.rect(14, 14, W - 28, H - 28);

  // Header background band
  doc.setFillColor(26, 34, 53);
  doc.rect(14, 14, W - 28, 55, "F");

  // Gold top accent bar
  doc.setFillColor(212, 175, 55);
  doc.rect(14, 14, W - 28, 2, "F");

  // Cabinet name
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CABINET VARELLI", W / 2, 34, { align: "center" });

  // Divider gold
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(60, 39, W - 60, 39);

  // Motto
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("« Seul Dieu peut juger »", W / 2, 46, { align: "center" });

  // Numero facture
  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`FACTURE ${f.numero}`, W / 2, 58, { align: "center" });

  // Gold separator line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.2);
  doc.line(20, 72, W - 20, 72);

  // Statut badge area
  const statutColor: Record<string, [number, number, number]> = {
    Payée: [16, 185, 129],
    "En attente": [245, 158, 11],
    Annulée: [100, 116, 139],
    Contentieux: [239, 68, 68],
  };
  const sc = statutColor[f.statut] || [100, 116, 139];
  doc.setFillColor(...sc);
  doc.roundedRect(W / 2 - 22, 75, 44, 8, 4, 4, "F");
  doc.setTextColor(10, 15, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(f.statut.toUpperCase(), W / 2, 80.5, { align: "center" });

  // Fields
  const fields: [string, string][] = [
    ["Client", f.client],
    ["Date d'émission", dateStr(f.created_at)],
    ["Montant", formatMontant(f.montant)],
    ["Description", f.description || "—"],
  ];

  let y = 100;
  fields.forEach(([label, value]) => {
    // Label
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), 25, y);

    // Value
    doc.setTextColor(241, 245, 249);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    if (label === "Montant") {
      doc.setTextColor(212, 175, 55);
    }

    // Wrap description
    if (label === "Description" && value.length > 60) {
      const lines = doc.splitTextToSize(value, W - 55);
      doc.text(lines, 25, y + 6);
      y += 6 + (lines.length * 6) + 14;
    } else {
      doc.text(value, 25, y + 6);
      y += 20;
    }

    // Separator
    doc.setDrawColor(42, 58, 85);
    doc.setLineWidth(0.1);
    doc.line(25, y - 6, W - 25, y - 6);
  });

  // Total box
  doc.setFillColor(26, 34, 53);
  doc.roundedRect(20, y, W - 40, 28, 4, 4, "F");
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, y, W - 40, 28, 4, 4, "S");

  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("TOTAL DÛ", 35, y + 10);

  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(formatMontant(f.montant), W - 35, y + 16, { align: "right" });

  // Footer
  doc.setFillColor(26, 34, 53);
  doc.rect(14, H - 30, W - 28, 16, "F");

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Cabinet Varelli · Los Santos, San Andreas · Confidentiel", W / 2, H - 22, { align: "center" });
  doc.text("Ce document est strictement confidentiel et destiné uniquement à son destinataire.", W / 2, H - 17, { align: "center" });

  // Gold bottom bar
  doc.setFillColor(212, 175, 55);
  doc.rect(14, H - 16, W - 28, 2, "F");

  doc.save(`Facture-${f.numero}.pdf`);
}

/* ─── Aperçu Modal ───────────────────────────────────────── */
function FacturePreview({ facture, onClose }: { facture: Facture; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ background: "var(--bg)", borderColor: "rgba(212,175,55,0.4)" }}>
        {/* Preview inner */}
        <div style={{
          margin: "1.5rem",
          background: "#0a0f1e",
          border: "1.5px solid var(--gold)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {/* Header band */}
          <div style={{
            background: "#111827",
            borderBottom: "1px solid rgba(212,175,55,0.3)",
            padding: "2.5rem 2rem",
            textAlign: "center",
            position: "relative",
          }}>
            {/* Top gold bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />

            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.7rem",
              letterSpacing: "0.25em",
              color: "var(--text-dim)",
              marginBottom: "0.75rem",
            }}>
              CABINET
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "2rem",
              fontWeight: 900,
              color: "var(--gold)",
              letterSpacing: "0.1em",
              marginBottom: "0.5rem",
            }}>
              VARELLI
            </div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              letterSpacing: "0.12em",
              marginBottom: "1.25rem",
            }}>
              « Seul Dieu peut juger »
            </div>

            <div style={{ width: 120, height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", margin: "0 auto 1.25rem" }} />

            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem",
              letterSpacing: "0.15em",
              color: "var(--text-muted)",
              marginBottom: "0.5rem",
            }}>
              FACTURE
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text)",
            }}>
              {facture.numero}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <span className={`badge ${BADGE_STATUT[facture.statut] || "badge-muted"}`} style={{ padding: "0.35rem 1rem" }}>
                {facture.statut}
              </span>
            </div>
          </div>

          {/* Details */}
          <div style={{ padding: "2rem" }}>
            {[
              { label: "Client", value: facture.client, icon: "👤" },
              { label: "Date d'émission", value: dateStr(facture.created_at), icon: "📅" },
              { label: "Description", value: facture.description || "—", icon: "📝" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                display: "flex",
                gap: "1rem",
                padding: "1rem 0",
                borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: "1.1rem", opacity: 0.6 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                    {label}
                  </div>
                  <div style={{ color: "var(--text)", fontWeight: 500 }}>{value}</div>
                </div>
              </div>
            ))}

            {/* Montant total */}
            <div style={{
              marginTop: "1.5rem",
              background: "var(--surface)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 12,
              padding: "1.25rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.2rem" }}>
                  Total dû
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Honoraires cabinet</div>
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--gold)",
              }}>
                {formatMontant(facture.montant)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            background: "#111827",
            borderTop: "1px solid rgba(212,175,55,0.2)",
            padding: "1rem 2rem",
            textAlign: "center",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            letterSpacing: "0.05em",
          }}>
            Cabinet Varelli · Los Santos, San Andreas · Document confidentiel
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 1.5rem 1.5rem" }}>
          <button className="btn btn-outline" onClick={onClose}>Fermer</button>
          <button className="btn btn-gold" onClick={() => generatePDF(facture)}>⬇ Télécharger PDF</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────── */
export default function FacturesPage() {
  const user = getUser();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [clients, setClients] = useState<{ nom_rp: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Facture | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Facture | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase || !user) { setLoading(false); return; }
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from("factures").select("*").eq("created_by", user.nom).order("created_at", { ascending: false }),
      supabase.from("clients").select("nom_rp").eq("created_by", user.nom).order("nom_rp"),
    ]);
    setFactures(f || []);
    setClients(c || []);
    setLoading(false);
  }

  function showToast(msg: string, type: "success" | "danger" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function save() {
    if (!supabase || !user || !form.client.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("factures").insert([{ ...form, created_by: user.nom }]);
      if (error) throw error;
      showToast("Facture créée");
      setShowForm(false);
      setForm({ ...EMPTY_FORM, numero: genNumero() });
      load();
    } catch {
      showToast("Erreur lors de la création", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!supabase || !confirmDelete) return;
    await supabase.from("factures").delete().eq("id", confirmDelete.id);
    setConfirmDelete(null);
    showToast("Facture supprimée");
    load();
  }

  async function updateStatut(id: string, statut: string) {
    if (!supabase) return;
    await supabase.from("factures").update({ statut }).eq("id", id);
    showToast(`Statut mis à jour : ${statut}`);
    load();
  }

  const filtered = factures.filter((f) => {
    const matchS = f.numero?.toLowerCase().includes(search.toLowerCase()) || f.client?.toLowerCase().includes(search.toLowerCase());
    const matchSt = !filterStatut || f.statut === filterStatut;
    return matchS && matchSt;
  });

  const totalGlobal = factures.reduce((s, f) => s + (f.montant || 0), 0);
  const totalPayees = factures.filter(f => f.statut === "Payée").reduce((s, f) => s + (f.montant || 0), 0);
  const totalAttente = factures.filter(f => f.statut === "En attente").reduce((s, f) => s + (f.montant || 0), 0);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Factures</h1>
          <p className="page-subtitle">{factures.length} facture{factures.length !== 1 ? "s" : ""} émise{factures.length !== 1 ? "s" : ""}</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({ ...EMPTY_FORM, numero: genNumero() }); setShowForm(true); }}>
          + Nouvelle facture
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "2rem" }}>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Chiffre d'affaires</div>
          <div className="stat-value" style={{ fontSize: "1.6rem" }}>{formatMontant(totalGlobal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Encaissé</div>
          <div className="stat-value" style={{ fontSize: "1.6rem", color: "var(--success)" }}>{formatMontant(totalPayees)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">En attente</div>
          <div className="stat-value" style={{ fontSize: "1.6rem", color: "var(--warning)" }}>{formatMontant(totalAttente)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Rechercher par numéro, client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
        </div>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Facture cards */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>🧾</div><div className="empty-title">Chargement…</div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧾</div>
          <div className="empty-title">{search || filterStatut ? "Aucun résultat" : "Aucune facture"}</div>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Créez votre première facture pour commencer.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((f) => (
            <div key={f.id} className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {/* Left: numero + client */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--gold)", fontWeight: 700 }}>
                      {f.numero}
                    </span>
                    <span className={`badge ${BADGE_STATUT[f.statut] || "badge-muted"}`}>{f.statut}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.2rem" }}>{f.client}</div>
                  {f.description && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
                      {f.description}
                    </div>
                  )}
                </div>

                {/* Middle: montant */}
                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--gold)" }}>
                    {formatMontant(f.montant)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{dateStr(f.created_at)}</div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  {/* Statut rapide */}
                  <select
                    value={f.statut}
                    onChange={(e) => updateStatut(f.id, e.target.value)}
                    style={{ width: "auto", padding: "0.4rem 0.7rem", fontSize: "0.78rem" }}
                  >
                    {STATUTS.map((s) => <option key={s}>{s}</option>)}
                  </select>

                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPreview(f)}
                    title="Aperçu"
                  >
                    👁 Aperçu
                  </button>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => generatePDF(f)}
                    title="Télécharger PDF"
                  >
                    ⬇ PDF
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setConfirmDelete(f)}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Nouvelle facture</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Numéro</label>
                    <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      {STATUTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Client *</label>
                  <input
                    placeholder="Nom RP du client"
                    value={form.client}
                    onChange={(e) => setForm({ ...form, client: e.target.value })}
                    list="clients-fac"
                  />
                  <datalist id="clients-fac">
                    {clients.map((c, i) => <option key={i} value={c.nom_rp} />)}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Montant ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Description des prestations</label>
                  <textarea
                    rows={4}
                    placeholder="Honoraires de défense, consultation juridique, rédaction d'actes…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={save}
                disabled={saving || !form.client.trim()}
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Création…" : "Émettre la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aperçu */}
      {preview && <FacturePreview facture={preview} onClose={() => setPreview(null)} />}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette facture ?</div>
            <div className="confirm-msg">
              <strong style={{ color: "var(--text)" }}>{confirmDelete.numero}</strong> sera définitivement supprimée.
            </div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={doDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✅" : "❌"} {toast.msg}</div>
        </div>
      )}
    </div>
  );
}
