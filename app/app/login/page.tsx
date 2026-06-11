"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS, setUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const account = DEMO_ACCOUNTS.find(
      (a) => a.nom.toLowerCase() === nom.toLowerCase() && a.password === password
    );

    if (!account) {
      setError("Identifiants incorrects. Vérifiez votre nom et mot de passe.");
      setLoading(false);
      return;
    }

    setUser({ id: account.id, nom: account.nom, role: account.role, avatar: account.avatar });
    router.push("/");
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: 440,
        animation: "slideUp 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "var(--gold-muted)",
            border: "2px solid rgba(212,175,55,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            margin: "0 auto 1.25rem",
          }}>
            ⚖️
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            color: "var(--text-dim)",
            marginBottom: "0.5rem",
          }}>
            CABINET
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.25rem",
            fontWeight: 900,
            color: "var(--gold)",
            letterSpacing: "0.08em",
            marginBottom: "0.5rem",
          }}>
            VARELLI
          </div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            letterSpacing: "0.12em",
          }}>
            « Seul Dieu peut juger »
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05)",
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}>
            Connexion
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>
            Accès réservé au personnel du cabinet
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label>Nom RP</label>
              <input
                placeholder="Ex : Marco Varelli"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius)",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                color: "var(--danger)",
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn btn-gold"
              onClick={handleLogin}
              disabled={loading || !nom.trim() || !password.trim()}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "0.875rem",
                fontSize: "0.95rem",
                opacity: loading || !nom.trim() || !password.trim() ? 0.7 : 1,
                marginTop: "0.5rem",
              }}
            >
              {loading ? "Vérification…" : "Accéder au cabinet"}
            </button>
          </div>
        </div>

        {/* Comptes démo */}
        <div style={{
          marginTop: "1.5rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.25rem",
        }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
            Comptes de démonstration
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.id}
                onClick={() => { setNom(a.nom); setPassword(a.password); }}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "0.6rem 0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--gold-muted)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}>
                  {a.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text)" }}>{a.nom}</div>
                </div>
                <span className={`badge ${a.role === "Patron" ? "badge-gold" : a.role === "Avocat" ? "badge-info" : "badge-success"}`}>
                  {a.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Cabinet Varelli · Los Santos · Confidentiel
        </div>
      </div>
    </div>
  );
}
