"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import TableauBord from "@/components/cabinet/TableauBord";
import { ROLES_BUREAU, estPatronUser } from "@/lib/cabinetRoles";

// Tableau de bord : patron (complet) et secrétaire juridique (lecture seule)
export default function Page() {
  return (
    <CabinetShell title="Tableau de bord" icon="" desc="Vue d'ensemble du cabinet" perms={["cabinet_attribution"]} roles={ROLES_BUREAU}>
      {(user) => <TableauBord lecture={!estPatronUser(user)} />}
    </CabinetShell>
  );
}
