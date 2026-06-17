"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser, getMemberColor } from "@/lib/auth";

interface Audience {
  id: string;
  titre: string;
  client: string;
  date: string;      // ISO date YYYY-MM-DD
  heure: string;     // HH:MM
  lieu: string;
  type: string;
  notes: string;
  created_by: string;
  created_at: string;
}

const TYPES = ["Audience correctionnelle", "Audience civile", "Comparution immédiate", "Procès", "Entretien client", "Réunion cabinet", "Autre"];

const EMPTY: Omit<Audience, "id" | "created_by" | "created_at"> = {
  titre: "", client: "", date: "", heure: "",
  lieu: "", type: "Audience correctionnelle", notes: "",
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Start week on Monday
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  return { firstDay: startOffset, daysInMonth };
}

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const TYPE_COLORS: Record<string, string> = {
  "Audience correctionnelle": "#ef4444",
  "Audience civile": "#3b82f6",
  "Comparution immédiate": "#f59e0b",
  "Procès": "#7c3aed",
  "Entretien client": "#10b981",
  "Réunion cabinet": "#D4AF37",
  "Autre": "#64748b",
};

export default function AudiencesPage() {
  const user = getUser();
  const today = new Date();

  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [editAudience, setEditAudience] = useState<Audience | null>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [memberColors, setMemberColors] = useState<Record<string,string>>({});

  useEffect(() => { fetchAudiences(); fetchClients(); fetchMemberColors(); }, []);

  async function fetchMemberColors() {
    if (!supabase) return;
    const { data } = await supabase.from("membres").select("nom, couleur");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((m: any) => { if (m.couleur) map[m.nom] = m.couleur; });
      setMemberColors(map);
    }
  }

  function getColor(nom: string) {
    return memberColors[nom] || getMemberColor(nom);
  }

  async function fetchAudiences() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("audiences").select("*").order("date").order("heure");
    setAudiences(data || []);
    setLoading(false);
  }

  async function fetchClients() {
    if (!supabase) return;
    const { data } = await supabase.from("clients").select("nom_rp").order("nom_rp");
    setClients((data || []).map((c: any) => c.nom_rp));
  }

  async function saveAudience() {
    if (!supabase || !user) return;
    setSaving(true);
    if (editAudience) {
      await supabase.from("audiences").update({ ...form }).eq("id", editAudience.id);
    } else {
      await supabase.from("audiences").insert([{ ...form, created_by: user.nom }]);
    }
    setSaving(false);
    setShowModal(false);
    setEditAudience(null);
    setForm({ ...EMPTY });
    fetchAudiences();
  }

  async function deleteAudience(id: string) {
    if (!supabase) return;
    await supabase.from("audiences").delete().eq("id", id);
    fetchAudiences();
  }

  function openCreate(date?: string) {
    setEditAudience(null);
    setForm({ ...EMPTY, date: date || "" });
    setShowModal(true);
  }

  function openEdit(a: Audience) {
    setEditAudience(a);
    setForm({ titre: a.titre, client: a.client, date: a.date, heure: a.heure, lieu: a.lieu, type: a.type, notes: a.notes });
    setShowModal(true);
  }

  // Calendrier
  const { firstDay, daysInMonth } = getMonthDays(viewYear, viewMonth);

  const audiencesByDate = useMemo(() => {
    const map: Record<string, Audience[]> = {};
    for (const a of audiences) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [audiences]);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedAudiences = selectedDate ? (audiencesByDate[selectedDate] || []) : [];

  const prochaines = audiences.filter(a => a.date >= todayStr).slice(0, 5);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Calendrier des audiences</h1>
          <p className="page-subtitle">Agenda partagé · Visible par tous les membres</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => openCreate()}>+ Nouvelle audience</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        {/* CALENDRIER */}
        <div className="card">
          {/* Navigation mois */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
            >←</button>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--gold)" }}>
              {MOIS[viewMonth]} {viewYear}
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
            >→</button>
          </div>

          {/* Jours de la semaine */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {JOURS.map(j => (
              <div key={j} style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-dim)", padding: "0.4rem 0", fontWeight: 600 }}>{j}</div>
            ))}
          </div>

          {/* Cases */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {/* Offset début de mois */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const aud = audiencesByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 68,
                    borderRadius: 8,
                    padding: "0.35rem 0.4rem",
                    cursor: "pointer",
                    background: isSelected ? "var(--gold-muted)" : isToday ? "rgba(212,175,55,0.06)" : "var(--surface)",
                    border: `1px solid ${isSelected ? "rgba(212,175,55,0.5)" : isToday ? "rgba(212,175,55,0.2)" : "var(--border)"}`,
                    transition: "all 0.12s",
                    position: "relative",
                  }}
                >
                  <div style={{
                    fontSize: "0.78rem",
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? "var(--gold)" : isSelected ? "var(--gold)" : "var(--text-muted)",
                    marginBottom: "0.3rem",
                  }}>{day}</div>

                  {aud.slice(0, 3).map((a, idx) => (
                    <div key={idx} style={{
                      height: 4, borderRadius: 2,
                      background: getMemberColor(a.created_by || "default", memberColors[a.created_by]),
                      marginBottom: 2,
                    }} />
                  ))}
                  {aud.length > 3 && (
                    <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>+{aud.length - 3}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Légende membres */}
          {audiences.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <div style={{ width: "100%", fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Membres</div>
              {Array.from(new Set(audiences.map(a => a.created_by).filter(Boolean))).map(membre => (
                <div key={membre} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: getMemberColor(membre, memberColors[membre]), flexShrink: 0 }} />
                  {membre}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR DROITE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Audiences du jour sélectionné */}
          {selectedDate && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => openCreate(selectedDate)}>+</button>
              </div>

              {selectedAudiences.length === 0 ? (
                <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0" }}>
                  Aucune audience ce jour
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedAudiences.map(a => (
                    <div key={a.id} style={{
                      background: "var(--surface)",
                      borderRadius: "var(--radius)",
                      padding: "0.75rem",
                      borderLeft: `3px solid ${getMemberColor(a.created_by || "default", memberColors[a.created_by])}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.84rem", marginBottom: "0.2rem" }}>{a.titre}</div>
                          {a.heure && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>🕐 {a.heure}</div>}
                          {a.client && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>👤 {a.client}</div>}
                          {a.lieu && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📍 {a.lieu}</div>}
                          {a.notes && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.3rem", fontStyle: "italic" }}>{a.notes}</div>}
                        </div>
                        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0, marginLeft: "0.5rem" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteAudience(a.id)} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prochaines audiences */}
          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.875rem" }}>📅 Prochaines audiences</h3>
            {loading ? (
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Chargement…</div>
            ) : prochaines.length === 0 ? (
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>Aucune audience planifiée</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {prochaines.map(a => (
                  <div
                    key={a.id}
                    onClick={() => { setSelectedDate(a.date); setViewYear(Number(a.date.split("-")[0])); setViewMonth(Number(a.date.split("-")[1]) - 1); }}
                    style={{
                      cursor: "pointer",
                      background: "var(--surface)",
                      borderRadius: 8, padding: "0.6rem 0.75rem",
                      borderLeft: `3px solid ${getMemberColor(a.created_by || "default", memberColors[a.created_by])}`,
                      transition: "opacity 0.1s",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.82rem", marginBottom: "0.15rem" }}>{a.titre}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                      {new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      {a.heure && ` à ${a.heure}`}
                    </div>
                    {a.client && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>👤 {a.client}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editAudience ? "Modifier l'audience" : "Nouvelle audience"}</h2>
              <button className="modal-close" onClick={() => { setShowModal(false); setEditAudience(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Titre *</label>
                  <input placeholder="Ex : Procès Pesto Aziz" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} autoFocus />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Heure</label>
                  <input type="time" value={form.heure} onChange={e => setForm(f => ({ ...f, heure: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Client</label>
                  <input list="clients-list" placeholder="Nom RP" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
                  <datalist id="clients-list">
                    {clients.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Lieu</label>
                  <input placeholder="Tribunal, commissariat…" value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea rows={3} placeholder="Informations complémentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditAudience(null); }}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={saveAudience}
                disabled={saving || !form.titre.trim() || !form.date}
              >{saving ? "Sauvegarde…" : editAudience ? "Modifier" : "Créer l'audience"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
