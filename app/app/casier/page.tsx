"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

/* ─── Référentiel pénal ──────────────────────────────────────────────────── */
import { CHEFS_PENAL, type ChefPenal as ChefPenalType } from "@/lib/code-penal";

const CAT_COLORS: Record<string, string> = {
  Contravention: "#64748b",
  "Délit mineur": "#f59e0b",
  "Délit majeur": "#ef4444",
  Crime:          "#7c3aed",
};

const CATEGORIES = ["Contravention","Délit mineur","Délit majeur","Crime"];

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface CasierEntry {
  id: string;
  client_nom: string;
  code: string;
  infraction: string;
  categorie: string;
  amende_prononcee: string;
  detention_prononcee: string;
  date_condamnation: string;
  notes: string;
  created_by: string;
}

interface MemberColor { nom: string; couleur: string; }

const EMPTY_FORM = {
  client_nom: "", code: "", infraction: "", categorie: "Délit mineur",
  amende_prononcee: "", detention_prononcee: "", date_condamnation: "", notes: "",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function dateStr(d: string) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function parseAmende(s: string): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^0-9]/g, ""));
  return isNaN(n) ? 0 : n;
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CasierPage() {
  const user = getUser();

  const [entries, setEntries]     = useState<CasierEntry[]>([]);
  const [clients, setClients]     = useState<string[]>([]);
  const [members, setMembers]     = useState<MemberColor[]>([]);
  const [loading, setLoading]     = useState(true);

  // Filtres
  const [search, setSearch]         = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [filterClient, setFilterClient] = useState("");

  // Formulaire ajout
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [chefSearch, setChefSearch] = useState("");
  const [saving, setSaving]         = useState(false);

  // Profil client
  const [profileClient, setProfileClient] = useState<string | null>(null);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Toast
  const [toast, setToast]           = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [{ data: e }, { data: c }, { data: m }] = await Promise.all([
      supabase.from("casier").select("*").order("date_condamnation", { ascending: false }),
      supabase.from("clients").select("nom_rp").order("nom_rp"),
      supabase.from("membres").select("nom, couleur"),
    ]);
    setEntries(e || []);
    setClients([...new Set((c || []).map((x: any) => x.nom_rp as string))].sort());
    setMembers(m || []);
    setLoading(false);
  }

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function getMemberColor(nom: string) {
    return members.find(m => m.nom === nom)?.couleur || "#c9a84c";
  }

  // Filtrage
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(e =>
      (!filterMember || e.created_by === filterMember) &&
      (!filterCat || e.categorie === filterCat) &&
      (!filterClient || e.client_nom === filterClient) &&
      (!q || e.client_nom.toLowerCase().includes(q) || e.infraction.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
    );
  }, [entries, filterMember, filterCat, filterClient, search]);

  // Stats globales
  const stats = useMemo(() => {
    const total = filtered.length;
    const clients_uniques = new Set(filtered.map(e => e.client_nom)).size;
    const crimes = filtered.filter(e => e.categorie === "Crime").length;
    const recidivistes = Object.entries(
      filtered.reduce((acc, e) => { acc[e.client_nom] = (acc[e.client_nom] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).filter(([, n]) => n >= 3).length;
    return { total, clients_uniques, crimes, recidivistes };
  }, [filtered]);

  // Profil client
  const profileEntries = useMemo(
    () => entries.filter(e => e.client_nom === profileClient).sort((a, b) => (b.date_condamnation || "").localeCompare(a.date_condamnation || "")),
    [entries, profileClient]
  );

  const profileStats = useMemo(() => {
    if (!profileEntries.length) return null;
    const byCat: Record<string, number> = {};
    let totalAmende = 0;
    profileEntries.forEach(e => {
      byCat[e.categorie] = (byCat[e.categorie] || 0) + 1;
      totalAmende += parseAmende(e.amende_prononcee);
    });
    return { byCat, totalAmende, count: profileEntries.length };
  }, [profileEntries]);

  // Form
  async function save() {
    if (!supabase || !user || !form.client_nom.trim() || !form.infraction) return;
    setSaving(true);
    const { error } = await supabase.from("casier").insert([{ ...form, created_by: user.nom }]);
    if (!error) { showT("Condamnation ajoutée"); setShowForm(false); setForm({ ...EMPTY_FORM }); load(); }
    setSaving(false);
  }

  async function doDelete(id: string) {
    if (!supabase) return;
    await supabase.from("casier").delete().eq("id", id);
    setEntries(e => e.filter(x => x.id !== id));
    setConfirmDelete(null);
    showT("Supprimé");
  }

  function selectChef(c: typeof CHEFS_PENAL[0]) {
    setForm(f => ({ ...f, code: c.code, infraction: c.infraction, categorie: c.categorie, amende_prononcee: c.amende }));
    setChefSearch("");
  }

  const filteredChefs = CHEFS_PENAL.filter(c =>
    c.infraction.toLowerCase().includes(chefSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(chefSearch.toLowerCase())
  );

  // Unique values pour filtres
  const uniqueMembers = [...new Set(entries.map(e => e.created_by))].filter(Boolean);
  const uniqueClients = [...new Set(entries.map(e => e.client_nom))].sort();

  // Export profil
  function exportProfile() {
    if (!profileClient || !profileStats) return;
    const lines = [
      `CASIER JUDICIAIRE — ${profileClient}`,
      `═══════════════════════════════`,
      `Total infractions : ${profileStats.count}`,
      `Amende prononcée cumulée : ${profileStats.totalAmende.toLocaleString("fr-FR")} $`,
      ``,
      ...profileEntries.map(e =>
        `[${e.date_condamnation ? dateStr(e.date_condamnation) : "Date inconnue"}] ${e.code} — ${e.infraction} (${e.categorie})` +
        (e.amende_prononcee ? `\n   Amende : ${e.amende_prononcee}` : "") +
        (e.detention_prononcee ? ` / Détention : ${e.detention_prononcee}` : "") +
        (e.notes ? `\n   Note : ${e.notes}` : "")
      ),
      ``,
      `Cabinet BullHead — ${new Date().toLocaleDateString("fr-FR")}`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    showT("Profil copié dans le presse-papier");
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Casiers judiciaires</h1>
          <p className="page-subtitle">Registre du cabinet · {filtered.length} entrée{filtered.length !== 1 ? "s" : ""}</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => { setForm({ ...EMPTY_FORM }); setShowForm(true); }}>
          + Ajouter une condamnation
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Condamnations", value: stats.total, icon: "⚖️" },
          { label: "Personnes fichées", value: stats.clients_uniques, icon: "👤" },
          { label: "Crimes enregistrés", value: stats.crimes, icon: "🔴", color: "var(--danger)" },
          { label: "Récidivistes (3+)", value: stats.recidivistes, icon: "⚠️", color: "var(--warning)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color || "var(--gold)" }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Filtres ─── */}
      <div className="toolbar" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Client, infraction, code pénal…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>×</button>}
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Tous les clients</option>
          {uniqueClients.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} style={{ width: "auto", minWidth: 160 }}>
          <option value="">Tous les avocats</option>
          {uniqueMembers.map(m => <option key={m}>{m}</option>)}
        </select>
        {(search || filterClient || filterCat || filterMember) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterClient(""); setFilterCat(""); setFilterMember(""); }}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* ─── Badges par catégorie ─── */}
      {entries.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => {
            const count = filtered.filter(e => e.categorie === cat).length;
            if (!count) return null;
            const col = CAT_COLORS[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? "" : cat)} style={{
                padding: "0.35rem 0.875rem", borderRadius: "var(--radius)", cursor: "pointer",
                background: filterCat === cat ? col + "20" : col + "10",
                border: `1px solid ${col}${filterCat === cat ? "50" : "25"}`,
                fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem",
              }}>
                <span style={{ fontWeight: 700, color: col }}>{count}</span>
                <span style={{ fontSize: "0.72rem", color: col }}>{cat}{count > 1 ? "s" : ""}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Liste ─── */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon">⚖️</div><div className="empty-title">Chargement…</div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">{search || filterClient || filterCat || filterMember ? "Aucun résultat" : "Aucune condamnation enregistrée"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map(e => {
            const col = CAT_COLORS[e.categorie] || "#64748b";
            const memberCol = getMemberColor(e.created_by);
            const clientCount = entries.filter(x => x.client_nom === e.client_nom).length;
            return (
              <div key={e.id} style={{
                background: "var(--card)", border: `1px solid ${col}20`,
                borderRadius: "var(--radius-lg)", padding: "0.875rem 1.25rem",
                borderLeft: `4px solid ${col}`, display: "flex", alignItems: "flex-start", gap: "1rem",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.35rem", flexWrap: "wrap" }}>
                    {/* Client cliquable → profil */}
                    <button onClick={() => setProfileClient(e.client_nom)} style={{
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      fontWeight: 700, fontSize: "0.9rem", color: "var(--text)",
                      fontFamily: "'Inter',sans-serif", textDecoration: "underline dotted",
                      textUnderlineOffset: 3,
                    }}>
                      {e.client_nom}
                    </button>
                    {clientCount >= 3 && (
                      <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.45rem", borderRadius: 999, background: "rgba(239,68,68,0.15)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700 }}>
                        RÉCIDIVISTE
                      </span>
                    )}
                    <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: col, background: col + "15", padding: "0.1rem 0.45rem", borderRadius: 4 }}>{e.code}</span>
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 999, background: col + "15", color: col, border: `1px solid ${col}25` }}>{e.categorie}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: memberCol, background: memberCol + "15", padding: "0.1rem 0.45rem", borderRadius: 999, border: `1px solid ${memberCol}30` }}>
                      {e.created_by}
                    </span>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem", marginBottom: "0.35rem" }}>{e.infraction}</div>
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "var(--text-dim)", flexWrap: "wrap" }}>
                    {e.amende_prononcee && <span>💰 {e.amende_prononcee}</span>}
                    {e.detention_prononcee && <span>⏱ {e.detention_prononcee}</span>}
                    {e.date_condamnation && <span>📅 {dateStr(e.date_condamnation)}</span>}
                  </div>
                  {e.notes && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--text-dim)", background: "var(--surface)", borderRadius: 6, padding: "0.4rem 0.625rem", borderLeft: "2px solid var(--border)", fontStyle: "italic" }}>
                      {e.notes}
                    </div>
                  )}
                </div>
                {/* Supprimer uniquement ses propres entrées */}
                {e.created_by === user?.nom && (
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(e.id)} style={{ flexShrink: 0 }}>🗑️</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Profil Client ─────────────────────────────────────────────── */}
      {profileClient && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setProfileClient(null)}>
          <div className="modal modal-lg" style={{ maxHeight: "90vh" }}>
            <div className="modal-header" style={{ borderBottom: "2px solid rgba(201,168,76,0.3)" }}>
              <div>
                <h2 className="modal-title">📋 Fiche criminelle</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>{profileClient}</div>
              </div>
              <button className="modal-close" onClick={() => setProfileClient(null)}>×</button>
            </div>

            <div className="modal-body" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
              {/* Stats profil */}
              {profileStats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.625rem", marginBottom: "1.25rem" }}>
                  <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.875rem", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.5rem", color: "var(--gold)" }}>{profileStats.count}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>Infraction{profileStats.count !== 1 ? "s" : ""}</div>
                  </div>
                  {profileStats.count >= 3 && (
                    <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: "var(--radius)", padding: "0.875rem", textAlign: "center", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--danger)" }}>⚠️ RÉCIDIVISTE</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--danger)", marginTop: "0.2rem" }}>3 condamnations ou plus</div>
                    </div>
                  )}
                  {CATEGORIES.map(cat => {
                    const n = profileStats.byCat[cat] || 0;
                    if (!n) return null;
                    const col = CAT_COLORS[cat];
                    return (
                      <div key={cat} style={{ background: col + "10", borderRadius: "var(--radius)", padding: "0.875rem", textAlign: "center", border: `1px solid ${col}25` }}>
                        <div style={{ fontWeight: 700, fontSize: "1.3rem", color: col }}>{n}</div>
                        <div style={{ fontSize: "0.65rem", color: col, marginTop: "0.2rem" }}>{cat}{n > 1 ? "s" : ""}</div>
                      </div>
                    );
                  })}
                  {profileStats.totalAmende > 0 && (
                    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.875rem", textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>{profileStats.totalAmende.toLocaleString("fr-FR")} $</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>Amendes prononcées</div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline des infractions */}
              <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                Historique complet
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {profileEntries.map(e => {
                  const col = CAT_COLORS[e.categorie] || "#64748b";
                  return (
                    <div key={e.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.875rem", borderLeft: `3px solid ${col}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.7rem", color: col, background: col + "15", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{e.code}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{e.infraction}</span>
                        <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-dim)" }}>{dateStr(e.date_condamnation)}</span>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {e.amende_prononcee && <span>💰 {e.amende_prononcee}</span>}
                        {e.detention_prononcee && <span>⏱ {e.detention_prononcee}</span>}
                        <span style={{ marginLeft: "auto" }}>par {e.created_by}</span>
                      </div>
                      {e.notes && (
                        <div style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-dim)", fontStyle: "italic" }}>{e.notes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setProfileClient(null)}>Fermer</button>
              <button className="btn btn-gold" onClick={exportProfile}>📋 Copier la fiche</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal ajout condamnation ─────────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Ajouter une condamnation</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client *</label>
                <input list="casier-clients" placeholder="Nom RP" value={form.client_nom}
                  onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} autoFocus />
                <datalist id="casier-clients">
                  {clients.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>Infraction *</label>
                <input
                  placeholder="Rechercher dans le code pénal…"
                  value={chefSearch || form.infraction}
                  onChange={e => {
                    setChefSearch(e.target.value);
                    if (!e.target.value) setForm(f => ({ ...f, code: "", infraction: "", categorie: "Délit mineur" }));
                  }}
                />
                {chefSearch && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
                    {[...new Set(filteredChefs.map(c => c.categorie))].map(cat => {
                      const items = filteredChefs.filter(c => c.categorie === cat).slice(0, 8);
                      return (
                        <div key={cat}>
                          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: CAT_COLORS[cat], padding: "0.4rem 0.875rem 0.2rem", fontWeight: 700 }}>{cat}</div>
                          {items.map(c => (
                            <button key={c.code} onClick={() => selectChef(c)}
                              style={{ display: "flex", alignItems: "center", gap: "0.625rem", width: "100%", padding: "0.45rem 0.875rem", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", textAlign: "left" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--card)"}
                              onMouseLeave={e => e.currentTarget.style.background = "none"}>
                              <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: CAT_COLORS[cat], background: CAT_COLORS[cat] + "15", padding: "0.1rem 0.4rem", borderRadius: 4, flexShrink: 0 }}>{c.code}</span>
                              <span style={{ fontSize: "0.82rem", flex: 1 }}>{c.infraction}</span>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", flexShrink: 0 }}>{c.amende}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {filteredChefs.length === 0 && <div style={{ padding: "0.75rem", color: "var(--text-dim)", fontSize: "0.8rem", textAlign: "center" }}>Aucun résultat</div>}
                  </div>
                )}
                {form.code && !chefSearch && (
                  <div style={{ fontSize: "0.72rem", color: CAT_COLORS[form.categorie], marginTop: 4 }}>✓ {form.code} · {form.categorie}</div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Amende prononcée</label>
                  <input placeholder="Ex: 15 000$" value={form.amende_prononcee} onChange={e => setForm(f => ({ ...f, amende_prononcee: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Détention prononcée</label>
                  <input placeholder="Ex: 30 minutes" value={form.detention_prononcee} onChange={e => setForm(f => ({ ...f, detention_prononcee: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Date de condamnation</label>
                  <input type="date" value={form.date_condamnation} onChange={e => setForm(f => ({ ...f, date_condamnation: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} placeholder="Contexte, circonstances atténuantes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-gold" onClick={save} disabled={saving || !form.client_nom.trim() || !form.infraction} style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Enregistrement…" : "Ajouter au casier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm delete ─── */}
      {confirmDelete && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">⚠️</div>
            <div className="confirm-title">Supprimer cette entrée ?</div>
            <div className="confirm-msg">Cette action est irréversible.</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={() => doDelete(confirmDelete)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
