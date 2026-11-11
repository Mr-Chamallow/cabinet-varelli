"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetDossiers from "@/components/cabinet/CabinetDossiers";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import { hasWriteAccess, hasPermission } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Nouveau dossier" icon="📁" desc="Ouvrir une demande et échanger en privé" perms={["avocat", "cabinet_dossiers"]}>
      {(user) => {
        const staff = hasPermission(user, "cabinet_dossiers");
        const peutGerer = hasWriteAccess(user, "cabinet_dossiers");
        return (
          <>
            <CabinetDossiers staff={staff} />
            {peutGerer && (
              <div style={{ marginTop: "2.5rem" }}>
                <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", marginBottom: "0.8rem" }}>Types de dossiers & modèles</div>
                <CabinetCrud
                  table="cabinet_dossier_types"
                  libelle="type de dossier"
                  canWrite={true}
                  titleKey="nom"
                  fields={[
                    { key: "nom", label: "Nom du type", placeholder: "Ex : Changement de nom" },
                    { key: "description", label: "Description (affichée au client)", type: "textarea" },
                    { key: "template", label: "Modèle (premier message du dossier)", type: "textarea" },
                    { key: "ordre", label: "Ordre d'affichage", type: "number" },
                  ]}
                />
              </div>
            )}
          </>
        );
      }}
    </CabinetShell>
  );
}
