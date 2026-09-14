// Adapte l'import ci-dessous au chemin réel de ton client Supabase existant
// (celui déjà utilisé par Cabinet BullHead).
import { supabase } from '@/lib/supabase';
import type { CartePoint, Category, Dossier, Gang, Personne, Plaque, Preset } from './types';

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
  // On ne renvoie jamais dossier.id (vide pour un nouveau dossier, ce qui
  // ferait échouer l'upsert côté Postgres — bug qui empêchait la sauvegarde).
  // On upsert sur point_id (unique), qui identifie le dossier sans ambiguïté.
  const { id, ...payload } = dossier;
  const { data, error } = await supabase
    .from('carte_dossiers')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'point_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('carte_categories').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const { data, error } = await supabase.from('carte_categories').insert(category).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, patch: Partial<Category>): Promise<void> {
  const { error } = await supabase.from('carte_categories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('carte_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPersonnes(): Promise<Personne[]> {
  const { data, error } = await supabase.from('carte_personnes').select('*').order('nom', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPersonne(p: Omit<Personne, 'id' | 'created_at'>): Promise<Personne> {
  const { data, error } = await supabase.from('carte_personnes').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function updatePersonne(id: string, patch: Partial<Personne>): Promise<void> {
  const { error } = await supabase.from('carte_personnes').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePersonne(id: string): Promise<void> {
  const { error } = await supabase.from('carte_personnes').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPlaques(): Promise<Plaque[]> {
  const { data, error } = await supabase.from('carte_plaques').select('*').order('plaque', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPlaque(p: Omit<Plaque, 'id' | 'created_at'>): Promise<Plaque> {
  const { data, error } = await supabase.from('carte_plaques').insert(p).select().single();
  if (error) throw error;
  return data;
}

export async function updatePlaque(id: string, patch: Partial<Plaque>): Promise<void> {
  const { error } = await supabase.from('carte_plaques').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deletePlaque(id: string): Promise<void> {
  const { error } = await supabase.from('carte_plaques').delete().eq('id', id);
  if (error) throw error;
}

// Upload une image (fichier ou collée depuis le presse-papier) vers Supabase
// Storage et renvoie son URL publique.
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('carte-enqueteur').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('carte-enqueteur').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchGangs(): Promise<Gang[]> {
  const { data, error } = await supabase.from('carte_gangs').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGang(g: Omit<Gang, 'id'>): Promise<Gang> {
  const { data, error } = await supabase.from('carte_gangs').insert(g).select().single();
  if (error) throw error;
  return data;
}

export async function updateGang(id: string, patch: Partial<Gang>): Promise<void> {
  const { error } = await supabase.from('carte_gangs').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteGang(id: string): Promise<void> {
  const { error } = await supabase.from('carte_gangs').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchPresets(): Promise<Preset[]> {
  const { data, error } = await supabase.from('carte_presets').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
