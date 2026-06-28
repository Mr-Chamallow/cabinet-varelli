"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getUser, getMemberColor } from "@/lib/auth";

interface Audience {
  id: string;
  titre: string;
  client: string;
  date: string;
  heure: string;
  lieu: string;
  type: string;
  notes: string;
  created_by: string;
  created_at: string;
  partage_avec?: string[];
  prive?: boolean;
  visible_pour?: string[];
}

const TYPES = ["Audience correctionnelle", "Audience civile", "Comparution immédiate", "Procès", "Entretien client", "Réunion cabinet", "Autre"];

const TYPE_ICONS: Record<string, string> = {
  "Audience correctionnelle": "⚖️",
  "Audience civile": "📋",
  "Comparution immédiate": "⏱️",
  "Procès": "🏛️",
  "Entretien client": "🤝",
  "Réunion cabinet": "👥",
  "Autre": "📌",
};

const TYPE_COLORS: Record<string, string> = {
  "Audience correctionnelle": "#ef4444",
  "Audience civile": "#3b82f6",
  "Comparution immédiate": "#f59e0b",
  "Procès": "#a855f7",
  "Entretien client": "#22c55e",
  "Réunion cabinet": "#c4b389",
  "Autre": "#64748b",
};

const EMPTY: Omit<Audience, "id" | "created_by" | "created_at"> = {
  titre: "", client: "", date: "", heure: "",
  lieu: "", type: "Audience correctionnelle", notes: "",
  partage_avec: [], prive: false, visible_pour: [],
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  return { firstDay: startOffset, daysInMonth };
}

function getWeekDates(reference: Date): Date[] {
  const monday = new Date(reference);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const JOURS_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function relativeDayLabel(dateStr: string, todayStr: string): string | null {
  const d = new Date(dateStr + "T12:00:00");
  const t = new Date(todayStr + "T12:00:00");
  const diffDays = Math.round((d.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays > 1 && diffDays <= 6) return `Dans ${diffDays} jours`;
  return null;
}

export default function AudiencesPage() {
  const user = getUser();
  const today = new Date();
  const todayStr = toISO(today);

  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [weekRef, setWeekRef] = useState(today);
  const [viewMode, setViewMode] = useState<"mois" | "semaine">("mois");
  const [editAudience, setEditAudience] = useState<Audience | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<string[]>([]);
  const [memberColors, setMemberColors] = useState<Record<string, string>>({});
  const [detailAudience, setDetailAudience] = useState<Audience | null>(null);
  const [membersList, setMembersList] = useState<string[]>([]);

  useEffect(() => { fetchAudiences(); fetchClients(); fetchMemberColors(); fetchMembersList(); }, []);

  async function fetchMembersList() {
    if (!supabase) return;
    const { data } = await supabase.from("membres").select("nom").order("nom");
    setMembersList((data || []).map((m: any) => m.nom));
  }

  async function fetchMemberColors() {
    if (!supabase) return;
    const { data } = await supabase.from("membres").select("nom, couleur");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((m: any) => { if (m.couleur) map[m.nom] = m.couleur; });
      setMemberColors(map);
    }
  }

  async function fetchAudiences() {
    if (!supabase || !user) return;
    setLoading(true);
    const { data } = await supabase.from("audiences").select("*").order("date").order("heure");
    const visibles = (data || []).filter((a: Audience) => {
      if (!a.prive) return true;
      if (a.created_by === user.nom) return true;
      if ((a.visible_pour || []).includes(user.nom)) return true;
      if ((a.partage_avec || []).includes(user.nom)) return true;
      return false;
    });
    setAudiences(visibles);
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
    setForm({ titre: a.titre, client: a.client, date: a.date, heure: a.heure, lieu: a.lieu, type: a.type, notes: a.notes, partage_avec: a.partage_avec || [], prive: a.prive || false, visible_pour: a.visible_pour || [] });
    setShowModal(true);
  }

  function openDuplicate(a: Audience) {
    setEditAudience(null);
    setForm({ titre: a.titre, client: a.client, date: "", heure: a.heure, lieu: a.lieu, type: a.type, notes: a.notes, partage_avec: a.partage_avec || [], prive: a.prive || false, visible_pour: a.visible_pour || [] });
    setShowModal(true);
  }

  function toggleMemberInField(field: "partage_avec" | "visible_pour", membre: string) {
    setForm(f => {
      const current = f[field] || [];
      const next = current.includes(membre) ? current.filter(m => m !== membre) : [...current, membre];
      return { ...f, [field]: next };
    });
  }

  function getColor(membre: string) {
    return getMemberColor(membre || "default", memberColors[membre]);
  }

  const filteredAudiences = useMemo(() => {
    let list = filterMember ? audiences.filter(a => a.created_by === filterMember) : audiences;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q) ||
        a.lieu.toLowerCase().includes(q)
      );
    }
    return list;
  }, [audiences, filterMember, search]);

  const audiencesByDate = useMemo(() => {
    const map: Record<string, Audience[]> = {};
    for (const a of filteredAudiences) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    Object.values(map).forEach(list => list.sort((a, b) => (a.heure || "").localeCompare(b.heure || "")));
    return map;
  }, [filteredAudiences]);

  const { firstDay, daysInMonth } = getMonthDays(viewYear, viewMonth);
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef]);

  const selectedAudiences = selectedDate ? (audiencesByDate[selectedDate] || []) : [];
  const prochaines = filteredAudiences.filter(a => a.date >= todayStr).slice(0, 6);

  const realWeekDates = useMemo(() => getWeekDates(today), []);
  const realWeekISO = realWeekDates.map(toISO);
  const audiencesCetteSemaine = filteredAudiences.filter(a => realWeekISO.includes(a.date));
  const audiencesAujourdhui = filteredAudiences.filter(a => a.date === todayStr);

  function downloadICS(a: Audience) {
    const dt = a.date.replace(/-/g, "");
    const time = (a.heure || "09:00").replace(":", "") + "00";
    const dtStart = `${dt}T${time}`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `SUMMARY:${a.titre}`,
      `DTSTART:${dtStart}`,
      `DESCRIPTION:${a.client ? `Client: ${a.client}. ` : ""}${a.notes || ""}`,
      `LOCATION:${a.lieu || ""}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${a.titre.replace(/[^a-z0-9]/gi, "_")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function navMonth(delta: number) {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m); setViewYear(y);
  }

  function navWeek(delta: number) {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + delta * 7);
    setWeekRef(d);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekRef(new Date());
    setSelectedDate(todayStr);
  }

  function AudienceCard({ a, compact = false }: { a: Audience; compact?: boolean }) {
    const col = getColor(a.created_by);
    const typeCol = TYPE_COLORS[a.type] || "#64748b";
    const relLabel = relativeDayLabel(a.date, todayStr);

    return (
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius)",
        padding: compact ? "0.6rem 0.75rem" : "0.8rem 0.9rem",
        borderLeft: `3px solid ${col}`,
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: compact ? "0.78rem" : "0.85rem" }}>{TYPE_ICONS[a.type] || "📌"}</span>
            {a.prive && <span title="Rendez-vous privé" style={{ fontSize: "0.7rem" }}>🔒</span>}
            <span style={{ fontWeight: 600, fontSize: compact ? "0.8rem" : "0.875rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.titre}
            </span>
          </div>
          {relLabel && (
            <span style={{
              fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: 999, flexShrink: 0,
              background: relLabel === "Aujourd'hui" ? "var(--gold-muted)" : "rgba(255,255,255,0.04)",
              color: relLabel === "Aujourd'hui" ? "var(--gold)" : "var(--text-dim)",
              border: `1px solid ${relLabel === "Aujourd'hui" ? "rgba(196,179,137,0.3)" : "var(--border)"}`,
              fontWeight: 600, whiteSpace: "nowrap",
            }}>{relLabel}</span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.7rem", fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>
          {a.heure && <span>⏱ {a.heure}</span>}
          {a.client && <span>👤 {a.client}</span>}
          {a.lieu && <span>📍 {a.lieu}</span>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <span style={{
              fontSize: "0.62rem", padding: "0.1rem 0.4rem", borderRadius: 999, alignSelf: "flex-start",
              background: col + "18", color: col, border: `1px solid ${col}30`, fontWeight: 600,
            }}>{a.created_by || "?"}</span>
            <span style={{
              fontSize: "0.6rem", color: typeCol, fontWeight: 500, paddingLeft: "0.2rem",
            }}>{a.type}</span>
            {(a.partage_avec && a.partage_avec.length > 0) && (
              <span style={{ fontSize: "0.6rem", color: "var(--info)", paddingLeft: "0.2rem" }}>
                partagé avec {a.partage_avec.map(m => "@" + m.split(" ")[0]).join(", ")}
              </span>
            )}
          </div>

          {!compact && (
            <div style={{ display: "flex", gap: "0.2rem", flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadICS(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Exporter .ics">📥</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openDuplicate(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Dupliquer">⧉</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Modifier">✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteAudience(a.id)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem", color: "var(--danger)" }} title="Supprimer">🗑️</button>
            </div>
          )}
        </div>
      </div>
    );
  }

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

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.95rem",
          borderRadius: "var(--radius)", background: "var(--card)", border: "1px solid var(--border)",
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--gold)" }}>
            {audiencesCetteSemaine.length}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>cette semaine</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.95rem",
          borderRadius: "var(--radius)",
          background: audiencesAujourdhui.length > 0 ? "var(--gold-muted)" : "var(--card)",
          border: `1px solid ${audiencesAujourdhui.length > 0 ? "rgba(196,179,137,0.3)" : "var(--border)"}`,
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.1rem", color: audiencesAujourdhui.length > 0 ? "var(--gold)" : "var(--text)" }}>
            {audiencesAujourdhui.length}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>aujourd'hui</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={goToday} style={{ marginLeft: "auto" }}>
          📍 Aujourd'hui
        </button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input placeholder="Rechercher une audience, un client…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["mois", "semaine"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: "0.5rem 1rem", borderRadius: "var(--radius)", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", fontWeight: viewMode === m ? 700 : 400,
              background: viewMode === m ? "var(--gold-muted)" : "var(--surface)",
              border: `1px solid ${viewMode === m ? "rgba(196,179,137,0.4)" : "var(--border)"}`,
              color: viewMode === m ? "var(--gold)" : "var(--text-muted)", transition: "all var(--t-fast) var(--ease)",
            }}>{m === "mois" ? "📅 Mois" : "🗂 Semaine"}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }}>

        <div className="card" style={{ overflow: "hidden", position: "relative" }}>
          <span className="wandering-cat" aria-hidden="true">🐈</span>
          {viewMode === "mois" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navMonth(-1)}>←</button>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--gold)" }}>
                  {MOIS[viewMonth]} {viewYear}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navMonth(1)}>→</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {JOURS.map(j => (
                  <div key={j} style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-dim)", padding: "0.4rem 0", fontWeight: 600 }}>{j}</div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const aud = audiencesByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasUrgent = isToday && aud.length > 0;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      style={{
                        minHeight: 72,
                        borderRadius: 8,
                        padding: "0.35rem 0.4rem",
                        cursor: "pointer",
                        background: isSelected ? "var(--gold-muted)" : isToday ? "rgba(196,179,137,0.05)" : "var(--surface)",
                        border: `1px solid ${isSelected ? "rgba(196,179,137,0.5)" : isToday ? "rgba(196,179,137,0.18)" : "var(--border)"}`,
                        transition: "all var(--t-fast) var(--ease)",
                        position: "relative",
                        animation: hasUrgent && !isSelected ? "todayPulse 2.5s ease-in-out infinite" : "none",
                      }}
                    >
                      <div style={{
                        fontSize: "0.78rem",
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? "var(--gold)" : isSelected ? "var(--gold)" : "var(--text-muted)",
                        marginBottom: "0.3rem",
                      }}>{day}</div>

                      {aud.slice(0, 3).map((a, idx) => (
                        <div key={idx} title={`${a.titre} — ${a.type}`} style={{
                          height: 4, borderRadius: 2,
                          background: getColor(a.created_by),
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
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navWeek(-1)}>←</button>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "var(--gold)" }}>
                  {weekDates[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — {weekDates[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navWeek(1)}>→</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {weekDates.map((d, idx) => {
                  const dStr = toISO(d);
                  const aud = audiencesByDate[dStr] || [];
                  const isToday = dStr === todayStr;
                  return (
                    <div key={dStr} style={{
                      borderRadius: "var(--radius)",
                      border: `1px solid ${isToday ? "rgba(196,179,137,0.25)" : "var(--border)"}`,
                      background: isToday ? "rgba(196,179,137,0.04)" : "transparent",
                      padding: "0.6rem 0.7rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: aud.length ? "0.5rem" : 0 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem", color: isToday ? "var(--gold)" : "var(--text-muted)", minWidth: 64 }}>
                          {JOURS_LONG[idx]}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{d.getDate()} {MOIS[d.getMonth()].toLowerCase()}</span>
                        {aud.length > 0 && (
                          <span style={{ marginLeft: "auto", fontSize: "0.66rem", color: "var(--text-dim)" }}>
                            {aud.length} audience{aud.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {aud.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {aud.map(a => {
                            const col = getColor(a.created_by);
                            return (
                              <button
                                key={a.id}
                                onClick={() => setDetailAudience(a)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "0.7rem",
                                  width: "100%", textAlign: "left",
                                  padding: "0.5rem 0.65rem", borderRadius: "var(--radius)",
                                  background: "var(--surface)", border: "1px solid var(--border)",
                                  cursor: "pointer", fontFamily: "'Inter',sans-serif",
                                  transition: "border-color var(--t-fast) var(--ease), background var(--t-fast) var(--ease)",
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = col + "50"; e.currentTarget.style.background = "var(--card-hover)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
                              >
                                {/* Heure mise en évidence, style Dashboard */}
                                <div style={{ flexShrink: 0, textAlign: "center", minWidth: 42 }}>
                                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", lineHeight: 1 }}>
                                    {a.heure || "—"}
                                  </div>
                                </div>
                                <div style={{ width: 3, height: 28, borderRadius: 2, background: col, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                    <span style={{ fontSize: "0.78rem" }}>{TYPE_ICONS[a.type] || "📌"}</span>
                                    <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {a.titre}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.1rem" }}>
                                    {a.client && <span>{a.client}</span>}
                                  </div>
                                </div>
                                <span style={{
                                  fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: 999, flexShrink: 0,
                                  background: col + "18", color: col, border: `1px solid ${col}30`, fontWeight: 600,
                                }}>{(a.created_by || "?").split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {audiences.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Membres</span>
                {filterMember && <button onClick={() => setFilterMember(null)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "0.7rem", cursor: "pointer" }}>Réinitialiser</button>}
              </div>
              {Array.from(new Set(audiences.map(a => a.created_by).filter(Boolean))).map(membre => {
                const col = getColor(membre);
                const active = filterMember === membre;
                return (
                  <button key={membre} onClick={() => setFilterMember(active ? null : membre)} style={{
                    display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem",
                    color: active ? col : "var(--text-muted)",
                    background: active ? col + "15" : "transparent",
                    border: `1px solid ${active ? col + "40" : "transparent"}`,
                    borderRadius: 999, padding: "0.2rem 0.6rem", cursor: "pointer",
                    fontFamily: "'Inter',sans-serif", opacity: filterMember && !active ? 0.4 : 1,
                    transition: "all var(--t-fast) var(--ease)",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    {membre}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

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
                  {selectedAudiences.map(a => <AudienceCard key={a.id} a={a} />)}
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.875rem" }}>📅 Prochaines audiences</h3>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: "var(--radius)" }} />)}
              </div>
            ) : prochaines.length === 0 ? (
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0" }}>Aucune audience planifiée</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {prochaines.map((a) => (
                  <div key={a.id} className="stagger-item" onClick={() => { setSelectedDate(a.date); setViewYear(Number(a.date.split("-")[0])); setViewMonth(Number(a.date.split("-")[1]) - 1); setViewMode("mois"); }} style={{ cursor: "pointer" }}>
                    <AudienceCard a={a} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal détail audience — ouverture en zoom */}
      {detailAudience && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetailAudience(null)}>
          <div className="modal" style={{ maxWidth: 460, animation: "modalZoomIn var(--t-base) var(--ease)" }}>
            <div className="modal-header" style={{ borderBottom: `2px solid ${getColor(detailAudience.created_by)}40` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.3rem" }}>{TYPE_ICONS[detailAudience.type] || "📌"}</span>
                <h2 className="modal-title">{detailAudience.titre}</h2>
              </div>
              <button className="modal-close" onClick={() => setDetailAudience(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Date / heure en évidence */}
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                background: "var(--gold-muted)", border: "1px solid rgba(196,179,137,0.25)",
                borderRadius: "var(--radius)", padding: "1rem 1.25rem",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.8rem", color: "var(--gold)", lineHeight: 1 }}>
                    {new Date(detailAudience.date + "T12:00:00").getDate()}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                    {new Date(detailAudience.date + "T12:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border-light)" }} />
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--text)" }}>
                    {detailAudience.heure || "Heure non précisée"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                    {new Date(detailAudience.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {[
                  { label: "Type", value: detailAudience.type },
                  { label: "Client", value: detailAudience.client || "—" },
                  { label: "Lieu", value: detailAudience.lieu || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-dim)" }}>{r.label}</span>
                    <span style={{ fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
                {detailAudience.notes && (
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>Notes</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.75rem" }}>
                      {detailAudience.notes}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: getColor(detailAudience.created_by) }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Créée par <strong style={{ color: "var(--text)" }}>{detailAudience.created_by}</strong></span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => downloadICS(detailAudience)}>📥 Exporter .ics</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { openDuplicate(detailAudience); setDetailAudience(null); }}>⧉ Dupliquer</button>
              <button className="btn btn-outline btn-sm" onClick={() => { openEdit(detailAudience); setDetailAudience(null); }}>✏️ Modifier</button>
              <button className="btn btn-danger btn-sm" onClick={() => { deleteAudience(detailAudience.id); setDetailAudience(null); }}>🗑️ Supprimer</button>
            </div>
          </div>
        </div>
      )}

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
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {TYPES.map(t => {
                      const active = form.type === t;
                      const col = TYPE_COLORS[t];
                      return (
                        <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          padding: "0.4rem 0.7rem", borderRadius: 999, cursor: "pointer",
                          fontFamily: "'Inter',sans-serif", fontSize: "0.76rem", fontWeight: active ? 700 : 400,
                          background: active ? col + "18" : "var(--surface)",
                          border: `1px solid ${active ? col + "50" : "var(--border)"}`,
                          color: active ? col : "var(--text-muted)",
                          transition: "all var(--t-fast) var(--ease)",
                        }}>
                          <span>{TYPE_ICONS[t]}</span>{t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea rows={3} placeholder="Informations complémentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {/* Partager avec (@mention) */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Partager avec @</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {membersList.filter(m => m !== user?.nom).map(m => {
                      const active = (form.partage_avec || []).includes(m);
                      const col = getColor(m);
                      return (
                        <button key={m} type="button" onClick={() => toggleMemberInField("partage_avec", m)} style={{
                          display: "flex", alignItems: "center", gap: "0.3rem",
                          padding: "0.35rem 0.65rem", borderRadius: 999, cursor: "pointer",
                          fontFamily: "'Inter',sans-serif", fontSize: "0.74rem", fontWeight: active ? 700 : 400,
                          background: active ? col + "18" : "var(--surface)",
                          border: `1px solid ${active ? col + "50" : "var(--border)"}`,
                          color: active ? col : "var(--text-muted)",
                          transition: "all var(--t-fast) var(--ease)",
                        }}>
                          {active && "@"}{m}
                        </button>
                      );
                    })}
                    {membersList.length <= 1 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Aucun autre membre à partager.</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                    Les membres sélectionnés verront ce rendez-vous même s'il est marqué privé.
                  </div>
                </div>

                {/* RDV privé */}
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!form.prive} onChange={e => setForm(f => ({ ...f, prive: e.target.checked }))} style={{ width: "auto" }} />
                    🔒 Rendez-vous privé (masqué pour les autres membres)
                  </label>
                  {form.prive && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>Visible uniquement par :</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {membersList.filter(m => m !== user?.nom).map(m => {
                          const active = (form.visible_pour || []).includes(m);
                          const col = getColor(m);
                          return (
                            <button key={m} type="button" onClick={() => toggleMemberInField("visible_pour", m)} style={{
                              display: "flex", alignItems: "center", gap: "0.3rem",
                              padding: "0.35rem 0.65rem", borderRadius: 999, cursor: "pointer",
                              fontFamily: "'Inter',sans-serif", fontSize: "0.74rem", fontWeight: active ? 700 : 400,
                              background: active ? col + "18" : "var(--surface)",
                              border: `1px solid ${active ? col + "50" : "var(--border)"}`,
                              color: active ? col : "var(--text-muted)",
                              transition: "all var(--t-fast) var(--ease)",
                            }}>
                              {active && "✓"} {m}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: "0.4rem" }}>
                        Vous voyez toujours vos propres rendez-vous privés. Les membres ci-dessus pourront aussi le voir.
                      </div>
                    </div>
                  )}
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
