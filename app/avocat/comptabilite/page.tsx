"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Comptabilite from "@/components/cabinet/Comptabilite";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  return (
    <CabinetShell title="Comptabilité" icon="" desc="Factures liées aux dossiers, PDF et suivi des paiements" perms={["cabinet_dossiers"]}>
      {(user) => estStaffUser(user)
        ? <Comptabilite />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
