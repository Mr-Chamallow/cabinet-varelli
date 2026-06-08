"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
      .order("created_at", {
        ascending: false,
      });

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

    await supabase.from("factures").insert({
      numero,
      client,
      montant: Number(montant),
      description,
      statut: "En attente",
    });

    setClient("");
    setMontant("");
    setDescription("");

    charger();
  }

  async function payer(id: string) {
    if (!supabase) return;

    await supabase
      .from("factures")
      .update({
        statut: "Payée",
      })
      .eq("id", id);

    charger();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>💰 Factures</h1>

      <input
        placeholder="Client"
        value={client}
        onChange={(e) =>
          setClient(e.target.value)
        }
      />

      <br /><br />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
      />

      <br /><br />

      <input
        type="number"
        placeholder="Montant"
        value={montant}
        onChange={(e) =>
          setMontant(e.target.value)
        }
      />

      <br /><br />

      <button onClick={creerFacture}>
        Créer Facture
      </button>

      <hr />

      {factures.map((f) => (
        <div
          key={f.id}
          style={{
            border: "1px solid #333",
            padding: 15,
            marginBottom: 10,
          }}
        >
          <b>{f.numero}</b>

          <br />

          {f.client}

          <br />

          {f.description}

          <br />

          {f.montant}$

          <br />

          Statut : {f.statut}

          <br /><br />

          {f.statut !== "Payée" && (
            <button
              onClick={() =>
                payer(f.id)
              }
            >
              Marquer Payée
            </button>
          )}
        </div>
      ))}
    </main>
  );
}