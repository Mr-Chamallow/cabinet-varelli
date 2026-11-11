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
          Bienvenue{user?.nom ? <>, <strong style={{ color: "var(--text)" }}>{user.nom}</strong></> : ""}. Ton compte est bien créé.
          Il est en attente d'activation : un membre du cabinet va valider ton accès.
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1.5rem" }}>
          Si tu penses avoir oublié de passer par le cabinet, contacte l'accueil sur Discord.
        </p>
        <button className="btn btn-outline" onClick={() => signOut({ callbackUrl: "/login" })}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
