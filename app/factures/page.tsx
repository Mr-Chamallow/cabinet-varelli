"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function FacturesPage() {

const factureRef = useRef<HTMLDivElement>(null);

const [client,setClient] = useState("");
const [montant,setMontant] = useState("");
const [description,setDescription] = useState("");
const [factures,setFactures] = useState<any[]>([]);

useEffect(()=>{
charger();
},[]);

async function charger() {

if(!supabase) return;

const { data } = await supabase
.from("factures")
.select("*")
.order("created_at",{ascending:false});

setFactures(data || []);
}

async function creerFacture() {

if(!supabase) return;

const numero =
"FAC-" +
new Date().getFullYear() +
"-" +
String(Date.now()).slice(-5);

await supabase
.from("factures")
.insert({
numero,
client,
montant:Number(montant),
description,
statut:"En attente"
});

setClient("");
setMontant("");
setDescription("");

charger();
}

async function exportPDF(id:string){

const element =
document.getElementById(id);

if(!element) return;

const canvas =
await html2canvas(element);

const img =
canvas.toDataURL("image/png");

const pdf =
new jsPDF("p","mm","a4");

pdf.addImage(
img,
"PNG",
10,
10,
190,
0
);

pdf.save("facture.pdf");
}

async function exportPNG(id:string){

const element =
document.getElementById(id);

if(!element) return;

const canvas =
await html2canvas(element);

const a =
document.createElement("a");

a.href =
canvas.toDataURL();

a.download =
"facture.png";

a.click();
}

return (

<main
style={{
padding:40,
background:"#0f172a",
minHeight:"100vh",
color:"white"
}}
>

<h1
style={{
color:"#d4af37",
fontSize:"2.5rem"
}}
>
💰 Factures
</h1>

<input
placeholder="Client"
value={client}
onChange={(e)=>setClient(e.target.value)}
/>

<br/><br/>

<input
type="number"
placeholder="Montant"
value={montant}
onChange={(e)=>setMontant(e.target.value)}
/>

<br/><br/>

<textarea
placeholder="Description"
value={description}
onChange={(e)=>setDescription(e.target.value)}
/>

<br/><br/>

<button onClick={creerFacture}>
Créer facture
</button>

<hr/>

{factures.map((f)=>(

<div
key={f.id}
id={f.id}
style={{
background:"#111827",
padding:25,
borderRadius:15,
border:"2px solid #d4af37",
marginBottom:20
}}
>

<h2 style={{color:"#d4af37"}}>
{f.numero}
</h2>

<p><b>Client :</b> {f.client}</p>

<p>
<b>Montant :</b>
{" "}
{Number(f.montant).toLocaleString()} $
</p>

<p>
<b>Description :</b>
{" "}
{f.description}
</p>

<p>
<b>Statut :</b>
{" "}
<span
style={{
background:"#16a34a",
padding:"5px 10px",
borderRadius:20
}}
>
{f.statut}
</span>
</p>

<button
onClick={()=>exportPDF(f.id)}
>
PDF
</button>

<button
onClick={()=>exportPNG(f.id)}
style={{marginLeft:10}}
>
PNG
</button>

</div>

))}
</main>
);
}
