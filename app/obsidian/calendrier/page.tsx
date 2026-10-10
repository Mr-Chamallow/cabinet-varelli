"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { useGmAccess } from "@/components/gm/bits";
import { LoadingBlock } from "@/components/ui/LoadingBlock";

// Calendrier unique : rendez-vous / opérations + convois, enchères, captures, alertes.
const SRC: Record<string, { label: string; icon: string; color: string; href: string }> = {
  rdv: { label: "Rendez-vous", icon: "🗓️", color: "#c9a24d", href: "/obsidian/rdv" },
  convoi: { label: "Convois", icon: "🚚", color: "#64b5f6", href: "/obsidian/evenements" },
  enchere: { label: "Enchères", icon: "🔨", color: "#a78bfa", href: "/obsidian/evenements" },
  capture: { label: "Captures", icon: "🎯", color: "#ef4444", href: "/obsidian/evenements" },
  alerte: { label: "Alertes", icon: "🚨", color: "#f59e0b", href: "/obsidian/evenements" },
};
const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
interface Item { id: string; src: string; titre: string; date: string; heure: string; sub: string }

export default function CalendrierPage() {
  useGmAccess("obsidian_rdv");
  const now = new Date();
  const [y, setY] = useState(now.getFullYear()); const [m, setM] = useState(now.getMonth());
  const [items, setItems] = useState<Item[]>([]); const [loading, setLoading] = useState(true);
  const [off, setOff] = useState<Record<string, boolean>>({}); const [sel, setSel] = useState<string>(iso(now));

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const [r, e] = await Promise.all([supabase.from("obsidian_rdv").select("id,titre,client,date,heure"), supabase.from("gm_evenements").select("id,type,titre,statut,date_event,partenaire")]);
    const out: Item[] = [];
    (r.data || []).forEach((x: any) => x.date && out.push({ id: "r" + x.id, src: "rdv", titre: x.titre, date: String(x.date).slice(0, 10), heure: (x.heure || "").slice(0, 5), sub: x.client || "" }));
    (e.data || []).forEach((x: any) => { if (!x.date_event) return; const d = new Date(x.date_event); out.push({ id: "e" + x.id, src: x.type, titre: x.titre, date: iso(d), heure: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), sub: [x.partenaire, x.statut].filter(Boolean).join(" · ") }); });
    setItems(out); setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtimeTable("gm_evenements", load); useRealtimeTable("obsidian_rdv", load);

  const byDay = useMemo(() => { const o: Record<string, Item[]> = {}; items.filter(i => !off[i.src]).forEach(i => (o[i.date] ??= []).push(i)); Object.values(o).forEach(l => l.sort((a, b) => a.heure.localeCompare(b.heure))); return o; }, [items, off]);
  const first = new Date(y, m, 1); const lead = (first.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => { const d = i - lead + 1; return d >= 1 && d <= days ? new Date(y, m, d) : null; });
  const go = (n: number) => { const d = new Date(y, m + n, 1); setY(d.getFullYear()); setM(d.getMonth()); };
  const today = iso(now); const upcoming = items.filter(i => !off[i.src] && i.date >= today).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure)).slice(0, 6);

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Dashboard</a>
      <div className="page-header"><div><h1 className="page-title">📅 Calendrier</h1><p className="page-subtitle">Rendez-vous · Convois · Enchères · Captures · Alertes</p><div className="gold-line" /></div></div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {Object.entries(SRC).map(([k, s]) => <button key={k} className="cal-chip" onClick={() => setOff(o => ({ ...o, [k]: !o[k] }))} style={{ borderColor: off[k] ? "var(--border)" : s.color, color: off[k] ? "var(--text-dim)" : s.color, opacity: off[k] ? 0.5 : 1 }}>{s.icon} {s.label}</button>)}
      </div>
      {loading ? <LoadingBlock rows={6} /> : (
        <div className="cal-layout">
          <div className="card cal-box">
            <div className="cal-nav"><button className="btn btn-outline btn-sm" onClick={() => go(-1)}>‹</button><b>{MOIS[m]} {y}</b><button className="btn btn-outline btn-sm" onClick={() => go(1)}>›</button><button className="btn btn-ghost btn-sm" onClick={() => { setY(now.getFullYear()); setM(now.getMonth()); setSel(today); }}>Aujourd'hui</button></div>
            <div className="cal-grid">
              {JOURS.map(j => <div key={j} className="cal-h">{j}</div>)}
              {cells.map((d, i) => { if (!d) return <div key={i} className="cal-c empty" />; const k = iso(d); const l = byDay[k] || [];
                return <button key={i} className={`cal-c${k === today ? " today" : ""}${k === sel ? " sel" : ""}`} onClick={() => setSel(k)}>
                  <span className="cal-d">{d.getDate()}</span>
                  <span className="cal-dots">{l.slice(0, 4).map(x => <i key={x.id} style={{ background: SRC[x.src]?.color }} />)}{l.length > 4 && <em>+{l.length - 4}</em>}</span>
                </button>; })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card"><div className="section-title" style={{ marginBottom: "0.6rem" }}>{new Date(sel + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
              {(byDay[sel] || []).length === 0 ? <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Rien de prévu.</div> : (byDay[sel] || []).map(x => <a key={x.id} href={SRC[x.src].href} className="cal-item" style={{ borderLeftColor: SRC[x.src].color }}><span>{SRC[x.src].icon} <b>{x.titre}</b></span><small>{x.heure} {x.sub && `· ${x.sub}`}</small></a>)}
            </div>
            <div className="card"><div className="section-title" style={{ marginBottom: "0.6rem" }}>⏭️ À venir</div>
              {upcoming.length === 0 ? <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Rien à venir.</div> : upcoming.map(x => <a key={x.id} href={SRC[x.src].href} className="cal-item" style={{ borderLeftColor: SRC[x.src].color }}><span>{SRC[x.src].icon} <b>{x.titre}</b></span><small>{new Date(x.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {x.heure}</small></a>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
