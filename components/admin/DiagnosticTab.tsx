"use client";

import { useEffect, useState } from "react";

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}
export function DiagnosticTab() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/diagnostic");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec du diagnostic");
        setChecks(null);
      } else {
        setChecks(data.checks);
        setCheckedAt(data.checkedAt);
      }
    } catch (e: any) {
      setError(e?.message || "Erreur réseau");
    }
    setLoading(false);
  }

  useEffect(() => { run(); }, []);

  const allOk = checks?.every((c) => c.ok) ?? false;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <div className="section-title">Diagnostic santé</div>
          {checkedAt && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
              Dernière vérification : {new Date(checkedAt).toLocaleTimeString("fr-FR")}
            </div>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={run} disabled={loading}>
          {loading ? "Vérification…" : "🔄 Relancer"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", padding: "0.875rem 1.125rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--danger)" }}>
          ⚠️ {error}
        </div>
      )}

      {!checks && loading && <div style={{ color: "var(--text-dim)" }}>Vérification en cours…</div>}

      {checks && (
        <>
          <div
            className="card"
            style={{
              marginBottom: "1.25rem",
              borderColor: allOk ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
              background: allOk ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
              display: "flex", alignItems: "center", gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{allOk ? "✅" : "⚠️"}</span>
            <div>
              <div style={{ fontWeight: 700, color: allOk ? "var(--success)" : "var(--danger)" }}>
                {allOk ? "Tout est en ordre" : "Au moins un point nécessite attention"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                {checks.filter((c) => c.ok).length}/{checks.length} vérifications passées
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {checks.map((c) => (
              <div
                key={c.label}
                className="card"
                style={{
                  padding: "0.75rem 1rem",
                  borderColor: c.ok ? "var(--border)" : "rgba(239,68,68,0.3)",
                  display: "flex", alignItems: "flex-start", gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "0.1rem" }}>{c.ok ? "✅" : "❌"}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.label}</div>
                  <div style={{ fontSize: "0.76rem", color: c.ok ? "var(--text-dim)" : "var(--danger)", fontFamily: "var(--font-mono)", wordBreak: "break-word" }}>
                    {c.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
