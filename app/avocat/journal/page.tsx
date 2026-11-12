"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import { ROLE_PATRON } from "@/lib/cabinetRoles";
import Journal from "@/components/cabinet/Journal";

export default function Page() {
  return (
    <CabinetShell title="Journal d'activité" icon="" desc="Qui a fait quoi et quand (patron uniquement)" perms={["cabinet_attribution"]} roles={[ROLE_PATRON]}>
      {() => <Journal />}
    </CabinetShell>
  );
}
