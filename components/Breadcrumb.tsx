"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = { obsidian: "Obsidian", prix: "Tableau des prix", stocks: "Stocks", garage: "Garage", comptabilite: "Comptabilité", rdv: "Rendez-vous", calendrier: "Calendrier", contrats: "Contrats", "actions-illegales": "Actions illégales", arrestations: "Arrestations", stats: "Statistiques", fiches: "Fiches", "cahier-vente": "Cahier de vente", paie: "Paie & Commissions", employes: "Employés", juridique: "Code pénal", calculatrice: "Calculatrice", "utile-samp": "Utile SAMP", "carte-enqueteur": "San Andreas", "base-de-donnees": "Base de données", organigramme: "Organigramme", tribunal: "Tribunal de l'Ombre", pactes: "Pactes", audits: "Audits", evenements: "Convois & Enchères", reputation: "Réputation", consortium: "Stats Consortium", settings: "Personnalisation", supervision: "Supervision", admin: "Admin" };

// Fil d'Ariane : Accueil › Obsidian › Fiches (cliquable).
export function Breadcrumb() {
  const path = usePathname() || "/";
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return null;
  let acc = "";
  return (
    <nav className="crumbs" aria-label="Fil d'Ariane">
      <Link href="/">Accueil</Link>
      {parts.map((p, i) => { acc += "/" + p; const last = i === parts.length - 1; const label = LABELS[p] || decodeURIComponent(p);
        return <span key={acc}><b>›</b>{last || p === "obsidian" ? <span className={last ? "cur" : ""}>{label}</span> : <Link href={acc}>{label}</Link>}</span>; })}
    </nav>
  );
}
