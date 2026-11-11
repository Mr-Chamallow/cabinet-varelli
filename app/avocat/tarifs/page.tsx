"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import { hasWriteAccess } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Tarifs" icon="" desc="Grille des honoraires" perms={["avocat", "cabinet_tarifs"]}>
      {(user) => (
        <>
          <div style={{ fontSize: "0.78rem", fontStyle: "italic", color: "var(--text-dim)", marginBottom: "1rem" }}>
            Ces prix sont à titre indicatif et sont amenés à changer en fonction d'éléments extérieurs au cabinet.
          </div>
          <CabinetCrud
            table="cabinet_tarifs"
            libelle="tarif"
            canWrite={hasWriteAccess(user, "cabinet_tarifs")}
            groupKey="categorie"
            titleKey="nom"
            subKey="prix"
            fields={[
              { key: "categorie", label: "Catégorie", placeholder: "Ex : Civil" },
              { key: "nom", label: "Prestation", placeholder: "Ex : Mariage" },
              { key: "prix", label: "Prix", placeholder: "Ex : 70 000 $ ou Sur devis" },
              { key: "description", label: "Description", type: "textarea" },
              { key: "ordre", label: "Ordre d'affichage", type: "number" },
            ]}
          />
        </>
      )}
    </CabinetShell>
  );
}
