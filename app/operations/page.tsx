"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function OperationsPage() {

const [operations,setOperations] = useState<any[]>([]);

const [type,setType] = useState("Entrée");
const [montant,setMontant] = useState("");
const [motif,setMotif] = useState("");

useEffect(()=>{
charger();
},[]);

async function charger(){

if(!supabase) return;

const { data } = await supabase
.from("operations")
.select("*")
.order("created_at",{ascending:false});

setOperations(data || []);
}

async function ajouter(){

if(!supabase) return;

await supabase
.from("operations")
.insert({
type,
montant:Number(montant),
motif
});

setMontant("");
setMotif("");

charger();
}

return(

<main style={{
padding:40,
background:"#0f172a",
color:"white",
minHeight:"100vh"
}}>

<h1>📊 Opérations</h1>

<select
value={type}
onChange={(e)=>setType(e.target.value)}

>

<option>Entrée</option>
<option>Sortie</option>
</select>

<br/><br/>

<input
type="number"
placeholder="Montant"
value={montant}
onChange={(e)=>setMontant(e.target.value)}
/>

<br/><br/>

<input
placeholder="Motif"
value={motif}
onChange={(e)=>setMotif(e.target.value)}
/>

<br/><br/>

<button onClick={ajouter}>
Ajouter
</button>

<hr/>

{operations.map(op=>(

<div
key={op.id}
style={{
background:"#111827",
padding:15,
marginBottom:10,
borderRadius:10
}}
>

<b>{op.type}</b>

<br/>

{Number(op.montant).toLocaleString()} $

<br/>

{op.motif}

</div>

))}

</main>

);
}
