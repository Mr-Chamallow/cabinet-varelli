"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import MesCommissions from "@/components/cabinet/MesCommissions";

export default function Page() {
  return (
    <CabinetShell title="Mes commissions" icon="💰" desc="Tes prestations, commissions et versements" perms={["avocat"]}>
      {() => <MesCommissions />}
    </CabinetShell>
  );
}
