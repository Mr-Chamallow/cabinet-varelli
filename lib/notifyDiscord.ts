"use client";
// Notifie le webhook Discord du module concerné, en gardant un seul message par
// fiche/contrat/rdv : on le CRÉE une fois (l'ID renvoyé doit être sauvegardé sur la ligne,
// colonne discord_message_id), puis on l'ÉDITE à chaque modification au lieu d'en reposter un.
export type NotifyKind = "stocks" | "armurerie" | "rdv" | "contrats" | "fiches";
export interface NotifyField { name: string; value: string; inline?: boolean }
export interface NotifyEmbed { title: string; description?: string; fields?: NotifyField[]; color?: number }

async function call(body: any): Promise<{ ok: boolean; messageId?: string }> {
  try {
    const res = await fetch("/api/discord-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, messageId: data?.messageId };
  } catch {
    return { ok: false };
  }
}

// Crée le message Discord initial. Retourne son ID (à sauvegarder en base) ou null en cas d'échec.
export async function notifyDiscordCreate(kind: NotifyKind, embed: NotifyEmbed): Promise<string | null> {
  const r = await call({ kind, action: "create", ...embed });
  return r.messageId || null;
}

// Édite le message existant. Si l'ID est absent (jamais sauvegardé), poste un nouveau message
// à la place — fire-and-forget, ne bloque jamais l'UI.
export function notifyDiscordUpdate(kind: NotifyKind, messageId: string | null | undefined, embed: NotifyEmbed) {
  call({ kind, action: messageId ? "update" : "create", messageId, ...embed });
}

// Marque le message existant comme supprimé (titre barré + bandeau), sans le supprimer.
export function notifyDiscordDelete(kind: NotifyKind, messageId: string | null | undefined, embed: NotifyEmbed) {
  if (!messageId) return;
  call({ kind, action: "delete", messageId, ...embed });
}
