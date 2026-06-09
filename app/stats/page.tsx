"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function StatsPage() {

const [clients,setClients] = useState(0);
const [dossiers,setDossiers] = useState(0);
const [factures,setFactures] = useState(0);

useEffect(()=>{
charger();
},[]);

async function charger(){

if(!supabase) return;

const c =
await supabase
.from("clients")
.select("*",{count:"exact",head:true});

const d =
await supabase
.from("dossiers")
.select("*",{count:"exact",head:true});

const f =
await supabase
.from("factures")
.select("*",{count:"exact",head:true});

setClients(c.count || 0);
setDossiers(d.count || 0);
setFactures(f.count || 0);
}

return(

<main style={{padding:40}}>

<h1>📊 Statistiques</h1>

<h2>Clients : {clients}</h2>

<h2>Dossiers : {dossiers}</h2>

<h2>Factures : {factures}</h2>

</main>

);
}
