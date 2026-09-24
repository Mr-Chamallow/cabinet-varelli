"use client";

import { useCurrentUser } from "@/lib/useCurrentUser";
import { setPreviewRole } from "@/lib/previewRole";

// Bandeau toujours visible pendant un aperçu par rôle — pour ne jamais oublier
// qu'on est en train de voir le site avec des permissions qui ne sont pas les
// siennes (et éviter toute confusion sur ce qu'on "peut" vraiment faire : les
// vraies actions restent vérifiées côté serveur avec le VRAI rôle, cet aperçu
// ne change que la navigation affichée).
export function PreviewBanner() {
  const { previewRole } = useCurrentUser();
  if (!previewRole) return null;

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
        padding: "0.5rem 1rem",
        background: "linear-gradient(90deg, rgba(164,143,255,0.18), rgba(121,134,203,0.18))",
        borderBottom: "1px solid rgba(var(--gold-rgb),0.35)",
        fontSize: "0.8rem", color: "var(--gold)", fontWeight: 600,
      }}
    >
      <span>👁️ Aperçu en tant que <strong>{previewRole}</strong> — la navigation reflète ce rôle, mais tes vraies actions restent celles de ton compte réel</span>
      <button
        onClick={() => setPreviewRole(null)}
        style={{
          background: "rgba(var(--gold-rgb),0.15)", border: "1px solid rgba(var(--gold-rgb),0.4)",
          color: "var(--gold)", borderRadius: 6, padding: "0.2rem 0.7rem", fontSize: "0.75rem",
          fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}
      >
        Quitter l'aperçu
      </button>
    </div>
  );
}
