"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Comptabilite from "@/components/cabinet/Comptabilite";

// Comptabilité : chaque onglet (dépenses, commissions, bilan) s'affiche selon ses permissions
export default function Page() {
  return (
    <CabinetShell title="Comptabilité" icon="" desc="Dépenses, commissions et bilan" perms={["cabinet_depenses", "cabinet_commissions", "cabinet_bilan"]}>
      {(user) => <Comptabilite user={user} />}
    </CabinetShell>
  );
}
