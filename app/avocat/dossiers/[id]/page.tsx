"use client";
import { useParams } from "next/navigation";
import CabinetShell from "@/components/cabinet/CabinetShell";
import DossierChat from "@/components/cabinet/DossierChat";
import { hasPermission } from "@/lib/auth";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <CabinetShell title="Dossier" icon="" desc="Messagerie privée du dossier" perms={["avocat", "cabinet_dossiers"]}>
      {(user) => (
        <DossierChat
          id={id}
          staff={hasPermission(user, "cabinet_dossiers")}
          direction={hasPermission(user, "cabinet_attribution")}
        />
      )}
    </CabinetShell>
  );
}
