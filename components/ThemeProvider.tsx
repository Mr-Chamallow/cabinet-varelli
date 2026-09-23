"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { applyCachedThemeIfAny, applyThemeToDocument, DEFAULT_GOLD } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1) applique immédiatement la dernière couleur connue (cache local) → pas de flash
    applyCachedThemeIfAny();

    // 2) va chercher la couleur officielle en base et la ré-applique si différente
    (async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("valeur")
          .eq("cle", "couleur_gold")
          .maybeSingle();
        applyThemeToDocument(data?.valeur || DEFAULT_GOLD);
      } catch {
        // Supabase indisponible — on reste sur le cache local (ou le défaut du CSS)
      }
    })();
  }, []);

  return <>{children}</>;
}
