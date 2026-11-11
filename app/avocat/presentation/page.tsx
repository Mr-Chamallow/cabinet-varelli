"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetPresentation from "@/components/cabinet/CabinetPresentation";
import { hasWriteAccess } from "@/lib/auth";
import { ObsLogo } from "@/components/ObsLogo";

export default function Page() {
  return (
    <CabinetShell title="Présentation" icon={<ObsLogo size={28} />} desc="Qui nous sommes" perms={["avocat", "cabinet_presentation"]}>
      {(user) => <CabinetPresentation canWrite={hasWriteAccess(user, "cabinet_presentation")} />}
    </CabinetShell>
  );
}
