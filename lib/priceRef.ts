"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Référentiel des prix (Tableau des prix) : accessoires en dur, drogues & armes en base.
export const ACCS=[{nom:"Chargeurs Pistolets",prix:225000},{nom:"Chargeurs Auto",prix:500000},{nom:"Chargeurs Lourdes",prix:750000},{nom:"Silencieux Pistolets",prix:17500},{nom:"Silencieux Auto",prix:25000},{nom:"Silencieux Lourdes",prix:30000},{nom:"Viseurs Pistolets",prix:17500},{nom:"Viseurs Auto",prix:25000},{nom:"Viseurs Lourdes",prix:30000},{nom:"Poignées Lourdes",prix:30000},{nom:"Lampes Pistolets",prix:17500},{nom:"Lampes Lourdes",prix:30000},{nom:"Compensateurs Pistolets",prix:17500},{nom:"Freins Auto",prix:25000},{nom:"Freins Lourdes",prix:30000},{nom:"Canons Auto",prix:25000},{nom:"Canons Lourdes",prix:30000}];

export interface PriceItem { nom: string; emoji?: string; prix?: number }
export const PRICE_CATS = ["drogue", "arme", "accessoire"] as const;

// Liste des éléments du Tableau des prix pour une catégorie de stock (drogue / arme / accessoire).
export function usePriceItems(cat: string): PriceItem[] {
  const [items, setItems] = useState<PriceItem[]>([]);
  useEffect(() => {
    let off = false;
    if (cat === "accessoire") { setItems(ACCS.map(a => ({ nom: a.nom, emoji: "🔧", prix: a.prix }))); return; }
    if (!supabase || (cat !== "drogue" && cat !== "arme")) { setItems([]); return; }
    const q = cat === "drogue" ? supabase.from("obsidian_drogues").select("nom,emoji,prix_min,prix_max").order("ordre") : supabase.from("obsidian_armes_prix").select("nom,prix").order("ordre");
    q.then(({ data }) => { if (off) return; setItems((data || []).map((x: any) => cat === "drogue" ? { nom: x.nom, emoji: x.emoji || "💊", prix: Number(x.prix_max) || Number(x.prix_min) || 0 } : { nom: x.nom, emoji: "🔫", prix: Number(x.prix) || 0 })); });
    return () => { off = true; };
  }, [cat]);
  return items;
}
