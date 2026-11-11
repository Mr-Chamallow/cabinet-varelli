"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import TarifsCabinet from "@/components/cabinet/TarifsCabinet";

export default function Page() {
  return (
    <CabinetShell title="Tarifs" icon="" desc="Grille des honoraires" perms={["avocat", "cabinet_tarifs"]}>
      {() => <TarifsCabinet />}
    </CabinetShell>
  );
}
