"use client";

import { useEffect } from "react";

// Page affichée si une page plante. Évite l'écran blanc.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem", textAlign: "center", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1.3rem", color: "var(--gold)" }}>Une erreur est survenue</div>
      <p style={{ color: "var(--text-dim)", maxWidth: 420 }}>
        Cette page n&apos;a pas pu s&apos;afficher. Tes données ne sont pas touchées. Essaie de la recharger.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-gold" onClick={() => reset()}>Réessayer</button>
        <a className="btn btn-outline" href="/">Retour à l&apos;accueil</a>
      </div>
    </div>
  );
}
