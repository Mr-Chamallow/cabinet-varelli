"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import Comparutions from "@/components/cabinet/Comparutions";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import { estBureauUser } from "@/lib/cabinetRoles";

// Comparutions immédiates : suivi séparé de la compta client, visible par tous les avocats.
// Les grades et pourcentages ne sont modifiables que par la comptabilité.
export default function Page() {
  return (
    <CabinetShell title="Comparutions immédiates" icon="⚖️" desc="Prises en charge payées par le gouvernement" perms={["avocat"]}>
      {(user) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Comparutions />
          {estBureauUser(user) && (
            <>
              <div className="cab-section-titre" style={{ fontSize: "0.95rem" }}>Grades et pourcentage par représentation</div>
              <CabinetCrud
                table="cabinet_grades"
                libelle="grade"
                canWrite={true}
                titleKey="grade"
                fields={[
                  { key: "grade", label: "Grade (nom exact)", placeholder: "Ex : Associé" },
                  { key: "taux_pct", label: "Pourcentage de la représentation (%)", type: "number" },
                  { key: "ordre", label: "Ordre", type: "number" },
                ]}
              />
              <CabinetCrud
                table="cabinet_avocat_grades"
                libelle="grade d'un avocat"
                canWrite={true}
                titleKey="avocat_nom"
                fields={[
                  { key: "avocat_discord_id", label: "Identifiant Discord de l'avocat", placeholder: "Ex : 123456789012345678" },
                  { key: "avocat_nom", label: "Nom affiché" },
                  { key: "grade", label: "Grade (identique à la liste ci-dessus)" },
                ]}
              />
            </>
          )}
        </div>
      )}
    </CabinetShell>
  );
}
