"use client";
import { signOut } from "next-auth/react";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function NoAccessPage() {
  const { user } = useCurrentUser();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.75rem" }}>
          Aucun accès configuré
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: "0.5rem" }}>
          Ton compte est bien connecté{user?.role ? <> avec le rôle <strong style={{ color: "var(--text)" }}>{user.role}</strong></> : ""},
          mais ce rôle n'a aucune permission activée sur le site pour l'instant.
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
          Demande à un administrateur d'ajouter au moins une permission à ce rôle (onglet Rôles de l'Admin).
        </p>
        <button className="btn btn-outline" onClick={() => signOut({ callbackUrl: "/login" })}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
