"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import VotesCabinet from "@/components/cabinet/VotesCabinet";
import { hasPermission } from "@/lib/auth";
import { estStaffUser } from "@/lib/cabinetRoles";

export default function Page() {
  return (
    <CabinetShell title="Votes internes" icon="" desc="Propositions de changement et votes du cabinet" perms={["cabinet_dossiers", "cabinet_rdv"]}>
      {(user) => estStaffUser(user)
        ? <VotesCabinet direction={hasPermission(user, "cabinet_attribution")} />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
