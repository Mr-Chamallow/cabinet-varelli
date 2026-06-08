"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

export default function FacturesPage() {
  const [client, setClient] = useState("");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [factures, setFactures] = useState<any[]>([]);

  async function charger() {
    if (!supabase) return;

    const { data } = await supabase
      .from("factures")
      .select("*")
      .order("created_at", { ascending: false });

    setFactures(data || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerFacture() {
    if (!supabase) return;

    const numero =
      "FAC-" +
      new Date().getFullYear() +
      "-" +
      String(Date.now()).slice(-5);

    const { error } = await supabase
      .from("factures")
      .insert({
        numero,
        client,
        montant: Number(montant),
        description,
        statut: "En attente",
      });

    if (error) {
      alert(error.message);
      return;
    }

    setClient("");
    setMontant("");
    setDescription("");

    charger();
  }

  function genererPDF(facture: any) {
    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("CABINET VARELLI", 20, 20);

    pdf.setFontSize(12);

    pdf.text(`Facture : ${facture.numero}`, 20, 50);

    pdf.text(`Client : ${facture.client}`, 20, 65);

    pdf.text(
      `Montant : ${Number(
        facture.montant
      ).toLocaleString()} $`,
      20,
      80
    );

    pdf.text(
      `Description : ${
        facture.description || "-"
      }`,
      20,
      95
    );

    pdf.text(
      `Statut : ${
        facture.statut || "En attente"
      }`,
      20,
      110
    );

    pdf.save(`${facture.numero}.pdf`);
  }

  async function supprimer(id: string) {
    if (!supabase) return;

    await supabase
      .from("factures")
      .delete()
      .eq("id", id);

    charger();
  }

  return (
    <main
      style={{
        padding: 40,
        minHeight: "100vh",
        background: "#111",
        color: "white",
      }}
    >
      <h1
        style={{
          color: "#d4af37",
          marginBottom: 30,
        }}
      >
        💰 Factures
      </h1>

      <input
        placeholder="Client"
        value={client}
        onChange={(e) =>
          setClient(e.target.value)
        }
        style={{
          width: "100%",
          maxWidth: 500,
          padding: 10,
        }}
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
        style={{
          width: "100%",
          maxWidth: 500,
          padding: 10,
        }}
      />

      <br />
      <br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
        style={{
          width: "100%",
          maxWidth: 500,
          height: 100,
          padding: 10,
        }}
      />

      <br />
      <br />

      <button
        onClick={creerFacture}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
        }}
      >
        Créer la facture
      </button>

      <hr
        style={{
          marginTop: 30,
          marginBottom: 30,
        }}
      />

      <h2>Historique</h2>

      {factures.length === 0 && (
        <p>Aucune facture.</p>
      )}

      {factures.map((f) => (
        <div
          key={f.id}
          style={{
            background: "#1b1b1b",
            padding: 20,
            marginBottom: 15,
            borderRadius: 10,
          }}
        >
          <h3>{f.numero}</h3>

          <p>
            <b>Client :</b> {f.client}
          </p>

          <p>
            <b>Montant :</b>{" "}
            {Number(
              f.montant
            ).toLocaleString()} $
          </p>

          <p>
            <b>Description :</b>{" "}
            {f.description || "-"}
          </p>

          <p>
            <b>Statut :</b>{" "}
            {f.statut || "En attente"}
          </p>

          <button
            onClick={() =>
              genererPDF(f)
            }
            style={{
              marginRight: 10,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Télécharger PDF
          </button>

          <button
            onClick={() =>
              supprimer(f.id)
            }
            style={{
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}