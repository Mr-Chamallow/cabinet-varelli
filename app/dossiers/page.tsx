"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);

  const [client, setClient] = useState("");
  const [typeAffaire, setTypeAffaire] = useState("");
  const [typeClient, setTypeClient] = useState("Indépendant");
  const [risque, setRisque] = useState("Aucun");
  const [montant, setMontant] = useState("");
  const [notes, setNotes] = useState("");

  async function charger() {
    if (!supabase) return;

    const { data } = await supabase
      .from("dossiers")
      .select("*")
      .order("created_at", { ascending: false });

    setDossiers(data || []);
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerDossier() {


    const reference =
      "DOS-" +
      new Date().getFullYear() +
      "-" +
      String(Date.now()).slice(-5);

    const { error } = await supabase
      .from("dossiers")
      .insert({
        reference,
        client,
        type_affaire: typeAffaire,
        type_client: typeClient,
        risque,
        montant: Number(montant),
        notes,
        statut: "Ouvert"
      });

    if (error) {
      alert(error.message);
      return;
    }

    setClient("");
    setTypeAffaire("");
    setMontant("");
    setNotes("");

    charger();
  }

  async function supprimer(id: string) {
    if (!supabase) return;

    if (!window.confirm("Supprimer ce dossier ?")) return;

    const { error } = await supabase.from("dossiers").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    charger();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>📁 Dossiers</h1>

      <input
        placeholder="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Type d'affaire"
        value={typeAffaire}
        onChange={(e) => setTypeAffaire(e.target.value)}
      />

      <br /><br />

      <select
        value={typeClient}
        onChange={(e) => setTypeClient(e.target.value)}
      >
        <option>Indépendant</option>
        <option>Petite frappe</option>
        <option>Gang</option>
        <option>Organisation</option>
        <option>Famille</option>
      </select>

      <br /><br />

      <select
        value={risque}
        onChange={(e) => setRisque(e.target.value)}
      >
        <option>Aucun</option>
        <option>Faible</option>
        <option>Moyen</option>
        <option>Élevé</option>
        <option>Extrême</option>
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
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <br /><br />

      <button onClick={creerDossier}>
        Créer le dossier
      </button>

      <hr />

      {dossiers.map((d) => (
        <div
          key={d.id}
          style={{
            border: "1px solid #333",
            padding: 15,
            marginBottom: 10,
            borderRadius: 10
          }}
        >
          <b>{d.reference}</b>

          <br />

          {d.client}

          <br />

          {d.type_affaire}

          <br />

          {d.type_client}

          <br />

          {d.montant}$

          <br />

          {d.statut}

          <br />
          <button
          onClick={() => supprimer(d.id)}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: "8px",
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