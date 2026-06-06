"use client";

import { useMemo, useState } from "react";

export default function BlanchimentPage() {
const [montant, setMontant] = useState(0);

const [typeClient, setTypeClient] =
useState("famille");

const taux = useMemo(() => {
switch (typeClient) {
case "independant":
return 30;

  case "petitefrappe":
    return 25;

  default:
    return 20;
}

}, [typeClient]);

const commission = Math.round(
montant * (taux / 100)
);

const rendu = montant - commission;

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
💰 Blanchiment Varelli </h1>

```
  <p>Seul Dieu peut juger</p>

  <br />

  <label>Montant sale</label>

  <br />

  <input
    type="number"
    value={montant}
    onChange={(e) =>
      setMontant(Number(e.target.value))
    }
  />

  <br />
  <br />

  <label>Type de client</label>

  <br />

  <select
    value={typeClient}
    onChange={(e) =>
      setTypeClient(e.target.value)
    }
  >
    <option value="famille">
      Famille
    </option>

    <option value="organisation">
      Organisation
    </option>

    <option value="gang">
      Gang
    </option>

    <option value="petitefrappe">
      Petite frappe
    </option>

    <option value="independant">
      Indépendant
    </option>
  </select>

  <br />
  <br />

  <div
    style={{
      background: "#151515",
      border: "1px solid #d4af37",
      borderRadius: "16px",
      padding: "25px",
      maxWidth: "500px",
    }}
  >
    <h2>Résultat</h2>

    <p>
      Commission :{" "}
      {commission.toLocaleString()} $
    </p>

    <p>
      Argent rendu :{" "}
      {rendu.toLocaleString()} $
    </p>

    <p>
      Taux : {taux}%
    </p>
  </div>
</main>

);
}
