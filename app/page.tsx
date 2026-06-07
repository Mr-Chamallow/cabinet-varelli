import Link from "next/link";

export default function HomePage() {
  const cards = [
    {
      title: "📁 Dossiers",
      desc: "Gestion des affaires et procédures",
      href: "/dossiers",
    },
    {
      title: "👥 Clients",
      desc: "Base clients du cabinet",
      href: "/clients",
    },
    {
      title: "⚖ Simulateur",
      desc: "Honoraires et procédures",
      href: "/simulateur",
    },
    {
      title: "💰 Blanchiment",
      desc: "Calcul RP argent sale/propre",
      href: "/blanchiment",
    },
    {
      title: "📊 Opérations",
      desc: "Historique des opérations",
      href: "/operations",
    },
    {
      title: "📈 Comptabilité",
      desc: "Suivi financier du cabinet",
      href: "/comptabilite",
    },
    {
      title: "📚 Juridique",
      desc: "Base de données légale",
      href: "/juridique",
    },
    {
      title: "⚙ Paramètres",
      desc: "Configuration du cabinet",
      href: "/parametres",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0a0a0a,#111,#1b1b1b)",
        color: "white",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            color: "#d4af37",
            marginBottom: 0,
          }}
        >
          ⚖ Cabinet Varelli
        </h1>

        <p
          style={{
            color: "#999",
            marginTop: 10,
            fontSize: "1.1rem",
          }}
        >
          Seul Dieu peut juger.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              padding: "25px",
              borderRadius: "15px",
              border: "1px solid #333",
            }}
          >
            <h3>Dossiers</h3>
            <h1 style={{ color: "#d4af37" }}>0</h1>
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "25px",
              borderRadius: "15px",
              border: "1px solid #333",
            }}
          >
            <h3>Clients</h3>
            <h1 style={{ color: "#d4af37" }}>0</h1>
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "25px",
              borderRadius: "15px",
              border: "1px solid #333",
            }}
          >
            <h3>Facturation</h3>
            <h1 style={{ color: "#d4af37" }}>0 $</h1>
          </div>

          <div
            style={{
              background: "#1a1a1a",
              padding: "25px",
              borderRadius: "15px",
              border: "1px solid #333",
            }}
          >
            <h3>Affaires Actives</h3>
            <h1 style={{ color: "#d4af37" }}>0</h1>
          </div>
        </div>

        <h2
          style={{
            marginTop: "50px",
            marginBottom: "20px",
            color: "#d4af37",
          }}
        >
          Modules
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: "20px",
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{
                textDecoration: "none",
                color: "white",
              }}
            >
              <div
                style={{
                  background: "#161616",
                  padding: "25px",
                  borderRadius: "15px",
                  border: "1px solid #333",
                  transition: "0.2s",
                }}
              >
                <h3
                  style={{
                    color: "#d4af37",
                    marginBottom: "10px",
                  }}
                >
                  {card.title}
                </h3>

                <p
                  style={{
                    color: "#aaa",
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div
          style={{
            marginTop: "50px",
            background: "#121212",
            padding: "25px",
            borderRadius: "15px",
            border: "1px solid #333",
          }}
        >
          <h2 style={{ color: "#d4af37" }}>
            Informations Cabinet
          </h2>

          <p>
            Références automatiques :
            <strong> CV-26-XXXXX</strong>
          </p>

          <p>
            Génération automatique des dossiers,
            clients et factures PDF.
          </p>

          <p>
            Connecté à Supabase pour le stockage
            sécurisé des données.
          </p>
        </div>
      </div>
    </main>
  );
}