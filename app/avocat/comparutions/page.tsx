"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Comparutions from "@/components/cabinet/Comparutions";
import { estPatronUser } from "@/lib/cabinetRoles";

// Comparutions immédiates : visibles par tous les avocats. Seul le patron peut supprimer.
export default function Page() {
  return (
    <CabinetShell title="Comparutions immédiates" icon="⚖️" desc="Prises en charge payées par le gouvernement" perms={["avocat"]} staff>
      {(user) => <Comparutions patron={estPatronUser(user)} />}
    </CabinetShell>
  );
}
