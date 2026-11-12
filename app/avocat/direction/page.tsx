"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import TableauBord from "@/components/cabinet/TableauBord";
import { hasPermission } from "@/lib/auth";

// Tableau de bord : lecture seule sauf pour qui a l'édition globale
export default function Page() {
  return (
    <CabinetShell title="Tableau de bord" icon="" desc="Vue d'ensemble du cabinet" perms={["cabinet_direction"]}>
      {(user) => <TableauBord lecture={!hasPermission(user, "edit_all")} />}
    </CabinetShell>
  );
}
