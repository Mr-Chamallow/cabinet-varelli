import { supabase } from "@/lib/supabase";

export type ActivityType =
  | "mouvement"
  | "operation"
  | "contrat"
  | "fiche"
  | "employe"
  | "garage"
  | "paiement"
  | "comptabilite";

export interface ActivityItem {
  type: ActivityType;
  label: string;
  detail: string;
  by: string;
  at: string;
}

export const ACTIVITY_CONFIG: Record<ActivityType, { icon: string; color: string; label: string }> = {
  mouvement:    { icon: "📦", color: "#f97316", label: "Stock"        },
  operation:    { icon: "🗓️", color: "#3b82f6", label: "Opération"    },
  contrat:      { icon: "📜", color: "#a78bfa", label: "Contrat"      },
  fiche:        { icon: "🗂️", color: "#22c55e", label: "Fiche"        },
  employe:      { icon: "👤", color: "#06b6d4", label: "Employé"      },
  garage:       { icon: "🚗", color: "#64748b", label: "Garage"       },
  paiement:     { icon: "💵", color: "#eab308", label: "Paie"         },
  comptabilite: { icon: "🧾", color: "#ef4444", label: "Comptabilité" },
};

const fmt = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function timeAgo(iso: string): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  const d = Math.floor(diff / 86400);
  return d < 7 ? `Il y a ${d} j` : new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// Reconstruit un journal d'activité à partir des tables Obsidian réelles
// (aucune table de logs dédiée n'existe encore — on se base sur created_at/created_by
// de chaque table métier, ce qui couvre les créations ; pas encore les modifications/suppressions).
export async function fetchRecentActivity(limitPerSource = 40): Promise<ActivityItem[]> {
  if (!supabase) return [];

  const [
    { data: mouvements },
    { data: operations },
    { data: contrats },
    { data: fiches },
    { data: employes },
    { data: garage },
    { data: paiements },
    { data: compta },
  ] = await Promise.all([
    supabase.from("obsidian_mouvements").select("stock_nom,type,quantite,motif,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_rdv").select("titre,type,client,lieu,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_contrats").select("titre,type,statut,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_fiches").select("nom,organisation,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_employes").select("nom,role,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_garage").select("modele,plaque,statut,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_paiements").select("employe,montant,paid_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
    supabase.from("obsidian_comptabilite").select("type,categorie,montant,membre,created_by,created_at").order("created_at", { ascending: false }).limit(limitPerSource),
  ]);

  const items: ActivityItem[] = [
    ...(mouvements || []).map((r: any) => ({
      type: "mouvement" as const,
      label: r.stock_nom || "Stock",
      detail: `${r.type === "sortie" ? "Sortie" : "Entrée"} · ${r.quantite} · ${r.motif || "—"}`,
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(operations || []).map((r: any) => ({
      type: "operation" as const,
      label: r.titre || "Opération",
      detail: `${r.type || "—"}${r.lieu ? ` · ${r.lieu}` : ""}${r.client ? ` · ${r.client}` : ""}`,
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(contrats || []).map((r: any) => ({
      type: "contrat" as const,
      label: r.titre || "Contrat",
      detail: `${r.type || "—"} · ${r.statut || "—"}`,
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(fiches || []).map((r: any) => ({
      type: "fiche" as const,
      label: r.nom || "Fiche",
      detail: r.organisation ? `Organisation : ${r.organisation}` : "Nouvelle fiche",
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(employes || []).map((r: any) => ({
      type: "employe" as const,
      label: r.nom || "Employé",
      detail: r.role ? `Rôle : ${r.role}` : "Nouvel employé",
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(garage || []).map((r: any) => ({
      type: "garage" as const,
      label: r.modele || "Véhicule",
      detail: `${r.plaque || "—"} · ${r.statut || "—"}`,
      by: r.created_by || "—",
      at: r.created_at,
    })),
    ...(paiements || []).map((r: any) => ({
      type: "paiement" as const,
      label: r.employe || "Employé",
      detail: `Payé ${fmt(r.montant)}`,
      by: r.paid_by || "—",
      at: r.created_at,
    })),
    ...(compta || []).map((r: any) => ({
      type: "comptabilite" as const,
      label: r.categorie || (r.type === "recette" ? "Recette" : "Dépense"),
      detail: `${r.type === "recette" ? "+" : "-"}${fmt(r.montant)}`,
      by: r.created_by || r.membre || "—",
      at: r.created_at,
    })),
  ]
    .filter((i) => i.at)
    .sort((a, b) => (b.at || "").localeCompare(a.at || ""));

  return items;
}
