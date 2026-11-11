"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Écoute un canal temps réel et relance surMessage à chaque message reçu
export function useTempsReel(topic: string | null | undefined, surMessage: () => void) {
  const ref = useRef(surMessage);
  ref.current = surMessage;
  useEffect(() => {
    if (!topic || !supabase) return;
    const canal = supabase.channel(topic).on("broadcast", { event: "message" }, () => ref.current()).subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [topic]);
}
