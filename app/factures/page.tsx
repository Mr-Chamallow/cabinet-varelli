"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function FacturesPage() {
  const [client, setClient] = useState("");
  const [montant, setMontant] = useState("");

  function genererFacture() {
    const numero =
      "FAC-26-" +
      String(Date.now()).slice(-5);

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("CABINET VARELLI", 20, 20);

    pdf.setFontSize(12);

    pdf.text(
      `Facture : ${numero}`,
      20,
      40
    );

    pdf.text(
      `Client : ${client}`,
      20,
      55
    );

    pdf.text(
      `Montant : ${montant}$`,
      20,
      70
    );

    pdf.text(
      `Date : ${new Date().toLocaleDateString()}`,
      20,
      85
    );

    pdf.text(
      "Seul Dieu peut juger.",
      20,
      120
    );

    pdf.save(`${numero}.pdf`);
  }

  return (
    <main
      style={{
        padding:40,
        minHeight:"100vh",
        background:"#111",
        color:"white"
      }}
    >
      <h1 style={{color:"#d4af37"}}>
        🧾 Facturation
      </h1>

      <br />

      <input
        placeholder="Client"
        value={client}
        onChange={(e)=>
          setClient(e.target.value)
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Montant"
        value={montant}
        onChange={(e)=>
          setMontant(e.target.value)
        }
      />

      <br /><br />

      <button
        onClick={genererFacture}
      >
        Générer PDF
      </button>
    </main>
  );
}