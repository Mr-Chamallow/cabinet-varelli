"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

export default function FacturesPage() {

const [client,setClient] = useState("");
const [montant,setMontant] = useState("");
const [description,setDescription] = useState("");
const [echeance,setEcheance] = useState("");

const [factures,setFactures] = useState<any[]>([]);

useEffect(()=>{
charger();
},[]);

async function charger(){

if(!supabase) return;

const { data } = await supabase
.from("factures")
.select("*")
.order("created_at",{ascending:false});

setFactures(data || []);
}

async function creerFacture(){

if(!supabase) return;

const numero =
"FAC-" +
new Date().getFullYear() +
"-" +
String(Date.now()).slice(-5);

const { error } = await supabase
.from("factures")
.insert({
numero,
client,
montant:Number(montant),
description,
date_echeance:echeance,
statut:"En attente"
});

if(error){
alert(error.message);
return;
}

setClient("");
setMontant("");
setDescription("");
setEcheance("");

charger();
}

function pdf(f:any){

const doc = new jsPDF();

doc.setFillColor(15,23,42);
doc.rect(0,0,210,40,"F");

doc.setTextColor(255,255,255);
doc.setFontSize(24);
doc.text("CABINET VARELLI",20,25);

doc.setTextColor(0,0,0);

doc.setFontSize(12);

doc.text(`Facture : ${f.numero}`,20,60);
doc.text(`Client : ${f.client}`,20,75);
doc.text(`Montant : ${Number(f.montant).toLocaleString()} $`,20,90);
doc.text(`Statut : ${f.statut}`,20,105);

doc.text(
`Description : ${f.description || "-"}`,
20,
120
);

doc.save(`${f.numero}.pdf`);
}

return(

<main
style={{
padding:40,
minHeight:"100vh",
background:"#0f172a",
color:"white"
}}
>

<h1
style={{
fontSize:"3rem",
color:"#d4af37"
}}
>
💰 Facturation
</h1>

<div
style={{
background:"#1e293b",
padding:25,
borderRadius:15,
marginTop:20,
marginBottom:30
}}
>

<input
placeholder="Client"
value={client}
onChange={(e)=>setClient(e.target.value)}
style={input}
/>

<input
type="number"
placeholder="Montant"
value={montant}
onChange={(e)=>setMontant(e.target.value)}
style={input}
/>

<input
type="date"
value={echeance}
onChange={(e)=>setEcheance(e.target.value)}
style={input}
/>

<textarea
placeholder="Description"
value={description}
onChange={(e)=>setDescription(e.target.value)}
style={{
...input,
height:120
}}
/>

<button
onClick={creerFacture}
style={btn}
>
Créer la facture
</button>

</div>

<h2>Historique</h2>

{factures.map((f)=>(

<div
key={f.id}
style={{
background:"#1e293b",
padding:20,
borderRadius:15,
marginBottom:15,
border:"1px solid #334155"
}}
>

<h3 style={{color:"#d4af37"}}>
{f.numero}
</h3>

<p><b>Client :</b> {f.client}</p>

<p>
<b>Montant :</b>
{" "}
{Number(f.montant).toLocaleString()}
$
</p>

<p>
<b>Statut :</b>
{" "}
{f.statut}
</p>

<p>
<b>Échéance :</b>
{" "}
{f.date_echeance || "-"}
</p>

<button
onClick={()=>pdf(f)}
style={btn}
>
Télécharger PDF
</button>

</div>

))}

</main>

);
}

const input = {
width:"100%",
padding:"12px",
marginBottom:"15px",
borderRadius:"10px",
border:"1px solid #334155",
background:"#111827",
color:"white"
};

const btn = {
padding:"12px 20px",
border:"none",
borderRadius:"10px",
background:"#d4af37",
fontWeight:"bold",
cursor:"pointer"
};
