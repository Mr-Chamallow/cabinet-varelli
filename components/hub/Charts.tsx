"use client";
import { ReactNode } from "react";
import { weekStartOf } from "@/lib/weekStart";

export const fmt = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const fmtK = (n: number) => { const a = Math.abs(n); return (n < 0 ? "-" : "") + (a >= 1e6 ? (a / 1e6).toFixed(1) + " M$" : a >= 1e3 ? (a / 1e3).toFixed(1) + " k$" : Math.round(a) + " $"); };
export const pct = (n: number) => (Number.isFinite(n) ? n : 0).toFixed(1) + " %";

export function Kpi({ label, value, sub, color = "var(--text)", icon }: { label: string; value: ReactNode; sub?: ReactNode; color?: string; icon?: string }) {
  return (
    <div className="stat-card" style={{ minWidth: 0 }}>
      <div className="stat-label">{icon && <span style={{ marginRight: 4 }}>{icon}</span>}{label}</div>
      <div className="stat-value" style={{ color, fontSize: "1.35rem", wordBreak: "break-word" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (!prev) return <span style={{ color: "var(--text-dim)" }}>—</span>;
  const d = ((cur - prev) / Math.abs(prev)) * 100; const good = invert ? d <= 0 : d >= 0;
  return <span style={{ color: good ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>{d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(0)} %</span>;
}

export function Panel({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="card" style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: 8, flexWrap: "wrap" }}>
        <div className="section-title" style={{ marginBottom: 0 }}>{title}</div>{right}
      </div>
      {children}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { k: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
      {tabs.map(t => <button key={t.k} onClick={() => onChange(t.k)} className={`btn btn-sm ${value === t.k ? "btn-gold" : "btn-outline"}`}>{t.label}</button>)}
    </div>
  );
}

// Courbe(s) SVG : séries { nom, color, values } sur des libellés communs.
export function LineChart({ labels, series, height = 180, area = false }: { labels: string[]; series: { nom: string; color: string; values: (number | null)[] }[]; height?: number; area?: boolean }) {
  const W = 640, H = height, P = 28;
  const all = series.flatMap(s => s.values.filter((v): v is number => v != null)); const min = Math.min(0, ...all), max = Math.max(1, ...all);
  const x = (i: number) => P + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - P * 2));
  const y = (v: number) => H - P - ((v - min) / (max - min || 1)) * (H - P * 2);
  const step = Math.ceil(labels.length / 8);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map(t => { const v = min + (max - min) * t; return <g key={t}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={0.6} strokeDasharray="3 3" /><text x={2} y={y(v) + 3} fontSize={8} fill="var(--text-dim)">{fmtK(v)}</text></g>; })}
        {min < 0 && <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} stroke="var(--text-dim)" strokeWidth={0.8} />}
        {series.map(s => {
          const pts = s.values.map((v, i) => (v == null ? "" : `${x(i)},${y(v)}`)).filter(Boolean).join(" ");
          return <g key={s.nom}>
            {area && s.values.length > 1 && <polygon points={`${x(0)},${y(0)} ${pts} ${x(s.values.length - 1)},${y(0)}`} fill={s.color} opacity={0.12} />}
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
            {s.values.length < 40 && s.values.map((v, i) => v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.2} fill={s.color}><title>{`${labels[i]} — ${s.nom} : ${fmt(v)}`}</title></circle>)}
          </g>;
        })}
        {labels.map((l, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 8} fontSize={8} textAnchor="middle" fill="var(--text-dim)">{l}</text>)}
      </svg>
      {series.length > 1 && <Legend items={series.map(s => ({ nom: s.nom, color: s.color }))} />}
    </div>
  );
}

export function Legend({ items }: { items: { nom: string; color: string }[] }) {
  return <div style={{ display: "flex", gap: "0.9rem", justifyContent: "center", flexWrap: "wrap", fontSize: "0.68rem", color: "var(--text-muted)" }}>{items.map(i => <span key={i.nom} style={{ display: "flex", alignItems: "center", gap: 4 }}><i style={{ width: 10, height: 10, borderRadius: 2, background: i.color, display: "inline-block" }} />{i.nom}</span>)}</div>;
}

// Barres groupées (ex. recettes / dépenses par semaine).
export function BarChart({ labels, series, height = 170 }: { labels: string[]; series: { nom: string; color: string; values: number[] }[]; height?: number }) {
  const max = Math.max(1, ...series.flatMap(s => s.values));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, width: "100%", height: height - 18 }}>
              {series.map(s => <div key={s.nom} title={`${l} — ${s.nom} : ${fmt(s.values[i])}`} style={{ flex: 1, background: s.color, borderRadius: "3px 3px 0 0", height: `${Math.max((s.values[i] / max) * 100, s.values[i] > 0 ? 2 : 0)}%`, opacity: 0.85 }} />)}
            </div>
            <div style={{ fontSize: "0.55rem", color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{l}</div>
          </div>
        ))}
      </div>
      {series.length > 1 && <Legend items={series.map(s => ({ nom: s.nom, color: s.color }))} />}
    </div>
  );
}

// Barres horizontales classées.
export function HBars({ rows, color = "var(--gold)", format = fmt, max }: { rows: { label: string; value: number; sub?: string; color?: string }[]; color?: string; format?: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map(r => Math.abs(r.value)));
  if (!rows.length) return <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.5rem 0" }}>Aucune donnée.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      {rows.map((r, i) => (
        <div key={r.label + i}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", gap: 8 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i + 1}. {r.label}{r.sub && <small style={{ color: "var(--text-dim)" }}> · {r.sub}</small>}</span>
            <b style={{ color: r.color || (r.value < 0 ? "var(--danger)" : color), whiteSpace: "nowrap" }}>{format(r.value)}</b>
          </div>
          <div style={{ height: 5, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (Math.abs(r.value) / m) * 100)}%`, background: r.color || (r.value < 0 ? "var(--danger)" : color), borderRadius: 3 }} /></div>
        </div>
      ))}
    </div>
  );
}

// Anneau de répartition.
export function Donut({ parts, size = 140, center }: { parts: { nom: string; value: number; color: string }[]; size?: number; center?: ReactNode }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1; let acc = 0; const R = 46, C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg viewBox="0 0 120 120" width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={60} cy={60} r={R} fill="none" stroke="var(--surface)" strokeWidth={16} />
          {parts.filter(p => p.value > 0).map(p => { const len = (p.value / total) * C; const el = <circle key={p.nom} cx={60} cy={60} r={R} fill="none" stroke={p.color} strokeWidth={16} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc}><title>{`${p.nom} : ${fmt(p.value)}`}</title></circle>; acc += len; return el; })}
        </svg>
        {center && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "0.7rem", fontWeight: 700 }}>{center}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.72rem" }}>
        {parts.map(p => <span key={p.nom} style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 9, height: 9, borderRadius: 2, background: p.color, display: "inline-block" }} />{p.nom} <b>{((p.value / total) * 100).toFixed(0)} %</b></span>)}
      </div>
    </div>
  );
}

// Carte de chaleur jour × tranche horaire (valeurs = nombre d'événements).
export function Heat({ grid, rows, cols }: { grid: number[][]; rows: string[]; cols: string[] }) {
  const max = Math.max(1, ...grid.flat());
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: "0.62rem", width: "100%" }}>
        <thead><tr><th />{cols.map(c => <th key={c} style={{ color: "var(--text-dim)", fontWeight: 400 }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={r}><td style={{ color: "var(--text-dim)", paddingRight: 4 }}>{r}</td>{cols.map((c, j) => <td key={c} title={`${r} ${c} : ${grid[i][j]}`} style={{ height: 22, textAlign: "center", borderRadius: 4, background: grid[i][j] ? `rgba(var(--gold-rgb), ${0.12 + 0.75 * (grid[i][j] / max)})` : "var(--surface)", color: "var(--text)" }}>{grid[i][j] || ""}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function DataTable({ head, rows, empty = "Aucune donnée." }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <div style={{ color: "var(--text-dim)", fontSize: "0.8rem", padding: "0.5rem 0" }}>{empty}</div>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.76rem" }}>
        <thead><tr>{head.map((h, i) => <th key={h} style={{ textAlign: i === 0 ? "left" : "right", padding: "0.4rem 0.5rem", borderBottom: "1px solid var(--border)", color: "var(--text-dim)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>{r.map((c, j) => <td key={j} style={{ textAlign: j === 0 ? "left" : "right", padding: "0.4rem 0.5rem", whiteSpace: j === 0 ? "normal" : "nowrap" }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

// Statistiques utilitaires
export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
export const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
export const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
export const stdev = (a: number[]) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
export function weekKey(d: string | Date) { return weekStartOf(d); }
export function lastWeeks(n: number) { const out: string[] = []; const t = new Date(weekStartOf() + "T12:00:00Z"); for (let i = n - 1; i >= 0; i--) { const d = new Date(t); d.setUTCDate(d.getUTCDate() - i * 7); out.push(d.toISOString().slice(0, 10)); } return out; }
export const shortWeek = (w: string) => { const d = new Date(w); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
export function linReg(y: number[]) { const n = y.length; if (n < 2) return { a: 0, b: y[0] || 0 }; const xs = y.map((_, i) => i); const mx = mean(xs), my = mean(y); const a = sum(xs.map((x, i) => (x - mx) * (y[i] - my))) / (sum(xs.map(x => (x - mx) ** 2)) || 1); return { a, b: my - a * mx }; }
