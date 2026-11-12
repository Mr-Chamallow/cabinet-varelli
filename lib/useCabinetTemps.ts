"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Temps réel du cabinet, sans exposer les données : la base écrit une ligne dans "cabinet_signal"
// (nom de la table modifiée + heure) à chaque changement. Le navigateur reçoit ce signal
// et recharge les données par l'API, qui vérifie les droits de la personne.
// Sans connexion Supabase, la page se rafraîchit toutes les 30 secondes.
export function useCabinetTemps(tables: string[], onChange: () => void) {
  const cbRef = useRef(onChange);
  const key = tables.join(",");
  useEffect(() => { cbRef.current = onChange; });

  useEffect(() => {
    const liste = key.split(",");
    if (!supabase) {
      const t = setInterval(() => cbRef.current(), 30000);
      return () => clearInterval(t);
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase.channel(`cabinet-${key}-${Math.random().toString(36).slice(2)}`);
    channel.on("postgres_changes" as any, { event: "*", schema: "public", table: "cabinet_signal" }, (p: any) => {
      const table = p?.new?.table_name ?? p?.old?.table_name;
      if (!liste.includes(table)) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), 300);
    });
    channel.subscribe();
    return () => { if (timer) clearTimeout(timer); supabase!.removeChannel(channel); };
  }, [key]);
}
