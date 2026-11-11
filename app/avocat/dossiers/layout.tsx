"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import ListeDossiers from "@/components/cabinet/ListeDossiers";

// Mise en page commune : liste des dossiers à gauche, dossier ouvert (ou formulaire) à droite
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CabinetShell title="Dossiers" icon="📁" desc="Un salon privé par dossier" perms={["avocat", "cabinet_dossiers"]}>
      {() => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
          <aside style={{ flex: "1 1 240px", maxWidth: "320px", width: "100%" }}>
            <ListeDossiers />
          </aside>
          <section style={{ flex: "3 1 360px", minWidth: 0 }}>{children}</section>
        </div>
      )}
    </CabinetShell>
  );
}
