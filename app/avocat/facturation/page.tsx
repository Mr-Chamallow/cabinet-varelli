"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import ComptaDevis from "@/components/compta/ComptaDevis";
import ComptaFactures from "@/components/compta/ComptaFactures";

// Devis et factures : modifiables par les rôles qui ont la permission "Devis & factures"
export default function Page() {
  return (
    <CabinetShell title="Devis & factures" icon="🧾" desc="Création, envoi et suivi des devis et factures" perms={["cabinet_facturation"]}>
      {() => (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ComptaDevis />
          <ComptaFactures />
        </div>
      )}
    </CabinetShell>
  );
}
