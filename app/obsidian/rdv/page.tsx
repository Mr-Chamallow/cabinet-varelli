"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getMemberColor, hasPermission } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Modal } from "@/components/ui/Modal";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoAction } from "@/lib/useUndoAction";
import { notifyDiscord } from "@/lib/notifyDiscord";

interface Operation {
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
  contrat_ref?: string;
  rappel_minutes?: number;
  visible_pour?: string[];
}

const TYPES = ["Livraison", "Braquage", "Surveillance", "Réunion", "Rencontre fournisseur", "Récupération", "Intimidation", "Entraînement", "Autre"];

const TYPE_ICONS: Record<string, string> = {
  "Livraison": "📦",
  "Braquage": "💰",
  "Surveillance": "👁️",
  "Réunion": "👥",
  "Rencontre fournisseur": "🤝",
  "Récupération": "🔧",
  "Intimidation": "⚠️",
  "Entraînement": "🎯",
  "Autre": "📌",
};

const TYPE_COLORS: Record<string, string> = {
  "Livraison": "#3b82f6",
  "Braquage": "#ef4444",
  "Surveillance": "#f59e0b",
  "Réunion": "#8b5cf6",
  "Rencontre fournisseur": "#22c55e",
  "Récupération": "#06b6d4",
  "Intimidation": "#dc2626",
  "Entraînement": "#84cc16",
  "Autre": "#64748b",
};

const EMPTY: Omit<Operation, "id" | "created_by" | "created_at"> = {
  titre: "", client: "", date: "", heure: "",
  lieu: "", type: "Livraison", notes: "",
  partage_avec: [], prive: false, visible_pour: [], contrat_ref: "", rappel_minutes: 30,
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

export default function PlanningOperationsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const { pending: pendingUndo, scheduleDelete, undo: undoDelete } = useUndoAction();
  useEffect(() => {
    if (!userLoading && (!user || !hasPermission(user, "obsidian_rdv"))) { window.location.href = "/"; }
  }, [user, userLoading]);

  const today = new Date();
  const todayStr = toISO(today);

  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [weekRef, setWeekRef] = useState(today);
  const [viewMode, setViewMode] = useState<"mois" | "semaine">("mois");
  const [editOperation, setEditOperation] = useState<Operation | null>(null);
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fiches, setFiches] = useState<string[]>([]);
  const [detailOperation, setDetailOperation] = useState<Operation | null>(null);
  const [contratsList, setContratsList] = useState<{ titre: string }[]>([]);

  useEffect(() => { if (!userLoading && user) { fetchOperations(); fetchFiches(); fetchContrats(); } }, [user, userLoading]);

  const membersList = [...new Set(operations.map(a => a.created_by))].filter(Boolean).sort();
  const memberColors: Record<string, string> = {};
  membersList.forEach(m => { memberColors[m] = getMemberColor(m); });

  async function fetchOperations() {
    if (!supabase || !user) return;
    setLoading(true);
    const { data } = await supabase.from("obsidian_rdv").select("*").order("date").order("heure");
    const visibles = (data || []).filter((a: Operation) => {
      if (!a.prive) return true;
      if (a.created_by === user.nom) return true;
      if ((a.visible_pour || []).includes(user.nom)) return true;
      if ((a.partage_avec || []).includes(user.nom)) return true;
      return false;
    });
    setOperations(visibles);
    setLoading(false);
  }

  async function fetchFiches() {
    if (!supabase) return;
    const { data } = await supabase.from("obsidian_fiches").select("nom").order("nom");
    setFiches((data || []).map((c: any) => c.nom));
  }

  async function fetchContrats() {
    if (!supabase) return;
    const { data } = await supabase.from("obsidian_contrats").select("titre").order("titre");
    setContratsList(data || []);
  }

async function saveOperation() {
  if (!supabase || !user) return;
  setSaving(true);
  let error = null;
  if (editOperation) {
    const res = await supabase.from("obsidian_rdv").update({ ...form }).eq("id", editOperation.id);
    error = res.error;
  } else {
    const res = await supabase.from("obsidian_rdv").insert([{ ...form, created_by: user.nom, created_by_id: user.id }]);
    error = res.error;
    if (!error) notifyDiscord("rdv", `Nouvelle opération : **${form.titre}** le ${form.date} à ${form.heure} (${form.lieu || "lieu non précisé"})`, "📅 Nouveau RDV");
  }
  setSaving(false);
  if (error) {
    alert("❌ Erreur : " + error.message);
    return;
  }
  setShowModal(false);
  setEditOperation(null);
  setForm({ ...EMPTY });
  fetchOperations();
}

  function deleteOperation(id: string) {
    const op = operations.find(o => o.id === id);
    if (!op || !supabase) return;
    setOperations(ops => ops.filter(o => o.id !== id));
    scheduleDelete(`"${op.titre}" supprimée`, async () => {
      await supabase!.from("obsidian_rdv").delete().eq("id", id);
      notifyDiscord("rdv", `Opération supprimée : **${op.titre}**`, "📅 RDV supprimé");
    }, () => setOperations(ops => [...ops, op]));
  }

  function openCreate(date?: string) {
    setEditOperation(null);
    setForm({ ...EMPTY, date: date || "" });
    setShowModal(true);
  }

  function openEdit(a: Operation) {
    setEditOperation(a);
    setForm({ titre: a.titre, client: a.client, date: a.date, heure: a.heure, lieu: a.lieu, type: a.type, notes: a.notes, partage_avec: a.partage_avec || [], prive: a.prive || false, visible_pour: a.visible_pour || [], contrat_ref: a.contrat_ref || "", rappel_minutes: a.rappel_minutes || 30 });
    setShowModal(true);
  }

  function openDuplicate(a: Operation) {
    setEditOperation(null);
    setForm({ titre: a.titre, client: a.client, date: "", heure: a.heure, lieu: a.lieu, type: a.type, notes: a.notes, partage_avec: a.partage_avec || [], prive: a.prive || false, visible_pour: a.visible_pour || [], contrat_ref: a.contrat_ref || "", rappel_minutes: a.rappel_minutes || 30 });
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

  const filteredOperations = useMemo(() => {
    let list = filterMember ? operations.filter(a => a.created_by === filterMember) : operations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        (a.client || "").toLowerCase().includes(q) ||
        (a.lieu || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [operations, filterMember, search]);

  const operationsByDate = useMemo(() => {
    const map: Record<string, Operation[]> = {};
    for (const a of filteredOperations) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    Object.values(map).forEach(list => list.sort((a, b) => (a.heure || "").localeCompare(b.heure || "")));
    return map;
  }, [filteredOperations]);

  const { firstDay, daysInMonth } = getMonthDays(viewYear, viewMonth);
  const weekDates = useMemo(() => getWeekDates(weekRef), [weekRef]);

  const selectedOperations = selectedDate ? (operationsByDate[selectedDate] || []) : [];
  const prochaines = filteredOperations.filter(a => a.date >= todayStr).slice(0, 6);

  const realWeekDates = useMemo(() => getWeekDates(today), []);
  const realWeekISO = realWeekDates.map(toISO);
  const operationsCetteSemaine = filteredOperations.filter(a => realWeekISO.includes(a.date));
  const operationsAujourdhui = filteredOperations.filter(a => a.date === todayStr);

  function downloadICS(a: Operation) {
    const dt = a.date.replace(/-/g, "");
    const time = (a.heure || "09:00").replace(":", "") + "00";
    const dtStart = `${dt}T${time}`;
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT",
      `SUMMARY:${a.titre}`,
      `DTSTART:${dtStart}`,
      `DESCRIPTION:${a.client ? `Contact: ${a.client}. ` : ""}${a.notes || ""}`,
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

  function OperationCard({ a, compact = false }: { a: Operation; compact?: boolean }) {
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
            {a.prive && <span title="Opération privée" style={{ fontSize: "0.7rem" }}>🔒</span>}
            {a.contrat_ref && <span style={{fontSize:"0.62rem",padding:"0.05rem 0.35rem",borderRadius:999,background:"rgba(139,92,246,0.1)",color:"var(--gold)",border:"1px solid rgba(139,92,246,0.2)"}}>📋 {a.contrat_ref}</span>}
            <span style={{ fontWeight: 600, fontSize: compact ? "0.8rem" : "0.875rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.titre}
            </span>
          </div>
          {relLabel && (
            <span style={{
              fontSize: "0.6rem", padding: "0.1rem 0.4rem", borderRadius: 999, flexShrink: 0,
              background: relLabel === "Aujourd'hui" ? "var(--gold-muted)" : "rgba(255,255,255,0.04)",
              color: relLabel === "Aujourd'hui" ? "var(--gold)" : "var(--text-dim)",
              border: `1px solid ${relLabel === "Aujourd'hui" ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "nowrap", overflow: "hidden" }}>
              <span style={{
                fontSize: "0.62rem", padding: "0.1rem 0.4rem", borderRadius: 999, flexShrink: 0,
                background: col + "18", color: col, border: `1px solid ${col}30`, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120,
              }}>{a.created_by || "?"}</span>
              <span style={{ fontSize: "0.58rem", color: "var(--text-dim)", flexShrink: 0 }}>·</span>
              <span style={{
                fontSize: "0.6rem", color: typeCol, fontWeight: 600, flexShrink: 0,
                background: typeCol + "12", padding: "0.08rem 0.35rem", borderRadius: 999, border: `1px solid ${typeCol}25`,
              }}>{a.type}</span>
            </div>
            {(a.partage_avec && a.partage_avec.length > 0) && (
              <span style={{ fontSize: "0.6rem", color: "var(--info)", paddingLeft: "0.1rem" }}>
                partagé avec {a.partage_avec.map(m => "@" + m.split(" ")[0]).join(", ")}
              </span>
            )}
          </div>

          {!compact && (
            <div style={{ display: "flex", gap: "0.2rem", flexShrink: 0 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadICS(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Exporter .ics">📥</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openDuplicate(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Dupliquer">⧉</button>
              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem" }} title="Modifier">✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteOperation(a.id)} style={{ padding: "0.2rem 0.4rem", fontSize: "0.72rem", color: "var(--danger)" }} title="Supprimer">🗑️</button>
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
          <h1 className="page-title">Planning des opérations</h1>
          <p className="page-subtitle">Agenda partagé · Visible par tous les membres</p>
          <div className="gold-line" />
        </div>
        <button className="btn btn-gold" onClick={() => openCreate()}>+ Nouvelle opération</button>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.95rem",
          borderRadius: "var(--radius)", background: "var(--card)", border: "1px solid var(--border)",
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.1rem", color: "var(--gold)" }}>
            {operationsCetteSemaine.length}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>cette semaine</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.95rem",
          borderRadius: "var(--radius)",
          background: operationsAujourdhui.length > 0 ? "var(--gold-muted)" : "var(--card)",
          border: `1px solid ${operationsAujourdhui.length > 0 ? "rgba(139,92,246,0.3)" : "var(--border)"}`,
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.1rem", color: operationsAujourdhui.length > 0 ? "var(--gold)" : "var(--text)" }}>
            {operationsAujourdhui.length}
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
          <input placeholder="Rechercher une opération, un contact…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["mois", "semaine"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: "0.5rem 1rem", borderRadius: "var(--radius)", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: "0.8rem", fontWeight: viewMode === m ? 700 : 400,
              background: viewMode === m ? "var(--gold-muted)" : "var(--surface)",
              border: `1px solid ${viewMode === m ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
              color: viewMode === m ? "var(--gold)" : "var(--text-muted)", transition: "all var(--t-fast) var(--ease)",
            }}>{m === "mois" ? "📅 Mois" : "🗂 Semaine"}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }}>

        <div className="card" style={{ overflow: "hidden", position: "relative" }}>
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
                  const ops = operationsByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasUrgent = isToday && ops.length > 0;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      style={{
                        minHeight: 72,
                        borderRadius: 8,
                        padding: "0.35rem 0.4rem",
                        cursor: "pointer",
                        background: isSelected ? "var(--gold-muted)" : isToday ? "rgba(139,92,246,0.05)" : "var(--surface)",
                        border: `1px solid ${isSelected ? "rgba(139,92,246,0.5)" : isToday ? "rgba(139,92,246,0.18)" : "var(--border)"}`,
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

                      {ops.slice(0, 3).map((a, idx) => (
                        <div key={idx} title={`${a.titre} — ${a.type}`} style={{
                          height: 4, borderRadius: 2,
                          background: getColor(a.created_by),
                          marginBottom: 2,
                        }} />
                      ))}
                      {ops.length > 3 && (
                        <div style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>+{ops.length - 3}</div>
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
                  const ops = operationsByDate[dStr] || [];
                  const isToday = dStr === todayStr;
                  return (
                    <div key={dStr} style={{
                      borderRadius: "var(--radius)",
                      border: `1px solid ${isToday ? "rgba(139,92,246,0.25)" : "var(--border)"}`,
                      background: isToday ? "rgba(139,92,246,0.04)" : "transparent",
                      padding: "0.6rem 0.7rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: ops.length ? "0.5rem" : 0 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem", color: isToday ? "var(--gold)" : "var(--text-muted)", minWidth: 64 }}>
                          {JOURS_LONG[idx]}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{d.getDate()} {MOIS[d.getMonth()].toLowerCase()}</span>
                        {ops.length > 0 && (
                          <span style={{ marginLeft: "auto", fontSize: "0.66rem", color: "var(--text-dim)" }}>
                            {ops.length} opération{ops.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {ops.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {ops.map(a => {
                            const col = getColor(a.created_by);
                            return (
                              <button
                                key={a.id}
                                onClick={() => setDetailOperation(a)}
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

          {operations.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Membres</span>
                {filterMember && <button onClick={() => setFilterMember(null)} style={{ background: "none", border: "none", color: "var(--gold)", fontSize: "0.7rem", cursor: "pointer" }}>Réinitialiser</button>}
              </div>
              {Array.from(new Set(operations.map(a => a.created_by).filter(Boolean))).map(membre => {
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

          <div className="card" style={{ border: operationsAujourdhui.length > 0 ? "1px solid rgba(139,92,246,0.35)" : "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: operationsAujourdhui.length > 0 ? "var(--gold)" : "var(--text-dim)", boxShadow: operationsAujourdhui.length > 0 ? "0 0 6px var(--gold)" : "none" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: operationsAujourdhui.length > 0 ? "var(--gold)" : "var(--text-muted)" }}>
                  Aujourd'hui
                </h3>
                {operationsAujourdhui.length > 0 && (
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: 999, background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid rgba(139,92,246,0.3)", fontWeight: 700 }}>
                    {operationsAujourdhui.length}
                  </span>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => openCreate(todayStr)} style={{ fontSize: "0.72rem" }}>+ Ajouter</button>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 48, borderRadius: "var(--radius)" }} />
            ) : operationsAujourdhui.length === 0 ? (
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textAlign: "center", padding: "0.75rem 0", fontStyle: "italic" }}>
                Aucune opération programmée aujourd'hui
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {operationsAujourdhui.map(a => <OperationCard key={a.id} a={a} />)}
              </div>
            )}
          </div>

          {selectedDate && selectedDate !== todayStr && (
            <div className="card" style={{ border: "1px solid rgba(99,102,241,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem" }}>📌</span>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--info)" }}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  {selectedOperations.length > 0 && (
                    <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: 999, background: "rgba(99,102,241,0.12)", color: "var(--info)", border: "1px solid rgba(99,102,241,0.3)", fontWeight: 700 }}>
                      {selectedOperations.length}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openCreate(selectedDate)} style={{ fontSize: "0.72rem" }}>+ Ajouter</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)} style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>×</button>
                </div>
              </div>
              {selectedOperations.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textAlign: "center", padding: "0.75rem 0", fontStyle: "italic" }}>
                  Aucune opération ce jour
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {selectedOperations.map(a => <OperationCard key={a.id} a={a} />)}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>À venir</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>Prochaines opérations</h3>
              {prochaines.filter(a => a.date > todayStr).length > 0 && (
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                  {prochaines.filter(a => a.date > todayStr).length} planifiée{prochaines.filter(a => a.date > todayStr).length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: "var(--radius)" }} />)}
              </div>
            ) : prochaines.filter(a => a.date > todayStr).length === 0 ? (
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0", fontStyle: "italic" }}>Aucune opération à venir</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {prochaines.filter(a => a.date > todayStr).map((a) => {
                  const daysUntil = Math.round((new Date(a.date + "T12:00:00").getTime() - new Date(todayStr + "T12:00:00").getTime()) / 86400000);
                  const isThisWeek = daysUntil <= 7;
                  return (
                    <div key={a.id} style={{ position: "relative" }}>
                      {isThisWeek && (
                        <div style={{ position: "absolute", right: 6, top: 6, fontSize: "0.58rem", padding: "0.08rem 0.35rem", borderRadius: 999, background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)", fontWeight: 700, zIndex: 1 }}>
                          J-{daysUntil}
                        </div>
                      )}
                      <div onClick={() => { setSelectedDate(a.date); setViewYear(Number(a.date.split("-")[0])); setViewMonth(Number(a.date.split("-")[1]) - 1); setViewMode("mois"); }} style={{ cursor: "pointer" }}>
                        <OperationCard a={a} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailOperation && (
        <Modal
          title={<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.3rem" }}>{TYPE_ICONS[detailOperation.type] || "📌"}</span>
            <span>{detailOperation.titre}</span>
          </div>}
          onClose={() => setDetailOperation(null)}
          style={{ maxWidth: 460 }}
          headerStyle={{ borderBottom: `2px solid ${getColor(detailOperation.created_by)}40` }}
          footer={<>
            <button className="btn btn-ghost btn-sm" onClick={() => downloadICS(detailOperation)}>📥 Exporter .ics</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { openDuplicate(detailOperation); setDetailOperation(null); }}>⧉ Dupliquer</button>
            <button className="btn btn-outline btn-sm" onClick={() => { openEdit(detailOperation); setDetailOperation(null); }}>✏️ Modifier</button>
            <button className="btn btn-danger btn-sm" onClick={() => { deleteOperation(detailOperation.id); setDetailOperation(null); }}>🗑️ Supprimer</button>
          </>}
        >
              <div style={{
                display: "flex", alignItems: "center", gap: "1rem",
                background: "var(--gold-muted)", border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "var(--radius)", padding: "1rem 1.25rem",
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.8rem", color: "var(--gold)", lineHeight: 1 }}>
                    {new Date(detailOperation.date + "T12:00:00").getDate()}
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
                    {new Date(detailOperation.date + "T12:00:00").toLocaleDateString("fr-FR", { month: "short" })}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border-light)" }} />
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.3rem", color: "var(--text)" }}>
                    {detailOperation.heure || "Heure non précisée"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                    {new Date(detailOperation.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {[
                  { label: "Type", value: detailOperation.type },
                  { label: "Contact", value: detailOperation.client || "—" },
                  { label: "Lieu", value: detailOperation.lieu || "—" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-dim)" }}>{r.label}</span>
                    <span style={{ fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
                {detailOperation.notes && (
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>Notes</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, background: "var(--surface)", borderRadius: "var(--radius)", padding: "0.75rem" }}>
                      {detailOperation.notes}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: getColor(detailOperation.created_by) }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Créée par <strong style={{ color: "var(--text)" }}>{detailOperation.created_by}</strong></span>
              </div>
        </Modal>
      )}

      {showModal && (
        <Modal title={<>{editOperation ? "Modifier l'opération" : "Nouvelle opération"}</>} onClose={() => { setShowModal(false); setEditOperation(null); }} style={{ maxWidth: 540 }} footer={<>
              <button className="btn btn-outline" onClick={() => { setShowModal(false); setEditOperation(null); }}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={saveOperation}
                disabled={saving || !form.titre.trim() || !form.date}
              >{saving ? "Sauvegarde…" : editOperation ? "Modifier" : "Créer l'opération"}</button></>}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Titre *</label>
                  <input placeholder="Ex : Livraison Port de Los Santos" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} autoFocus />
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
                  <label>Contact / Fiche liée</label>
                  <input list="fiches-list" placeholder="Nom" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
                  <datalist id="fiches-list">
                    {fiches.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Lieu</label>
                  <input placeholder="Ex: Port, Entrepôt, Garage..." value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} />
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
                <div className="form-group">
                  <label>Contrat lié (optionnel)</label>
                  <input list="op-contrats" placeholder="Référence contrat…"
                    value={form.contrat_ref || ""}
                    onChange={e => setForm(f => ({ ...f, contrat_ref: e.target.value }))} />
                  <datalist id="op-contrats">{contratsList.map(c => <option key={c.titre} value={c.titre} />)}</datalist>
                </div>
                <div className="form-group">
                  <label>Rappel de notification</label>
                  <select value={form.rappel_minutes || 30} onChange={e => setForm(f => ({ ...f, rappel_minutes: +e.target.value }))}>
                    {[[10, "10 min avant"], [30, "30 min avant"], [60, "1h avant"], [120, "2h avant"], [1440, "1 jour avant"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Notes</label>
                  <textarea rows={3} placeholder="Informations complémentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

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
                    Les membres sélectionnés verront cette opération même si elle est marquée privée.
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={!!form.prive} onChange={e => setForm(f => ({ ...f, prive: e.target.checked }))} style={{ width: "auto" }} />
                    🔒 Opération privée (masquée pour les autres membres)
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
                        Vous voyez toujours vos propres opérations privées. Les membres ci-dessus pourront aussi la voir.
                      </div>
                    </div>
                  )}
                </div>
              </div></Modal>
      )}

      <UndoToast pending={pendingUndo} onUndo={undoDelete} />
    </div>
  );
}