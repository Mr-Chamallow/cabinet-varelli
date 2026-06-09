"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ClientsPage() {

const [clients,setClients] = useState<any[]>([]);
const [search,setSearch] = useState("");

const [nomRp,setNomRp] = useState("");
const [telephone,setTelephone] = useState("");
const [organisation,setOrganisation] = useState("");
const [notes,setNotes] = useState("");

useEffect(()=>{
charger();
},[]);

async function charger() {

if(!supabase) return;

const { data } = await supabase
  .from("clients")
  .select("*")
  .order("created_at",{ascending:false});

setClients(data || []);

}

async function ajouter() {

if(!supabase) return;

await supabase
  .from("clients")
  .insert({
    nom_rp: nomRp,
    telephone,
    organisation,
    notes
  });

setNomRp("");
setTelephone("");
setOrganisation("");
setNotes("");

charger();

}

async function supprimer(id:string) {

if(!window.confirm("Supprimer ce client ?"))
  return;

await supabase
  ?.from("clients")
  .delete()
  .eq("id",id);

charger();

}

return (
<main style={{
minHeight:"100vh",
background:"#0f172a",
color:"white",
padding:"40px"
}}>

  <h1 style={{color:"#d4af37"}}>
    👥 Clients
  </h1>

  <input
    placeholder="Recherche"
    value={search}
    onChange={(e)=>setSearch(e.target.value)}
  />

  <br/><br/>

  <input
    placeholder="Nom RP"
    value={nomRp}
    onChange={(e)=>setNomRp(e.target.value)}
  />

  <br/><br/>

  <input
    placeholder="Téléphone"
    value={telephone}
    onChange={(e)=>setTelephone(e.target.value)}
  />

  <br/><br/>

  <input
    placeholder="Organisation"
    value={organisation}
    onChange={(e)=>setOrganisation(e.target.value)}
  />

  <br/><br/>

  <textarea
    placeholder="Notes"
    value={notes}
    onChange={(e)=>setNotes(e.target.value)}
  />

  <br/><br/>

  <button onClick={ajouter}>
    Ajouter
  </button>

  <hr/>

  {clients
  .filter(c =>
    (c.nom_rp || "")
    .toLowerCase()
    .includes(search.toLowerCase())
  )
  .map(client => (

    <div
      key={client.id}
      style={{
        background:"#1e293b",
        padding:"15px",
        borderRadius:"10px",
        marginBottom:"10px"
      }}
    >
      <b>{client.nom_rp}</b>

      <br/>

      {client.telephone}

      <br/>

      {client.organisation}

      <br/>

      {client.notes}

      <br/><br/>

      <button
        onClick={() =>
          supprimer(client.id)
        }
      >
        Supprimer
      </button>
    </div>

  ))}
</main>

);
}
