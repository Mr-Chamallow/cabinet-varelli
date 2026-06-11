"use client";

import { useEffect, useState } from "react";
import { getUser, DEMO_ACCOUNTS, PERMISSIONS, ROLE_BADGES, type User, type Role } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== "Patron") {
      router.replace("/");
      return;
    }
    setUser(u);
  }, []);

  if (!user) return null;

  const roleColors: Record<Role, string> = {
    Patron: "var(--gold)",
    Avocat: "var(--info)",
    Employé: "var(--success)",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-subtitle">Gestion des accès et des membres du cabinet</p>
          <div className="gold-line" />
        </div>
        <span className="badge badge-danger" style={{ padding: "0.4rem 1rem" }}>🛡️ Patron uniquement</span>
      </div>

      {/* Membres */}
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>Membres actifs</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {DEMO_ACCOUNTS.map((account) => (
          <div key={account.id} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                background: "var(--gold-muted)",
                border: `2px solid ${roleColors[account.role]}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "1.2rem",
                color: roleColors[account.role],
                flexShrink: 0,
              }}>
                {account.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{account.nom}</div>
                <span className={`badge ${ROLE_BADGES[account.role]}`}>{account.role}</span>
              </div>
            </div>

            <div style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "0.875rem",
            }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.6rem" }}>
                Accès autorisés ({PERMISSIONS[account.role].length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {PERMISSIONS[account.role].map((p) => (
                  <span key={p} className="badge badge-muted" style={{ fontSize: "0.68rem" }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau des permissions */}
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>Matrice des permissions</h2>
      <div className="table-container" style={{ marginBottom: "2.5rem" }}>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th style={{ textAlign: "center", color: "var(--gold)" }}>👑 Patron</th>
              <th style={{ textAlign: "center", color: "var(--info)" }}>⚖️ Avocat</th>
              <th style={{ textAlign: "center", color: "var(--success)" }}>🧑 Employé</th>
            </tr>
          </thead>
          <tbody>
            {[
              "dashboard", "clients", "dossiers", "factures", "operations",
              "comptabilite", "blanchiment", "simulateur", "juridique",
              "parametres", "admin", "delete_all", "edit_all",
            ].map((perm) => {
              const patronHas = PERMISSIONS.Patron.includes(perm);
              const avocatHas = PERMISSIONS.Avocat.includes(perm);
              const employeHas = PERMISSIONS.Employé.includes(perm);
              return (
                <tr key={perm}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-muted)" }}>{perm}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "1rem" }}>{patronHas ? "✅" : "—"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "1rem" }}>{avocatHas ? "✅" : "—"}</span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "1rem" }}>{employeHas ? "✅" : "—"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Crédentiels démo */}
      <h2 className="section-title" style={{ marginBottom: "1rem" }}>Crédentiels de connexion</h2>
      <div className="card" style={{ borderColor: "rgba(212,175,55,0.25)" }}>
        <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
          Utilisez ces identifiants sur la page de connexion. En V9, ils seront gérés via Supabase Auth.
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom RP</th>
                <th>Rôle</th>
                <th>Mot de passe</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ACCOUNTS.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.nom}</td>
                  <td><span className={`badge ${ROLE_BADGES[a.role]}`}>{a.role}</span></td>
                  <td>
                    <code style={{
                      background: "var(--surface)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: 6,
                      fontSize: "0.82rem",
                      color: "var(--gold)",
                      fontFamily: "monospace",
                    }}>
                      {a.password}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note V9 */}
      <div className="card" style={{ marginTop: "1.5rem", borderColor: "rgba(59,130,246,0.25)", background: "rgba(59,130,246,0.04)" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🚀</span>
          <div>
            <div style={{ fontWeight: 600, color: "var(--info)", marginBottom: "0.4rem" }}>V9 — Auth Supabase</div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              La prochaine version intégrera Supabase Auth avec gestion des utilisateurs en base de données,
              réinitialisation de mot de passe, sessions persistantes et invitations par email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
