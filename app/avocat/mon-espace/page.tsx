"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import MonEspace from "@/components/cabinet/MonEspace";

export default function Page() {
  return (
    <CabinetShell title="Mon espace" icon="🧭" desc="Tes dossiers, factures et rendez-vous en un coup d'œil" perms={["avocat"]}>
      {() => <MonEspace />}
    </CabinetShell>
  );
}
