"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function OperationsPage() {
  const [type, setType] = useState("Entrée");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [operations, setOperations] = useState<any[]>([]);

  async function charger() {
    if (!supabase) return;

    const { data } = await supabase
      .from("operations")
      .select("*")
      .order("created_at", { ascending: false });

    setOperations(data || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function ajouter() {
    if (!supabase) return;

    await supabase.from("operations").insert({
      type,
      montant: Number(montant),
      description,
    });

    setMontant("");
    setDescription("");

    charger();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>📊 Opérations</h1>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option>Entrée</option>
        <option>Sortie</option>
      </select>

      <br /><br />

      <input
        type="number"
        placeholder="Montant"
        value={montant}
        onChange={(e) => setMontant(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={ajouter}>
        Ajouter
      </button>

      <hr />

      {operations.map((op) => (
        <div key={op.id}>
          <b>{op.type}</b> - {op.montant}$ - {op.description}
        </div>
      ))}
    </main>
  );
}