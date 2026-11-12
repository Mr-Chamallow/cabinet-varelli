"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import OrganigrammeEquipe from "@/components/cabinet/OrganigrammeEquipe";

export default function Page() {
  return (
    <CabinetShell title="Organigramme" icon="🏛️" desc="Notre équipe" perms={["avocat", "cabinet_organigramme"]}>
      {() => <OrganigrammeEquipe />}
    </CabinetShell>
  );
}
