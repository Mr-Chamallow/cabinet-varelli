"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CartesMembres from "@/components/cabinet/CartesMembres";

export default function Page() {
  return (
    <CabinetShell title="Organigramme" icon="🏛️" desc="Notre équipe" perms={["avocat", "cabinet_organigramme"]}>
      {() => <CartesMembres />}
    </CabinetShell>
  );
}
