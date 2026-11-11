"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import { hasWriteAccess } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Tarifs" icon="💰" desc="Grille des honoraires" perms={["avocat", "cabinet_tarifs"]}>
      {(user) => (
        <CabinetCrud
          table="cabinet_tarifs"
          libelle="tarif"
          canWrite={hasWriteAccess(user, "cabinet_tarifs")}
          groupKey="categorie"
          titleKey="nom"
          subKey="prix"
          fields={[
            { key: "categorie", label: "Catégorie", placeholder: "Ex : Droit de la famille" },
            { key: "nom", label: "Prestation", placeholder: "Ex : Divorce à l'amiable" },
            { key: "prix", label: "Prix", placeholder: "Ex : 5 000 $" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "ordre", label: "Ordre d'affichage", type: "number" },
          ]}
        />
      )}
    </CabinetShell>
  );
}
