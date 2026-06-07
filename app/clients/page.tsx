"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Client {
  id: string;
  nom: string;
  telephone: string;
  organisation: string;
  notes: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [notes, setNotes] = useState("");

  async function chargerClients() {
    if (!supabase) return;

    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("nom");

    if (data) {
      setClients(data as Client[]);
    }
  }

  async function ajouterClient() {
    if (!supabase) return;

    if (!nom) {
      alert("Nom obligatoire");
      return;
    }

    const { error } = await supabase
      .from("clients")
      .insert({
        nom,
        telephone,
        organisation,
        notes,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNom("");
    setTelephone("");
    setOrganisation("");
    setNotes("");

    chargerClients();
  }

  async function supprimerClient(id: string) {
    if (!supabase) return;

    await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    chargerClients();
  }

  useEffect(() => {
    chargerClients();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
      }}
    >
      <h1
        style={{
          color: "#d4af37",
          marginBottom: "30px",
        }}
      >
        👤 Gestion des Clients
      </h1>

      <div
        style={{
          background: "#1b1b1b",
          padding: "25px",
          borderRadius: "15px",
          marginBottom: "30px",
          maxWidth: "600px",
        }}
      >
        <input
          placeholder="Nom RP"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />

        <br />
        <br />

        <input
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) =>
            setTelephone(e.target.value)
          }
          style={{ width: "100%", padding: 10 }}
        />

        <br />
        <br />

        <input
          placeholder="Organisation"
          value={organisation}
          onChange={(e) =>
            setOrganisation(e.target.value)
          }
          style={{ width: "100%", padding: 10 }}
        />

        <br />
        <br />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
            minHeight: "100px",
          }}
        />

        <br />
        <br />

        <button
          onClick={ajouterClient}
          style={{
            background: "#d4af37",
            border: "none",
            padding: "12px 20px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Ajouter le client
        </button>
      </div>

      <h2>Liste des clients</h2>

      {clients.map((client) => (
        <div
          key={client.id}
          style={{
            background: "#1b1b1b",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>{client.nom}</h3>

          <p>
            📞 {client.telephone || "Aucun"}
          </p>

          <p>
            🏢 {client.organisation || "Aucune"}
          </p>

          <p>
            📝 {client.notes || "Aucune note"}
          </p>

          <button
            onClick={() =>
              supprimerClient(client.id)
            }
            style={{
              background: "#8b0000",
              color: "white",
              border: "none",
              padding: "10px 15px",
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