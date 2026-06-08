"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        background: "#0f172a",
        color: "white",
        padding: "40px",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          marginBottom: "30px",
          color: "#d4af37",
        }}
      >
        ⚖ Cabinet Varelli
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
          }}
        >
          <h2>👥 Clients</h2>
          <p style={{ fontSize: "2rem" }}>{clients}</p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
          }}
        >
          <h2>📁 Dossiers</h2>
          <p style={{ fontSize: "2rem" }}>{dossiers}</p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "15px",
          }}
        >
          <h2>💵 Factures</h2>
          <p style={{ fontSize: "2rem" }}>{factures}</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
        }}
      >
        <Link href="/clients">
          <button style={btn}>👥 Clients</button>
        </Link>

        <Link href="/dossiers">
          <button style={btn}>📁 Dossiers</button>
        </Link>

        <Link href="/factures">
          <button style={btn}>💵 Factures</button>
        </Link>

        <Link href="/simulateur">
          <button style={btn}>⚖ Simulateur</button>
        </Link>

        <Link href="/blanchiment">
          <button style={btn}>💰 Blanchiment</button>
        </Link>

        <Link href="/operations">
          <button style={btn}>📊 Opérations</button>
        </Link>

        <Link href="/juridique">
          <button style={btn}>📚 Juridique</button>
        </Link>

        <Link href="/comptabilite">
          <button style={btn}>📈 Comptabilité</button>
        </Link>

        <Link href="/parametres">
          <button style={btn}>⚙ Paramètres</button>
        </Link>
      </div>
    </main>
  );
}

const btn = {
  width: "100%",
  padding: "15px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
  background: "#d4af37",
  color: "#111",
  fontWeight: "bold",
};
