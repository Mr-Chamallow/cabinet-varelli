"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetRdv from "@/components/cabinet/CabinetRdv";
import { hasPermission, hasWriteAccess } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Prise de RDV" icon="" desc="Calendrier et demandes de rendez-vous" perms={["cabinet_rdv"]} staff>
      {(user) => (
        <CabinetRdv
          employe={hasWriteAccess(user, "cabinet_rdv")}
          direction={hasPermission(user, "cabinet_attribution")}
          moiId={user.discord_id || ""}
        />
      )}
    </CabinetShell>
  );
}
