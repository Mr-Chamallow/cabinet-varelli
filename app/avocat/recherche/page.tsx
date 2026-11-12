"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Recherche from "@/components/cabinet/Recherche";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  return (
    <CabinetShell title="Recherche" icon="" desc="Clients, dossiers et factures" perms={["cabinet_dossiers"]}>
      {(user) => estStaffUser(user)
        ? <Recherche />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
