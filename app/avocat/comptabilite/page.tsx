"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import { ROLES_BUREAU, estBureauUser } from "@/lib/cabinetRoles";
import Comptabilite from "@/components/cabinet/Comptabilite";
import { hasPermission } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Comptabilité" icon="" desc="Factures, devis, dépenses, commissions et bilan" perms={["cabinet_compta"]} roles={ROLES_BUREAU}>
      {(user) => estBureauUser(user)
        ? <Comptabilite />
        : <div className="empty-state"><div className="empty-title">Réservé à la comptabilité</div></div>}
    </CabinetShell>
  );
}
