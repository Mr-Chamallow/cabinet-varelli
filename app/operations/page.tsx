"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function OperationsPage() {

const [operations, setOperations] = useState<any[]>([]);

const [type, setType] = useState("Entrée");
const [montant, setMontant] = useState("");
const [motif, setMotif] = useState("");

useEffect(() => {
charger();
}, []);

async function charger() {


if (!supabase) return;

const { data } = await supabase
  .from("operations")
  .select("*")
  .order("created_at", { ascending: false });

setOperations(data || []);


}

async function ajouter() {


if (!supabase) return;

await supabase
  .from("operations")
  .insert({
    type,
    montant: Number(montant),
    motif
  });

setMontant("");
setMotif("");

charger();


}

async function supprimer(id: string) {


if (!supabase) return;

await supabase
  .from("operations")
  .delete()
  .eq("id", id);

charger();


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
📊 Opérations </h1>

  <div
    style={{
      background: "#1e293b",
      padding: "20px",
      borderRadius: "15px",
      maxWidth: "600px",
      marginBottom: "30px"
    }}
  >
    <select
      value={type}
      onChange={(e) => setType(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "15px"
      }}
    >
      <option>Entrée</option>
      <option>Sortie</option>
    </select>

    <input
      type="number"
      placeholder="Montant"
      value={montant}
      onChange={(e) => setMontant(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "15px"
      }}
    />

    <input
      placeholder="Motif"
      value={motif}
      onChange={(e) => setMotif(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "15px"
      }}
    />

    <button
      onClick={ajouter}
      style={{
        width: "100%",
        background: "#d4af37",
        color: "#111",
        border: "none",
        padding: "12px",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      Ajouter l'opération
    </button>
  </div>

  <h2>Historique</h2>

  {operations.map((op) => (

    <div
      key={op.id}
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "15px",
        marginBottom: "15px"
      }}
    >
      <h3>{op.type}</h3>

      <p>
        {Number(op.montant).toLocaleString()} $
      </p>

      <p>{op.motif}</p>

      <button
        onClick={() => supprimer(op.id)}
        style={{
          background: "#dc2626",
          color: "white",
          border: "none",
          padding: "10px 15px",
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        Supprimer
      </button>
    </div>

  ))}
</main>

);
}
