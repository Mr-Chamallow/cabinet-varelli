import Link from "next/link";

// Page affichée quand l'adresse n'existe pas.
export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "2rem", textAlign: "center", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "3rem", color: "var(--gold)" }}>404</div>
      <p style={{ color: "var(--text-dim)" }}>Cette page n&apos;existe pas ou a été déplacée.</p>
      <Link className="btn btn-gold" href="/">Retour à l&apos;accueil</Link>
    </div>
  );
}
