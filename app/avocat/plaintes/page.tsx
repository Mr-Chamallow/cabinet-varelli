"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import PlaintesCabinet from "@/components/cabinet/PlaintesCabinet";
import { hasPermission } from "@/lib/auth";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  return (
    <CabinetShell title="Plaintes internes" icon="" desc="Confidentiel : direction et auteur uniquement" perms={["cabinet_dossiers", "cabinet_rdv"]}>
      {(user) => estStaffUser(user)
        ? <PlaintesCabinet direction={hasPermission(user, "cabinet_attribution")} moiId={user.discord_id || ""} />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
