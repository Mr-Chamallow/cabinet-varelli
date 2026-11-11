"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";

// Passerelle Dossiers : ouvrir un dossier. Les salons (en cours et archivés) sont dans la sidebar.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CabinetShell title="Dossiers" icon="📁" desc="Ouvrir un dossier, chaque dossier devient un salon privé" perms={["avocat", "cabinet_dossiers"]}>
      {() => <div>{children}</div>}
    </CabinetShell>
  );
}
