"use client";

const KEY = "obsidian_preview_role";
export const PREVIEW_ROLE_EVENT = "obsidian-preview-role-change";

export function getPreviewRole(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setPreviewRole(role: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (role) sessionStorage.setItem(KEY, role);
    else sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage indisponible — pas bloquant, l'aperçu ne fonctionnera juste pas
  }
  window.dispatchEvent(new Event(PREVIEW_ROLE_EVENT));
}
