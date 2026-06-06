"use client";

import Link from "next/link";

const cards = [
{
title: "⚖️ Simulateur",
href: "/simulateur",
description: "Calcul des honoraires RP",
},
{
title: "💰 Blanchiment",
href: "/blanchiment",
description: "Gestion sale → propre",
},
{
title: "📁 Dossiers",
href: "/dossiers",
description: "Affaires du cabinet",
},
{
title: "👤 Clients",
href: "/clients",
description: "Répertoire clients",
},
{
title: "📈 Comptabilité",
href: "/comptabilite",
description: "Historique financier",
},
{
title: "📚 Juridique",
href: "/juridique",
description: "Base légale RP",
},
];

export default function Home() {
return (
<main
style={{
minHeight: "100vh",
background: "#0b0b0b",
color: "white",
padding: "40px",
}}
>
<h1
style={{
color: "#d4af37",
fontSize: "3rem",
}}
>
Cabinet Varelli </h1>

  <p
    style={{
      opacity: 0.8,
      marginBottom: "40px",
    }}
  >
    Seul Dieu peut juger
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit,minmax(250px,1fr))",
      gap: "20px",
    }}
  >
    {cards.map((card) => (
      <Link
        key={card.href}
        href={card.href}
        style={{
          textDecoration: "none",
        }}
      >
        <div
          style={{
            background: "#151515",
            border: "1px solid #d4af37",
            borderRadius: "16px",
            padding: "20px",
            color: "white",
          }}
        >
          <h2>{card.title}</h2>
          <p>{card.description}</p>
        </div>
      </Link>
    ))}
  </div>
</main>

);
}
