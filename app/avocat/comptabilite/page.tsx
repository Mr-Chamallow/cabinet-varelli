"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Comptabilite from "@/components/cabinet/Comptabilite";
import { hasPermission } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Comptabilité" icon="" desc="Factures, devis, dépenses, commissions et bilan" perms={["cabinet_compta"]}>
      {(user) => hasPermission(user, "cabinet_compta")
        ? <Comptabilite />
        : <div className="empty-state"><div className="empty-title">Réservé à la comptabilité</div></div>}
    </CabinetShell>
  );
}
