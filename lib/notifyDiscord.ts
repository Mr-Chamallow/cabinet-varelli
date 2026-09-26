"use client";
// Prévient le webhook Discord du module concerné depuis le client, après une action réussie
// (création, modification, suppression). Fire-and-forget : ne bloque jamais l'UI, n'affiche
// jamais d'erreur si le webhook n'est pas configuré ou indisponible.
export function notifyDiscord(kind: "stocks" | "armurerie" | "rdv" | "contrats" | "fiches", content: string, title?: string) {
  fetch("/api/discord-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, content, title }),
  }).catch(() => {});
}
