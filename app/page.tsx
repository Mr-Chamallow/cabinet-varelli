"use client";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0b0d10",
        color: "#fff",
      }}
    >
      <aside
        style={{
          width: "280px",
          background: "#13161c",
          borderRight: "1px solid #242933",
          padding: "24px",
        }}
      >
        <h1
          style={{
            color: "#d4af37",
            marginBottom: "8px",
          }}
        >
          ⚖ Cabinet Varelli
        </h1>

        <p
          style={{
            opacity: 0.7,
            fontStyle: "italic",
            marginBottom: "30px",
          }}
        >
          Seul Dieu peut me juger
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <MenuItem icon="📊" label="Dashboard" />
          <MenuItem icon="💰" label="Simulateur" />
          <MenuItem icon="📁" label="Dossiers" />
          <MenuItem icon="👥" label="Clients" />
          <MenuItem icon="📈" label="Comptabilité" />
          <MenuItem icon="📚" label="Base juridique" />
          <MenuItem icon="⚙️" label="Paramètres" />
        </div>
      </aside>

      <section
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            marginBottom: "24px",
          }}
        >
          Tableau de bord
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
          }}
        >
          <Card title="CA Total" value="$0" />
          <Card title="CA du Mois" value="$0" />
          <Card title="Clients" value="0" />
          <Card title="Dossiers" value="0" />
        </div>

        <div
          style={{
            marginTop: "40px",
            background: "#13161c",
            padding: "24px",
            borderRadius: "12px",
          }}
        >
          <h3>Activité récente</h3>

          <ul>
            <li>Cabinet Varelli initialisé</li>
            <li>Connexion Supabase configurée</li>
            <li>Prêt pour les dossiers RP</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function MenuItem({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: "#1a1f27",
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </div>
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
        background: "#13161c",
        padding: "24px",
        borderRadius: "12px",
      }}
    >
      <p
        style={{
          opacity: 0.7,
        }}
      >
        {title}
      </p>

      <h2
        style={{
          color: "#d4af37",
          marginTop: "10px",
        }}
      >
        {value}
      </h2>
    </div>
  );
}