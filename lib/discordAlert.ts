// Envoie une alerte vers le webhook Discord du module concerné.
// Chaque module a son propre webhook, configuré via variable d'environnement Vercel
// (jamais en base : ces URLs sont secrètes, la table app_settings est lisible publiquement).
export type DiscordWebhookKind = "stocks" | "armurerie" | "rdv" | "contrats" | "fiches";

const ENV_KEYS: Record<DiscordWebhookKind, string> = {
  stocks: "DISCORD_WEBHOOK_STOCKS",
  armurerie: "DISCORD_WEBHOOK_ARMURERIE",
  rdv: "DISCORD_WEBHOOK_RDV",
  contrats: "DISCORD_WEBHOOK_CONTRATS",
  fiches: "DISCORD_WEBHOOK_FICHES",
};

// Catégories obsidian_stocks considérées comme "armurerie" (voir app/obsidian/armurerie/page.tsx).
export const ARMURERIE_CATEGORIES = ["arme", "munition", "accessoire", "explosif", "gilet", "radio"];

// Ne throw jamais : une alerte Discord qui échoue ne doit jamais casser l'action métier en cours.
export async function sendDiscordAlert(kind: DiscordWebhookKind, content: string, opts?: { title?: string; color?: number }) {
  try {
    const url = process.env[ENV_KEYS[kind]];
    if (!url) return { ok: false, error: `Webhook "${kind}" non configuré (variable ${ENV_KEYS[kind]} manquante sur Vercel)` };

    const payload = opts?.title
      ? { embeds: [{ title: opts.title, description: content, color: opts.color ?? 0xa48fff, timestamp: new Date().toISOString() }] }
      : { content };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Discord a répondu ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
