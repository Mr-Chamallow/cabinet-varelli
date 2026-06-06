"use client";

import { useState } from "react";

export default function DossiersPage() {
const [client, setClient] = useState("");
const [type, setType] = useState("");
const [montant, setMontant] = useState("");
const [notes, setNotes] = useState("");

const reference =
"CV-26-" +
String(Math.floor(Math.random() * 99999))
.padStart(5, "0");

return (
<main
style={{
minHeight: "100vh",
background: "#0b0b0b",
color: "white",
padding: "40px",
}}
>
<h1 style={{ color: "#d4af37" }}>
📁 Dossiers Varelli </h1>

  <p>Référence : {reference}</p>

  <br />

  <input
    placeholder="Nom du client"
    value={client}
    onChange={(e) =>
      setClient(e.target.value)
    }
  />

  <br />
  <br />

  <input
    placeholder="Type d'affaire"
    value={type}
    onChange={(e) =>
      setType(e.target.value)
    }
  />

  <br />
  <br />

  <input
    type="number"
    placeholder="Montant"
    value={montant}
    onChange={(e) =>
      setMontant(e.target.value)
    }
  />

  <br />
  <br />

  <textarea
    placeholder="Notes"
    value={notes}
    onChange={(e) =>
      setNotes(e.target.value)
    }
  />

  <br />
  <br />

  <button>
    Créer le dossier
  </button>
</main>

);
}
