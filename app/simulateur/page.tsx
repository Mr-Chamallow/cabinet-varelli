"use client";

import { useMemo, useState } from "react";

export default function SimulateurPage() {
  const [typeAffaire, setTypeAffaire] = useState("crime");
  const [risque, setRisque] = useState(0);
  const [bonBoulot, setBonBoulot] = useState(false);
  const [proces, setProces] = useState(false);
  const [planteVerte, setPlanteVerte] = useState(false);

  const total = useMemo(() => {
    let base = 0;

    if (typeAffaire === "mineur") base = 5000;
    if (typeAffaire === "majeur") base = 12000;
    if (typeAffaire === "crime") base = 22500;

    let modif = risque;

    if (bonBoulot) modif += 15;
    if (proces) modif += 35;
    if (planteVerte) modif -= 15;

    return Math.round(base + (base * modif) / 100);
  }, [typeAffaire, risque, bonBoulot, proces, planteVerte]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
      }}
    >
      <h1 style={{ color: "#d4af37" }}>
        ⚖ Simulateur Varelli
      </h1>

      <br />

      <label>Type d'affaire</label>
      <br />
      <select
        value={typeAffaire}
        onChange={(e) => setTypeAffaire(e.target.value)}
      >
        <option value="mineur">Délit mineur (5 000$)</option>
        <option value="majeur">Délit majeur (12 000$)</option>
        <option value="crime">Crime (22 500$)</option>
      </select>

      <br />
      <br />

      <label>Niveau de risque</label>
      <br />
      <select
        value={risque}
        onChange={(e) => setRisque(Number(e.target.value))}
      >
        <option value={0}>Aucun</option>
        <option value={5}>Faible (+5%)</option>
        <option value={10}>Moyen (+10%)</option>
        <option value={20}>Élevé (+20%)</option>
        <option value={35}>Extrême (+35%)</option>
      </select>

      <br />
      <br />

      <label>
        <input
          type="checkbox"
          checked={bonBoulot}
          onChange={() => setBonBoulot(!bonBoulot)}
        />
        Bon boulot (+15%)
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={proces}
          onChange={() => setProces(!proces)}
        />
        Procès (+35%)
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={planteVerte}
          onChange={() => setPlanteVerte(!planteVerte)}
        />
        Plante verte (-15%)
      </label>

      <br />
      <br />

      <div
        style={{
          background: "#1b1b1b",
          padding: "25px",
          borderRadius: "15px",
          maxWidth: "400px",
        }}
      >
        <h2>Total TTC</h2>

        <p
          style={{
            fontSize: "2rem",
            color: "#d4af37",
          }}
        >
          {total.toLocaleString()} $
        </p>
      </div>
    </main>
  );
}