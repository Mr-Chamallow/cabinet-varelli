"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CodesJuridiques from "@/components/cabinet/CodesJuridiques";

// Codes juridiques de San Andreas : lecture seule, recherche par mot et par #.
export default function Page() {
  return (
    <CabinetShell title="Codes juridiques" icon="📚" desc="Codes, lois et recherche par #" perms={["avocat"]}>
      {() => <CodesJuridiques />}
    </CabinetShell>
  );
}
