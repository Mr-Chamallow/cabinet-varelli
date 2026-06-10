import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cabinet Varelli",
  description: "Cabinet d'avocats — Seul Dieu peut juger",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

function Navbar() {
  const links = [
    { href: "/", label: "Tableau de bord", icon: "⚖️" },
    { href: "/clients", label: "Clients", icon: "👤" },
    { href: "/dossiers", label: "Dossiers", icon: "📁" },
    { href: "/factures", label: "Factures", icon: "🧾" },
    { href: "/operations", label: "Opérations", icon: "💰" },
    { href: "/comptabilite", label: "Comptabilité", icon: "📊" },
    { href: "/blanchiment", label: "Blanchiment", icon: "🔄" },
    { href: "/simulateur", label: "Simulateur", icon: "⚙️" },
  ];

  return (
    <nav style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        overflowX: "auto",
      }}>
        {/* Logo */}
        <a href="/" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--gold)",
          textDecoration: "none",
          padding: "1rem 0.5rem 1rem 0",
          marginRight: "1rem",
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
          flexShrink: 0,
        }}>
          ⚖ VARELLI
        </a>

        {/* Nav links */}
        <div style={{ display: "flex", gap: "0.15rem", overflowX: "auto" }}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 0.9rem",
                borderRadius: "var(--radius)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--gold)";
                (e.currentTarget as HTMLAnchorElement).style.background = "var(--gold-muted)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              <span>{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
