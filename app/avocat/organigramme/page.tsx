"use client";
import CabinetShell from "@/components/cabinet/CabinetShell";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import { hasWriteAccess } from "@/lib/auth";

export default function Page() {
  return (
    <CabinetShell title="Organigramme" icon="🏛️" desc="Notre équipe" perms={["avocat", "cabinet_organigramme"]}>
      {(user) => (
        <CabinetCrud
          table="cabinet_membres"
          libelle="membre"
          canWrite={false}
          titleKey="nom_rp"
          subKey="poste"
          fields={[
            { key: "nom_rp", label: "Nom RP", placeholder: "Ex : Marco Varelli" },
            { key: "poste", label: "Poste", placeholder: "Ex : Associé fondateur" },
            { key: "description", label: "Présentation courte", type: "textarea" },
            { key: "ordre", label: "Ordre d'affichage", type: "number" },
          ]}
        />
      )}
    </CabinetShell>
  );
}
