"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    if (!nom.trim() || !password.trim()) return;
    setLoading(true);

    if (!supabase) {
      setError("Connexion Supabase non configurée. Vérifiez vos variables d'environnement.");
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("membres")
      .select("id, nom, role, password")
      .ilike("nom", nom.trim())
      .single();

    if (err || !data) {
      setError("Identifiants incorrects. Vérifiez votre nom RP.");
      setLoading(false);
      return;
    }

    if (data.password !== password) {
      setError("Mot de passe incorrect.");
      setLoading(false);
      return;
    }

    setUser({
      id: data.id,
      nom: data.nom,
      role: data.role,
      avatar: data.nom.charAt(0).toUpperCase(),
    });
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
      <div style={{
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 84, height: 84, borderRadius: "50%",
            background: "var(--gold-muted)",
            border: "2px solid rgba(201,168,76,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem", overflow: "hidden",
          }}>
            <img src="/logo.png" alt="BullHead" style={{ width:"68%", height:"68%", objectFit:"contain" }} />
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.3em", color: "var(--text-dim)", marginBottom: "0.5rem" }}>CABINET</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.25rem", fontWeight: 900, color: "var(--gold)", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>BULLHEAD</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "var(--text-dim)", letterSpacing: "0.12em" }}>Law · Finance · Property</div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "2rem",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05)",
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Connexion</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.75rem" }}>Accès réservé au personnel du cabinet</div>

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
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius)", padding: "0.75rem 1rem",
                fontSize: "0.85rem", color: "var(--danger)",
              }}>⚠️ {error}</div>
            )}

            <button
              className="btn btn-gold"
              onClick={handleLogin}
              disabled={loading || !nom.trim() || !password.trim()}
              style={{ width: "100%", justifyContent: "center", padding: "0.875rem", fontSize: "0.95rem", marginTop: "0.5rem" }}
            >
              {loading ? "Vérification…" : "Accéder au cabinet"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Cabinet BullHead · Los Santos · Confidentiel
        </div>
      </div>
    </div>
  );
}
