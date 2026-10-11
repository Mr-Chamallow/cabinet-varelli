"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface GroupeRef { id: string; nom: string; type?: string }
// Groupes de la base (Base de donnees -> Groupes = table carte_gangs)
export function useGroupes() {
  const [groupes, setGroupes] = useState<GroupeRef[]>([]);
  useEffect(() => {
    let off = false;
    if (!supabase) return;
    supabase.from("carte_gangs").select("id,nom,type").order("nom").then(({ data }) => { if (!off) setGroupes((data || []) as GroupeRef[]); });
    return () => { off = true; };
  }, []);
  return groupes;
}
const nz = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
export const groupeExact = (list: GroupeRef[], v: string) => list.find(g => nz(g.nom) === nz(v)) || null;
