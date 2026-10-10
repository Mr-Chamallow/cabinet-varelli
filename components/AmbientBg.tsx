"use client";
import { ObsLogo } from "@/components/ObsLogo";

// Fond d'ambiance du site : grille discrète, halos dorés qui dérivent, logo en filigrane.
export function AmbientBg() {
  return (
    <div className="ambient" aria-hidden="true">
      <i className="amb-orb a" /><i className="amb-orb b" /><i className="amb-orb c" />
      <div className="amb-grid" />
      <ObsLogo size={560} className="amb-logo" />
      <div className="amb-vignette" />
    </div>
  );
}
