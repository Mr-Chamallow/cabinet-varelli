"use client";
import { useState } from "react";
import ComptaFactures from "@/components/compta/ComptaFactures";
import ComptaDevis from "@/components/compta/ComptaDevis";
import ComptaDepenses from "@/components/compta/ComptaDepenses";
import ComptaCommissions from "@/components/compta/ComptaCommissions";
import ComptaBilan from "@/components/compta/ComptaBilan";

const ONGLETS = [
  { id: "factures", label: "Factures", composant: ComptaFactures },
  { id: "devis", label: "Devis", composant: ComptaDevis },
  { id: "depenses", label: "Dépenses", composant: ComptaDepenses },
  { id: "commissions", label: "Commissions", composant: ComptaCommissions },
  { id: "bilan", label: "Bilan", composant: ComptaBilan },
];

// Comptabilité du cabinet : réservée à la permission "Comptabilité"
export default function Comptabilite() {
  const [onglet, setOnglet] = useState("factures");
  const actif = ONGLETS.find(o => o.id === onglet) || ONGLETS[0];
  const Composant = actif.composant;
  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ONGLETS.map(o => (
          <button key={o.id} className={`btn btn-sm ${onglet === o.id ? "" : "btn-outline"}`} onClick={() => setOnglet(o.id)}>{o.label}</button>
        ))}
      </div>
      <Composant />
    </div>
  );
}
