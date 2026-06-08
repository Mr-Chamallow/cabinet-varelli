"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function FacturesPage() {
  const [client, setClient] = useState("");
  const [montant, setMontant] = useState("");
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

    await supabase.from("factures").insert({
      numero,
      client,
      montant: Number(montant),
    });

    setClient("");
    setMontant("");

    charger();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>💵 Factures</h1>

      <input
        placeholder="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Montant"
        value={montant}
        onChange={(e) => setMontant(e.target.value)}
      />

      <br /><br />

      <button onClick={creerFacture}>
        Créer facture
      </button>

      <hr />

      {factures.map((f) => (
        <div key={f.id}>
          <b>{f.numero}</b> - {f.client} - {f.montant}$
        </div>
      ))}
    </main>
  );
}