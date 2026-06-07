"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [organisation, setOrganisation] = useState("");
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

    if (!nom.trim()) {
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

  async function supprimerClient(id:string) {
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
        minHeight:"100vh",
        background:"#0f0f0f",
        color:"white",
        padding:"40px"
      }}
    >
      <h1 style={{color:"#d4af37"}}>
        👤 Clients Varelli
      </h1>

      <div
        style={{
          background:"#1a1a1a",
          padding:"20px",
          borderRadius:"12px",
          maxWidth:"700px",
          marginTop:"20px"
        }}
      >
        <input
          placeholder="Nom"
          value={nom}
          onChange={(e)=>setNom(e.target.value)}
          style={{width:"100%",padding:"10px"}}
        />

        <br /><br />

        <input
          placeholder="Téléphone"
          value={telephone}
          onChange={(e)=>setTelephone(e.target.value)}
          style={{width:"100%",padding:"10px"}}
        />

        <br /><br />

        <input
          placeholder="Organisation"
          value={organisation}
          onChange={(e)=>setOrganisation(e.target.value)}
          style={{width:"100%",padding:"10px"}}
        />

        <br /><br />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e)=>setNotes(e.target.value)}
          style={{
            width:"100%",
            padding:"10px",
            minHeight:"100px"
          }}
        />

        <br /><br />

        <button
          onClick={ajouterClient}
          style={{
            background:"#d4af37",
            color:"black",
            border:"none",
            padding:"12px 20px",
            cursor:"pointer",
            fontWeight:"bold"
          }}
        >
          Ajouter le client
        </button>
      </div>

      <h2 style={{marginTop:"40px"}}>
        Liste des clients
      </h2>

      {clients.map((client)=>(
        <div
          key={client.id}
          style={{
            background:"#1a1a1a",
            padding:"20px",
            borderRadius:"12px",
            marginTop:"15px"
          }}
        >
          <h3>{client.nom}</h3>

          <p>📞 {client.telephone || "-"}</p>

          <p>🏢 {client.organisation || "-"}</p>

          <p>📝 {client.notes || "-"}</p>

          <button
            onClick={()=>supprimerClient(client.id)}
            style={{
              background:"#7a0000",
              color:"white",
              border:"none",
              padding:"10px 15px",
              cursor:"pointer"
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </main>
  );
}
