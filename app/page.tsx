export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1
        style={{
          color: "#d4af37",
          fontSize: "3rem",
          marginBottom: "10px",
        }}
      >
        ⚖ Cabinet Varelli
      </h1>

      <p
        style={{
          fontStyle: "italic",
          color: "#999",
          marginBottom: "40px",
        }}
      >
        Seul Dieu peut juger
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        <Card title="💰 Chiffre d'affaires" value="$0" />
        <Card title="📁 Dossiers ouverts" value="0" />
        <Card title="✅ Dossiers fermés" value="0" />
        <Card title="👤 Clients" value="0" />
      </div>

      <h2 style={{ marginTop: "50px", color: "#d4af37" }}>
        Navigation
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <MenuCard title="⚖ Simulateur" href="/simulateur" />
        <MenuCard title="📁 Dossiers" href="/dossiers" />
        <MenuCard title="👤 Clients" href="/clients" />
        <MenuCard title="📈 Comptabilité" href="/comptabilite" />
        <MenuCard title="📚 Juridique" href="/juridique" />
        <MenuCard title="⚙ Paramètres" href="/parametres" />
      </div>
    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#1b1b1b",
        border: "1px solid #333",
        borderRadius: "15px",
        padding: "20px",
      }}
    >
      <h3>{title}</h3>
      <p
        style={{
          fontSize: "2rem",
          color: "#d4af37",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function MenuCard({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",
        color: "white",
        background: "#1b1b1b",
        border: "1px solid #333",
        borderRadius: "15px",
        padding: "20px",
        display: "block",
      }}
    >
      {title}
    </a>
  );
}