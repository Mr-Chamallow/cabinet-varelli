"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

export default function FacturesPage() {

const [client, setClient] = useState("");
const [montant, setMontant] = useState("");
const [description, setDescription] = useState("");

const [factures, setFactures] = useState<any[]>([]);
const [preview, setPreview] = useState<any>(null);

useEffect(() => {
charger();
}, []);

async function charger() {


if (!supabase) return;

const { data } = await supabase
  .from("factures")
  .select("*")
  .order("created_at", { ascending: false });

setFactures(data || []);


}

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
    statut: "En attente"
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

async function supprimer(id: string) {


if (!supabase) return;

await supabase
  .from("factures")
  .delete()
  .eq("id", id);

charger();


}

function genererPDF(facture: any) {


const pdf = new jsPDF();

pdf.setFontSize(24);
pdf.text("CABINET VARELLI", 20, 25);

pdf.setFontSize(14);

pdf.text(`Facture : ${facture.numero}`, 20, 50);
pdf.text(`Client : ${facture.client}`, 20, 65);
pdf.text(`Montant : ${Number(facture.montant).toLocaleString()} $`, 20, 80);
pdf.text(`Description : ${facture.description || "-"}`, 20, 95);
pdf.text(`Statut : ${facture.statut || "En attente"}`, 20, 110);

pdf.save(`${facture.numero}.pdf`);


}

return (
<main
style={{
minHeight: "100vh",
background: "#0f172a",
color: "white",
padding: "40px"
}}
>
<h1
style={{
color: "#d4af37",
marginBottom: "30px"
}}
>
💰 Factures </h1>


  <div
    style={{
      background: "#1e293b",
      padding: "25px",
      borderRadius: "15px",
      maxWidth: "700px",
      marginBottom: "40px"
    }}
  >

    <input
      placeholder="Client"
      value={client}
      onChange={(e) => setClient(e.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        marginBottom: "15px"
      }}
    />

    <input
      type="number"
      placeholder="Montant"
      value={montant}
      onChange={(e) => setMontant(e.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        marginBottom: "15px"
      }}
    />

    <textarea
      placeholder="Description"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      style={{
        width: "100%",
        height: "120px",
        padding: "12px",
        marginBottom: "15px"
      }}
    />

    <button
      onClick={creerFacture}
      style={{
        width: "100%",
        background: "#d4af37",
        color: "#111",
        border: "none",
        padding: "14px",
        borderRadius: "10px",
        fontWeight: "bold",
        cursor: "pointer"
      }}
    >
      Créer la facture
    </button>

  </div>

  <h2>Historique</h2>

  {factures.map((f) => (

    <div
      key={f.id}
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "15px",
        marginBottom: "15px"
      }}
    >
      <h3>{f.numero}</h3>

      <p><b>Client :</b> {f.client}</p>

      <p>
        <b>Montant :</b>{" "}
        {Number(f.montant).toLocaleString()} $
      </p>

      <p>
        <b>Statut :</b>{" "}
        {f.statut || "En attente"}
      </p>

      <button
        onClick={() => setPreview(f)}
        style={{
          marginRight: "10px",
          padding: "10px",
          cursor: "pointer"
        }}
      >
        Voir
      </button>

      <button
        onClick={() => genererPDF(f)}
        style={{
          marginRight: "10px",
          padding: "10px",
          cursor: "pointer"
        }}
      >
        PDF
      </button>

      <button
        onClick={() => supprimer(f.id)}
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "10px",
          cursor: "pointer"
        }}
      >
        Supprimer
      </button>
    </div>

  ))}

  {preview && (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >

      <div
        style={{
          background: "white",
          color: "black",
          padding: "40px",
          borderRadius: "15px",
          width: "700px",
          maxWidth: "90%"
        }}
      >

        <h1>CABINET VARELLI</h1>

        <hr />

        <p><b>Facture :</b> {preview.numero}</p>
        <p><b>Client :</b> {preview.client}</p>

        <p>
          <b>Montant :</b>{" "}
          {Number(preview.montant).toLocaleString()} $
        </p>

        <p>
          <b>Description :</b>{" "}
          {preview.description}
        </p>

        <p>
          <b>Statut :</b>{" "}
          {preview.statut}
        </p>

        <button
          onClick={() => setPreview(null)}
          style={{
            marginTop: "20px",
            padding: "10px 20px"
          }}
        >
          Fermer
        </button>

      </div>

    </div>

  )}

</main>


);
}
