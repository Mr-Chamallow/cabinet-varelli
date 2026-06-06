"use client";

import { useMemo, useState } from "react";

export default function SimulateurPage() {
  const [crimes, setCrimes] = useState(0);
  const [majeurs, setMajeurs] = useState(0);
  const [mineurs, setMineurs] = useState(0);

  const [risque, setRisque] = useState(0);

  const [bonBoulot, setBonBoulot] = useState(false);
  const [proces, setProces] = useState(false);
  const [planteVerte, setPlanteVerte] = useState(false);

  const calcul = useMemo(() => {
    const totalCrimes = crimes * 22500;
    const totalMajeurs = majeurs * 12000;
    const totalMineurs = mineurs * 5000;

    const sousTotal =
      totalCrimes +
      totalMajeurs +
      totalMineurs;

    let bonus = risque;

    if (bonBoulot) bonus += 15;
    if (proces) bonus += 35;
    if (planteVerte) bonus -= 15;

    const total =
      sousTotal +
      (sousTotal * bonus) / 100;

    return {
      totalCrimes,
      totalMajeurs,
      totalMineurs,
      sousTotal,
      bonus,
      total: Math.round(total),
    };
  }, [
    crimes,
    majeurs,
    mineurs,
    risque,
    bonBoulot,
    proces,
    planteVerte,
  ]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        color: "white",
        padding: "40px",
      }}
    >
      <h1 style={{ color: "#d4af37" }}>
        ⚖ Cabinet Varelli
      </h1>

      <p>
        Seul Dieu peut juger
      </p>

      <hr />

      <h2>Infractions</h2>

      <label>Crimes</label>
      <br />
      <input
        type="number"
        min="0"
        value={crimes}
        onChange={(e) =>
          setCrimes(Number(e.target.value))
        }
      />

      <br />
      <br />

      <label>Délits majeurs</label>
      <br />
      <input
        type="number"
        min="0"
        value={majeurs}
        onChange={(e) =>
          setMajeurs(Number(e.target.value))
        }
      />

      <br />
      <br />

      <label>Délits mineurs</label>
      <br />
      <input
        type="number"
        min="0"
        value={mineurs}
        onChange={(e) =>
          setMineurs(Number(e.target.value))
        }
      />

      <br />
      <br />

      <h2>Risque</h2>

      <select
        value={risque}
        onChange={(e) =>
          setRisque(Number(e.target.value))
        }
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
          onChange={() =>
            setBonBoulot(!bonBoulot)
          }
        />
        Bon boulot (+15%)
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={proces}
          onChange={() =>
            setProces(!proces)
          }
        />
        Procès (+35%)
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={planteVerte}
          onChange={() =>
            setPlanteVerte(!planteVerte)
          }
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
          maxWidth: "600px",
        }}
      >
        <h2>Facturation</h2>

        <p>
          Crimes :{" "}
          {calcul.totalCrimes.toLocaleString()} $
        </p>

        <p>
          Délits majeurs :{" "}
          {calcul.totalMajeurs.toLocaleString()} $
        </p>

        <p>
          Délits mineurs :{" "}
          {calcul.totalMineurs.toLocaleString()} $
        </p>

        <hr />

        <p>
          Sous-total :{" "}
          {calcul.sousTotal.toLocaleString()} $
        </p>

        <p>
          Modificateur : {calcul.bonus}%
        </p>

        <h1
          style={{
            color: "#d4af37",
          }}
        >
          {calcul.total.toLocaleString()} $
        </h1>
      </div>
    </main>
  );
}