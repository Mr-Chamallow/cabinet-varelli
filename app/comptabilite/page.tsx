"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ComptabilitePage() {

const [ca,setCa] = useState(0);

useEffect(()=>{
charger();
},[]);

async function charger(){

if(!supabase) return;

const { data } = await supabase
.from("factures")
.select("*");

const total =
(data || [])
.reduce(
(a,b)=>
a + Number(b.montant || 0),
0
);

setCa(total);
}

return(

<main
style={{
padding:40,
background:"#0f172a",
color:"white",
minHeight:"100vh"
}}
>

<h1>📈 Comptabilité</h1>

<div
style={{
background:"#111827",
padding:30,
borderRadius:15,
marginTop:20
}}
>

<h2>Chiffre d'affaires</h2>

<h1
style={{
color:"#d4af37",
fontSize:"3rem"
}}
>
{ca.toLocaleString()} $
</h1>

</div>

</main>

);
}
