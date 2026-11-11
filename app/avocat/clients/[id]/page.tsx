"use client";
import { useParams } from "next/navigation";
import CabinetShell from "@/components/cabinet/CabinetShell";
import FicheClient from "@/components/cabinet/FicheClient";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <CabinetShell title="Fiche client" icon="" desc="Dossiers, factures et rendez-vous du client" perms={["cabinet_dossiers"]}>
      {(user) => estStaffUser(user)
        ? <FicheClient discordId={id} />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
