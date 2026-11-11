import { hasPermission, hasWriteAccess } from "@/lib/auth";

// Utilitaires serveur partagés par les routes /api/cabinet/*
export function appUser(user: any) {
  return { id: user?.discord_id || "", nom: user?.discord_name || "", role: user?.site_role || "", permissions: user?.permissions || [] } as any;
}

export function nomAffiche(user: any): string {
  return user?.nom_perso || user?.discord_name || "?";
}

export function canRead(user: any, perms: string[]): boolean {
  return perms.some(p => hasPermission(appUser(user), p));
}

export function canWrite(user: any, perm: string): boolean {
  return hasWriteAccess(appUser(user), perm);
}

// Notification Discord (webhook défini dans la variable CABINET_WEBHOOK_URL)
export async function notifyDiscord(texte: string) {
  const url = process.env.CABINET_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: texte.slice(0, 1900) }),
    });
  } catch {
    // une notification ratée ne doit jamais bloquer l'action
  }
}
