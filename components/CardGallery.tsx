"use client";
import { EmployeeCard, type CardEmploye } from "@/components/EmployeeCard";

// Aperçu de toutes les cartes (une par rôle / grade) avec des employés fictifs.
export const SAMPLE_CARDS: CardEmploye[] = [
  { id: "b2c3d4e5", nom: "Victor Hale", role: "CEO - Directeur général" },
  { id: "c3d4e5f6", nom: "Elena Moretti", role: "COO - Directrice opérationnel" },
  { id: "d4e5f6a7", nom: "Adrian Vance", role: "Responsable juridique" },
  { id: "e5f6a7b8", nom: "Lucas Bennett", role: "Agent juridique" },
  { id: "f6a7b8c9", nom: "Camille Roux", role: "Avocat" },
  { id: "07b8c9d0", nom: "Marcus Reed", role: "Responsable logistique" },
  { id: "18c9d0e1", nom: "Tony Rizzo", role: "Agent logistique" },
  { id: "29d0e1f2", nom: "Jack Sullivan", role: "Responsable sécurité" },
  { id: "3ae1f203", nom: "Dante Cole", role: "Agent de sécurité" },
  { id: "4bf20314", nom: "Sam Fletcher", role: "Opérateur" },
  { id: "5c031425", nom: "Leo Martin", role: "Opérateur stagiaire" },
  { id: "6d142536", nom: "Inspecteur Doe", role: "Légal Service" },
].map(c => ({ ...c, created_at: "2026-06-12T10:00:00Z", discord: "", actif: true }));

export function CardGallery() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1.4rem" }}>
      {SAMPLE_CARDS.map(c => <div key={c.id}><div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.4rem", textAlign: "center" }}>{c.role}</div><EmployeeCard e={c} /></div>)}
    </div>
  );
}
