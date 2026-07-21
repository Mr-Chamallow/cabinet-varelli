"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface Options {
  orderBy?: string;
  ascending?: boolean;
}

/**
 * Charge et gère une table Supabase scopée à l'utilisateur courant
 * (filtrée par created_by, l'ID passera à created_by_id en Phase 3b).
 *
 * Remplace le pattern dupliqué dans chaque page :
 *   useEffect(() => { load() }, [])
 *   async function load() { const { data } = await supabase.from(...).select("*").eq("created_by", user.nom)... }
 *
 * Usage :
 *   const { rows, loading, error, create, update, remove, reload } = useScopedTable<Dossier>("dossiers");
 */
export function useScopedTable<T extends { id: string }>(
  table: string,
  options: Options = {}
) {
  const { user, loading: userLoading } = useCurrentUser();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { orderBy = "created_at", ascending = false } = options;

  const load = useCallback(async () => {
    if (!supabase || !user) { setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from(table)
      .select("*")
      .eq("created_by", user.nom)
      .order(orderBy, { ascending });
    if (err) setError(err.message);
    else setRows((data as T[]) || []);
    setLoading(false);
  }, [table, user, orderBy, ascending]);

  useEffect(() => {
    if (!userLoading && user) load();
  }, [userLoading, user, load]);

  async function create(payload: Partial<T>) {
    if (!supabase || !user) return null;
    const { data, error: err } = await supabase
      .from(table)
      .insert([{ ...payload, created_by: user.nom, created_by_id: user.id }] as any)
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setRows(r => [data as T, ...r]);
    return data as T;
  }

  async function update(id: string, payload: Partial<T>) {
    if (!supabase) return null;
    const { data, error: err } = await supabase
      .from(table)
      .update(payload as any)
      .eq("id", id)
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setRows(r => r.map(x => (x.id === id ? (data as T) : x)));
    return data as T;
  }

  async function remove(id: string) {
    if (!supabase) return false;
    const { error: err } = await supabase.from(table).delete().eq("id", id);
    if (err) { setError(err.message); return false; }
    setRows(r => r.filter(x => x.id !== id));
    return true;
  }

  return { rows, loading: loading || userLoading, error, create, update, remove, reload: load, user };
}
