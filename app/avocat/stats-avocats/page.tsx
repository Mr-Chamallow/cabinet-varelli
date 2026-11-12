"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import StatsAvocats from "@/components/cabinet/StatsAvocats";
import { hasPermission } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Statistiques par avocat" icon="" desc="Dossiers, RDV et honoraires de chaque avocat" perms={["cabinet_direction"]}>
      {(user) => hasPermission(user, "cabinet_direction") ? <StatsAvocats /> : <div className="empty-state"><div className="empty-title">Réservé à la direction</div></div>}
    </CabinetShell>
  );
}
