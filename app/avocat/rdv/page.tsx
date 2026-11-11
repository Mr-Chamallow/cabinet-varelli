"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetRdv from "@/components/cabinet/CabinetRdv";
import { hasWriteAccess } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Prise de RDV" icon="📅" desc="Agenda du cabinet" perms={["avocat", "cabinet_rdv"]}>
      {(user) => <CabinetRdv staff={hasWriteAccess(user, "cabinet_rdv")} />}
    </CabinetShell>
  );
}
