"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import TableauBord from "@/components/cabinet/TableauBord";

export default function Page() {
  return (
    <CabinetShell title="Tableau de bord" icon="" desc="Vue d'ensemble du cabinet, réservée à la direction" perms={["cabinet_attribution"]}>
      {() => <TableauBord />}
    </CabinetShell>
  );
}
