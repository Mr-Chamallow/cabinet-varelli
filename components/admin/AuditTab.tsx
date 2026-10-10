"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiRequest";

export function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  async function load() {
    setLoading(true);
    const r = await apiRequest("/api/admin/audit", {});
    if (!r.ok) setErr(r.error || "Erreur"); else { setErr(""); setRows(r.data || []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  const f = rows.filter(r => !q || `${r.acteur} ${r.action} ${r.cible} ${r.detail || ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher (acteur, action, cible)..." style={{ flex: 1 }} />
        <button className="btn btn-outline btn-sm" onClick={load}>↻ Actualiser</button>
      </div>
      {err && <div className="card" style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{err} - la migration <code>migration-lot1.sql</code> est-elle lancée ?</div>}
      {loading ? <div style={{ color: "var(--text-dim)" }}>Chargement...</div> : f.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🛡️</div><div className="empty-title">Aucune action sensible enregistrée</div></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {f.map(r => (
            <div key={r.id} className="card" style={{ padding: "0.5rem 0.9rem", display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-dim)", minWidth: 110 }}>{new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span>
              <b style={{ fontSize: "0.82rem" }}>{r.acteur}</b>
              <span style={{ fontSize: "0.8rem", color: "var(--gold)" }}>{r.action}</span>
              <span style={{ fontSize: "0.8rem", flex: 1 }}>{r.cible}{r.detail ? <span style={{ color: "var(--text-dim)" }}> · {r.detail}</span> : null}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
