"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ACCS } from "@/lib/priceRef";

export interface Fournisseur {
  id: string; categorie: "drogue" | "arme" | "accessoire"; produit: string; qui: string; groupe: string;
  telephone: string; prix_achat: number; prefere: boolean; actif: boolean; notes: string;
}

// Nom normalise pour rapprocher "Cocaine 90%" (Tableau des prix) et " Cocaïne 90%" (stock)
export const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

// Fournisseur de reference : le prefere s'il y en a un, sinon le moins cher (prix > 0)
export function refAchat(list: Fournisseur[]): Fournisseur | null {
  const l = list.filter(f => f.actif !== false && Number(f.prix_achat) > 0);
  if (!l.length) return null;
  const pref = l.find(f => f.prefere);
  if (pref) return pref;
  return [...l].sort((a, b) => Number(a.prix_achat) - Number(b.prix_achat))[0];
}
export const moinsCher = (list: Fournisseur[]) => {
  const l = list.filter(f => f.actif !== false && Number(f.prix_achat) > 0);
  return l.length ? [...l].sort((a, b) => Number(a.prix_achat) - Number(b.prix_achat))[0] : null;
};

// Prix de vente de reference = moyenne min-max (si min > max, on prend le max)
export function venteRef(min: number, max: number): number {
  const a = Number(min) || 0, b = Number(max) || 0;
  if (a && b) return a > b ? b : Math.round(((a + b) / 2) * 100) / 100;
  return a || b || 0;
}
export function marge(vente: number, achat: number) {
  const m = (vente || 0) - (achat || 0);
  return { val: m, pct: vente ? (m / vente) * 100 : 0 };
}

export function useFournisseurs() {
  const [list, setList] = useState<Fournisseur[]>([]);
  const reload = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from("obsidian_fournisseurs").select("*").eq("actif", true).order("prix_achat");
    setList((data || []).map((x: any) => ({ ...x, prix_achat: Number(x.prix_achat) || 0 })));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { list, reload };
}
export const fournisseursDe = (list: Fournisseur[], cat: string, produit: string) => list.filter(f => f.categorie === cat && norm(f.produit) === norm(produit));

export interface PriceRef { nom: string; categorie: "drogue" | "arme" | "accessoire"; emoji: string; vente: number; achat: number; fournisseur: Fournisseur | null }

// Tableau des prix complet : prix de vente de reference + prix d'achat de reference (par fournisseur)
export async function loadPriceTable(): Promise<PriceRef[]> {
  if (!supabase) return [];
  const [{ data: d }, { data: a }, { data: f }] = await Promise.all([
    supabase.from("obsidian_drogues").select("nom,emoji,prix_min,prix_max").order("ordre"),
    supabase.from("obsidian_armes_prix").select("nom,prix").order("ordre"),
    supabase.from("obsidian_fournisseurs").select("*").eq("actif", true),
  ]);
  const fl: Fournisseur[] = (f || []).map((x: any) => ({ ...x, prix_achat: Number(x.prix_achat) || 0 }));
  const mk = (categorie: PriceRef["categorie"], nom: string, emoji: string, vente: number): PriceRef => {
    const r = refAchat(fournisseursDe(fl, categorie, nom));
    return { nom: (nom || "").trim(), categorie, emoji, vente, achat: r ? r.prix_achat : 0, fournisseur: r };
  };
  return [
    ...(d || []).map((x: any) => mk("drogue", x.nom, x.emoji || "💊", venteRef(x.prix_min, x.prix_max))),
    ...(a || []).map((x: any) => mk("arme", x.nom, "🔫", Number(x.prix) || 0)),
    ...ACCS.map(x => mk("accessoire", x.nom, "🔧", x.prix)),
  ];
}
export function usePriceTable() {
  const [t, setT] = useState<PriceRef[]>([]);
  useEffect(() => { let off = false; loadPriceTable().then(r => { if (!off) setT(r); }); return () => { off = true; }; }, []);
  return t;
}
