// Adapte l'import ci-dessous au chemin réel de ton client Supabase existant
// (celui déjà utilisé par Cabinet BullHead).
import { supabase } from '@/lib/supabase';
import type { CartePoint, Dossier } from './types';

export async function fetchPoints(): Promise<CartePoint[]> {
  const { data, error } = await supabase.from('carte_points').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchDossiers(): Promise<Dossier[]> {
  const { data, error } = await supabase.from('carte_dossiers').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function createPoint(point: Omit<CartePoint, 'id' | 'created_at'>): Promise<CartePoint> {
  const { data, error } = await supabase.from('carte_points').insert(point).select().single();
  if (error) throw error;
  return data;
}

export async function updatePoint(id: string, patch: Partial<CartePoint>): Promise<void> {
  const { error } = await supabase.from('carte_points').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePoint(id: string): Promise<void> {
  // La suppression du dossier lié est gérée par ON DELETE CASCADE côté SQL
  const { error } = await supabase.from('carte_points').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertDossier(dossier: Dossier): Promise<Dossier> {
  const { data, error } = await supabase
    .from('carte_dossiers')
    .upsert({ ...dossier, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
