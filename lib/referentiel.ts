"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Référentiel unique véhicules / lieux : agrège Base de données, Garage, Carte enquêteur et RDV
// pour proposer les mêmes valeurs partout (saisie libre toujours possible).
export interface RefVehicule { modele: string; plaque: string; couleur?: string; source: string }
export interface Referentiel { vehicules: RefVehicule[]; modeles: string[]; plaques: string[]; lieux: string[] }

const uniq = (a: (string | null | undefined)[]) => [...new Set(a.map(x => (x || "").trim()).filter(Boolean))].sort((x, y) => x.localeCompare(y));

export function useReferentiel(): Referentiel {
  const [r, setR] = useState<Referentiel>({ vehicules: [], modeles: [], plaques: [], lieux: [] });
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    Promise.all([
      db.from("bdd_vehicules").select("plaque,marque_modele,couleur").limit(2000),
      db.from("obsidian_garage").select("plaque,modele,couleur,position").limit(1000),
      db.from("carte_plaques").select("plaque").limit(2000),
      db.from("carte_points").select("title").limit(2000),
      db.from("obsidian_rdv").select("lieu").limit(2000),
    ]).then(([b, g, cp, pt, rd]) => {
      const vehicules: RefVehicule[] = [
        ...(b.data || []).map((v: any) => ({ modele: v.marque_modele || "", plaque: v.plaque || "", couleur: v.couleur, source: "Base de données" })),
        ...(g.data || []).map((v: any) => ({ modele: v.modele || "", plaque: v.plaque || "", couleur: v.couleur, source: "Garage" })),
        ...(cp.data || []).map((v: any) => ({ modele: "", plaque: v.plaque || "", source: "Carte" })),
      ].filter(v => v.plaque || v.modele);
      setR({
        vehicules, modeles: uniq(vehicules.map(v => v.modele)), plaques: uniq(vehicules.map(v => v.plaque)),
        lieux: uniq([...(g.data || []).map((x: any) => x.position), ...(pt.data || []).map((x: any) => x.title), ...(rd.data || []).map((x: any) => x.lieu)]),
      });
    });
  }, []);
  return r;
}
