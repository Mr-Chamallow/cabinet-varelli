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

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedInput {
  title: string;
  description?: string;
  fields?: DiscordEmbedField[];
  color?: number;
}

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

function buildEmbed(opts: DiscordEmbedInput) {
  return {
    title: opts.title,
    description: opts.description || undefined,
    color: opts.color ?? 0xa48fff,
    fields: opts.fields && opts.fields.length ? opts.fields : undefined,
    timestamp: new Date().toISOString(),
  };
}

// Poste un nouveau message riche (embed complet) et récupère son ID Discord
// (?wait=true), pour pouvoir l'éditer plus tard quand la fiche/contrat/rdv change.
export async function sendDiscordMessage(kind: DiscordWebhookKind, opts: DiscordEmbedInput): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const url = process.env[ENV_KEYS[kind]];
    if (!url) return { ok: false, error: `Webhook "${kind}" non configuré (variable ${ENV_KEYS[kind]} manquante sur Vercel)` };

    const res = await fetch(`${url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [buildEmbed(opts)] }),
    });
    if (!res.ok) return { ok: false, error: `Discord a répondu ${res.status}` };
    const data = await res.json().catch(() => null);
    return { ok: true, messageId: data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// Édite un message existant (le même message Discord est mis à jour au lieu d'en
// reposter un nouveau, à chaque modification de la fiche/contrat/rdv d'origine).
export async function editDiscordMessage(kind: DiscordWebhookKind, messageId: string, opts: DiscordEmbedInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = process.env[ENV_KEYS[kind]];
    if (!url) return { ok: false, error: `Webhook "${kind}" non configuré (variable ${ENV_KEYS[kind]} manquante sur Vercel)` };

    const res = await fetch(`${url}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [buildEmbed(opts)] }),
    });
    if (!res.ok) return { ok: false, error: `Discord a répondu ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
