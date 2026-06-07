"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DossiersPage() {

  const [client,setClient] = useState("");
  const [typeAffaire,setTypeAffaire] = useState("");
  const [montant,setMontant] = useState("");
  const [notes,setNotes] = useState("");

  const [dossiers,setDossiers] = useState<any[]>([]);

  async function chargerDossiers() {

    const { data } = await supabase
      .from("dossiers")
      .select("*")
      .order("created_at",{ ascending:false });

    setDossiers(data || []);
  }

  async function creerDossier() {

    const reference =
      "CV-" + Date.now();

    const { error } = await supabase
      .from("dossiers")
      .insert({
        reference,
        client,
        type_affaire:typeAffaire,
        montant:Number(montant),
        notes
      });

    if(error){
      alert(error.message);
      return;
    }

    alert("Dossier créé : " + reference);

    setClient("");
    setTypeAffaire("");
    setMontant("");
    setNotes("");

    chargerDossiers();
  }

  useEffect(() => {
    chargerDossiers();
  },[]);

  return (
    <main style={{padding:40}}>

      <h1>📁 Gestion des dossiers</h1>

      <br />

      <input
        placeholder="Client"
        value={client}
        onChange={(e)=>setClient(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Type affaire"
        value={typeAffaire}
        onChange={(e)=>setTypeAffaire(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Montant"
        value={montant}
        onChange={(e)=>setMontant(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e)=>setNotes(e.target.value)}
      />

      <br /><br />

      <button onClick={creerDossier}>
        Créer dossier
      </button>

      <hr />

      <h2>Dossiers existants</h2>

      {dossiers.map((dossier)=>(
        <div
          key={dossier.id}
          style={{
            border:"1px solid #333",
            padding:15,
            marginBottom:10,
            borderRadius:10
          }}
        >
          <b>{dossier.reference}</b>

          <br />

          {dossier.client}

          <br />

          {dossier.type_affaire}

          <br />

          {Number(dossier.montant).toLocaleString()} $
        </div>
      ))}

    </main>
  );
}
