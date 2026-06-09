"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [clients, setClients] = useState(0);
  const [dossiers, setDossiers] = useState(0);
  const [factures, setFactures] = useState(0);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    if (!supabase) return;

    const c = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    const d = await supabase
      .from("dossiers")
      .select("*", { count: "exact", head: true });

    const f = await supabase
      .from("factures")
      .select("*", { count: "exact", head: true });

    setClients(c.count || 0);
    setDossiers(d.count || 0);
    setFactures(f.count || 0);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg,#0f172a,#1e293b)",
        color: "white",
        padding: 40
      }}
    >
      <h1
        style={{
          color: "#d4af37",
          fontSize: "3rem",
          marginBottom: 30
        }}
      >
        ⚖️ Cabinet Varelli
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: 20,
          marginBottom: 40
        }}
      >
        <Card
          title="👥 Clients"
          value={clients}
        />

        <Card
          title="📁 Dossiers"
          value={dossiers}
        />

        <Card
          title="💰 Factures"
          value={factures}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 15
        }}
      >
        <Menu href="/clients" text="👥 Clients" />
        <Menu href="/dossiers" text="📁 Dossiers" />
        <Menu href="/factures" text="💰 Factures" />
        <Menu href="/simulateur" text="⚖️ Simulateur" />
        <Menu href="/operations" text="📊 Opérations" />
        <Menu href="/comptabilite" text="📈 Comptabilité" />
        <Menu href="/juridique" text="📚 Juridique" />
        <Menu href="/blanchiment" text="💸 Blanchiment" />
        <Menu href="/parametres" text="⚙️ Paramètres" />
      </div>
    </main>
  );
}

function Card({
  title,
  value
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: 25,
        borderRadius: 16,
        border: "1px solid #334155"
      }}
    >
      <h2>{title}</h2>

      <p
        style={{
          fontSize: "2.5rem",
          color: "#d4af37",
          fontWeight: "bold"
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Menu({
  href,
  text
}: {
  href: string;
  text: string;
}) {
  return (
    <Link href={href}>
      <button
        style={{
          width: "100%",
          padding: 15,
          background: "#d4af37",
          border: "none",
          borderRadius: 12,
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        {text}
      </button>
    </Link>
  );
}