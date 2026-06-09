"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Home() {
const [clients, setClients] = useState(0);
const [dossiers, setDossiers] = useState(0);
const [factures, setFactures] = useState(0);
const [operations, setOperations] = useState(0);

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

const o = await supabase
  .from("operations")
  .select("*", { count: "exact", head: true });

setClients(c.count || 0);
setDossiers(d.count || 0);
setFactures(f.count || 0);
setOperations(o.count || 0);


}

return (
<main
style={{
minHeight: "100vh",
background:
"linear-gradient(135deg,#0f172a,#111827,#1e293b)",
color: "white",
padding: "40px",
}}
>
<h1
style={{
fontSize: "3rem",
marginBottom: "10px",
color: "#d4af37",
}}
>
⚖ Cabinet Varelli </h1>


  <p
    style={{
      opacity: 0.8,
      marginBottom: 40,
    }}
  >
    Gestion RP • Dossiers • Factures • Comptabilité
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(220px,1fr))",
      gap: "20px",
      marginBottom: "40px",
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

    <Card
      title="📊 Opérations"
      value={operations}
    />
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(220px,1fr))",
      gap: "15px",
    }}
  >
    <Menu href="/clients" text="👥 Clients" />

    <Menu href="/dossiers" text="📁 Dossiers" />

    <Menu href="/factures" text="💰 Factures" />

    <Menu href="/operations" text="📊 Opérations" />

    <Menu href="/simulateur" text="⚖ Simulateur" />

    <Menu href="/blanchiment" text="💸 Blanchiment" />

    <Menu href="/juridique" text="📚 Juridique" />

    <Menu href="/comptabilite" text="📈 Comptabilité" />

    <Menu href="/parametres" text="⚙ Paramètres" />
  </div>
</main>


);
}

function Card({
title,
value,
}: {
title: string;
value: number;
}) {
return (
<div
style={{
background: "#1e293b",
border: "1px solid #334155",
padding: "25px",
borderRadius: "15px",
}}
> <h2>{title}</h2>

  <p
    style={{
      fontSize: "2.2rem",
      color: "#d4af37",
      fontWeight: "bold",
    }}
  >
    {value}
  </p>
</div>

);
}

function Menu({
href,
text,
}: {
href: string;
text: string;
}) {
return ( <Link href={href}>
<button
style={{
width: "100%",
padding: "15px",
borderRadius: "12px",
border: "none",
cursor: "pointer",
fontSize: "1rem",
background: "#d4af37",
color: "#111",
fontWeight: "bold",
}}
>
{text} </button> </Link>
);
}
