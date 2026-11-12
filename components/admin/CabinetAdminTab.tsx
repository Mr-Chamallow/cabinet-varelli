"use client";
import { useState } from "react";
import CabinetCrud from "@/components/cabinet/CabinetCrud";
import CabinetPresentation from "@/components/cabinet/CabinetPresentation";

const ONGLETS: [string, string][] = [
  ["tarifs", "Prestations et prix"],
  ["organigramme", "Organigramme"],
  ["presentation", "Présentation"],
  ["avis", "Avis clients"],
  ["factures", "Facturation"],
  ["types", "Types de dossiers"],
  ["grades", "Grades et %"],
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
            { key: "prix_montant", label: "Montant facturé ($)", type: "number", placeholder: "Ex : 70000 (vide = prix du texte)" },
            { key: "commission_pct", label: "Commission avocat (%)", type: "number", placeholder: "Ex : 10" },
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
            { key: "slogan", label: "Slogan", placeholder: "Ex : La justice, sans compromis" },
            { key: "description", label: "Bio", type: "textarea" },
            { key: "photo_url", label: "Lien de la photo (image en ligne)", placeholder: "https://..." },
            { key: "specialites", label: "Spécialisations (séparées par des virgules)", placeholder: "Ex : Pénal, Civil" },
            { key: "telephone", label: "Téléphone", placeholder: "Ex : 9072671" },
            { key: "email", label: "Email", placeholder: "Ex : nom@cabinet.fr" },
            { key: "ordre", label: "Ordre d'affichage", type: "number" },
          ]}
        />
      )}

      {onglet === "presentation" && <CabinetPresentation canWrite={true} />}

      {onglet === "factures" && (
        <CabinetCrud
          table="cabinet_factures"
          libelle="facture"
          canWrite={true}
          titleKey="libelle"
          subKey="statut"
          fields={[
            { key: "client_discord_id", label: "ID Discord du client", placeholder: "Ex : 460865920278069248" },
            { key: "client_nom", label: "Nom du client", placeholder: "Ex : Jean Dupont" },
            { key: "libelle", label: "Libellé", placeholder: "Ex : Honoraires mariage" },
            { key: "montant", label: "Montant ($)", type: "number" },
            { key: "statut", label: "Statut : en_attente ou payee", placeholder: "en_attente" },
            { key: "date_echeance", label: "Échéance (AAAA-MM-JJ)", placeholder: "2026-12-01" },
          ]}
        />
      )}

      {onglet === "avis" && (
        <CabinetCrud
          table="cabinet_avis"
          libelle="avis"
          canWrite={true}
          titleKey="auteur_nom"
          subKey="statut"
          fields={[
            { key: "auteur_nom", label: "Auteur", placeholder: "Ex : Jean Dupont" },
            { key: "note", label: "Note (1 à 5)", type: "number" },
            { key: "contenu", label: "Avis", type: "textarea" },
            { key: "statut", label: "Statut : publie ou en_attente", placeholder: "publie" },
          ]}
        />
      )}

      {onglet === "grades" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
        </div>
      )}

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
