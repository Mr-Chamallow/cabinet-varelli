"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// S'abonne aux changements Postgres (insert/update/delete) d'une ou plusieurs tables Supabase
// et relance `onChange` à chaque évènement - la page se resynchronise seule, sans F5.
// Nécessite que la réplication Realtime soit activée sur la table côté Supabase
// (voir sql-realtime.sql).
export function useRealtimeTable(tables: string | string[], onChange: () => void) {
  const list = Array.isArray(tables) ? tables : [tables];
  const key = list.join(",");
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!supabase) return;
    // Regroupe les rafales d'evenements (ex: seed, import) en un seul rechargement.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const fire = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => cbRef.current(), 350); };
    const channel = supabase.channel(`realtime-${key}-${Math.random().toString(36).slice(2)}`);
    list.forEach((table) => {
      channel.on("postgres_changes" as any, { event: "*", schema: "public", table }, fire);
    });
    channel.subscribe();
    return () => { if (timer) clearTimeout(timer); supabase!.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
