export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0f1115",
      }}
    >
      <aside
        style={{
          width: "260px",
          background: "#171a21",
          padding: "20px",
          borderRight: "1px solid #2d323d",
        }}
      >
        <h2 style={{ color: "#d4af37" }}>⚖ Cabinet Varelli</h2>

        <p style={{ opacity: 0.8 }}>
          <em>Seul Dieu peut juger</em>
        </p>

        <hr />

        <nav>
          <p>📊 Dashboard</p>
          <p>💰 Simulateur</p>
          <p>📁 Dossiers</p>
          <p>👥 Clients</p>
          <p>📈 Comptabilité</p>
          <p>📚 Juridique</p>
          <p>⚙ Paramètres</p>
        </nav>
      </aside>

      <section
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        <h1>Dashboard</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <Card title="CA du mois" value="$0" />
          <Card title="Clients" value="0" />
          <Card title="Dossiers" value="0" />
          <Card title="Blanchi" value="$0" />
        </div>
      </section>
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
        background: "#171a21",
        padding: "20px",
        borderRadius: "12px",
      }}
    >
      <h3>{title}</h3>
      <p
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: "#d4af37",
        }}
      >
        {value}
      </p>
    </div>
  );
}