"use client";
import { useState } from "react";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import CabinetPresentation from "@/components/cabinet/CabinetPresentation";

const ONGLETS: [string, string][] = [
  ["tarifs", "Prestations et prix"],
  ["organigramme", "Organigramme"],
  ["presentation", "Présentation"],
  ["types", "Types de dossiers"],
];

// Tout le contenu du cabinet se modifie ici, depuis l'admin
export function CabinetAdminTab() {
  const [onglet, setOnglet] = useState("tarifs");

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {ONGLETS.map(([k, l]) => (
          <button key={k} className={onglet === k ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm"} onClick={() => setOnglet(k)}>{l}</button>
        ))}
      </div>

      {onglet === "tarifs" && (
        <CabinetCrud
          table="cabinet_tarifs"
          libelle="tarif"
          canWrite={true}
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
      )}

      {onglet === "organigramme" && (
        <CabinetCrud
          table="cabinet_membres"
          libelle="membre"
          canWrite={true}
          titleKey="nom_rp"
          subKey="poste"
          fields={[
            { key: "nom_rp", label: "Nom RP", placeholder: "Ex : Marco Varelli" },
            { key: "poste", label: "Poste", placeholder: "Ex : Associé Gérant" },
            { key: "description", label: "Présentation courte", type: "textarea" },
            { key: "ordre", label: "Ordre d'affichage", type: "number" },
          ]}
        />
      )}

      {onglet === "presentation" && <CabinetPresentation canWrite={true} />}

      {onglet === "types" && (
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
      )}
    </div>
  );
}
