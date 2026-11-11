"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetDossiers from "@/components/cabinet/CabinetDossiers";
import { hasPermission } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Nouveau dossier" icon="" desc="Ouvrir une demande et échanger en privé" perms={["avocat", "cabinet_dossiers"]}>
      {(user) => <CabinetDossiers staff={hasPermission(user, "cabinet_dossiers")} />}
    </CabinetShell>
  );
}
