"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Journal from "@/components/cabinet/Journal";

export default function Page() {
  return (
    <CabinetShell title="Journal d'activité" icon="" desc="Qui a fait quoi et quand (direction uniquement)" perms={["cabinet_attribution"]}>
      {() => <Journal />}
    </CabinetShell>
  );
}
