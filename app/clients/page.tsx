"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  async function chargerClients() {
    if (!supabase) return;

    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    setClients(data || []);
  }

  async function ajouterClient() {
    if (!supabase) return;

    const { error } = await supabase
      .from("clients")
      .insert({
        nom,
        telephone,
        email,
        notes,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNom("");
    setTelephone("");
    setEmail("");
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
        padding: 40,
      }}
    >
      <h1 style={{ color: "#d4af37" }}>
        👥 Clients
      </h1>

      <div
        style={{
          background: "#1b1b1b",
          padding: 20,
          borderRadius: 15,
          marginBottom: 30,
        }}
      >
        <input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />

        <br />
        <br />

        <input
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) =>
            setTelephone(e.target.value)
          }
        />

        <br />
        <br />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <br />
        <br />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
        />

        <br />
        <br />

        <button onClick={ajouterClient}>
          Ajouter le client
        </button>
      </div>

      <h2>Liste des clients</h2>

      {clients.map((client) => (
        <div
          key={client.id}
          style={{
            background: "#1b1b1b",
            padding: 20,
            borderRadius: 15,
            marginBottom: 15,
          }}
        >
          <h3>{client.nom}</h3>

          <p>{client.telephone}</p>

          <p>{client.email}</p>

          <p>{client.notes}</p>

          <button
            onClick={() =>
              supprimerClient(client.id)
            }
          >
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}