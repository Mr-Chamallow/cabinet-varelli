"use client";
import { useState } from "react";
import ComptaDepenses from "@/components/compta/ComptaDepenses";
import ComptaCommissions from "@/components/compta/ComptaCommissions";
import ComptaBilan from "@/components/compta/ComptaBilan";
import { hasPermission } from "@/lib/auth";

// Chaque onglet a sa propre permission (Administration → Rôles & Permissions)
const ONGLETS = [
  { id: "depenses", label: "Dépenses", perm: "cabinet_depenses", composant: ComptaDepenses },
  { id: "commissions", label: "Commissions", perm: "cabinet_commissions", composant: ComptaCommissions },
  { id: "bilan", label: "Bilan", perm: "cabinet_bilan", composant: ComptaBilan },
];

export default function Comptabilite({ user }: { user: any }) {
  const visibles = ONGLETS.filter(o => hasPermission(user, o.perm));
  const [onglet, setOnglet] = useState(visibles[0]?.id || "");
  const actif = visibles.find(o => o.id === onglet) || visibles[0];
  if (!actif) return <div className="empty-state"><div className="empty-title">Aucun onglet autorisé pour ton rôle</div></div>;
  const Composant = actif.composant;
  return (
    <div>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {visibles.map(o => (
          <button key={o.id} className={`btn btn-sm ${actif.id === o.id ? "" : "btn-outline"}`} onClick={() => setOnglet(o.id)}>{o.label}</button>
        ))}
      </div>
      <Composant />
    </div>
  );
}
