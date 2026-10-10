// Envoie une alerte vers le webhook Discord du module concerné.
// Chaque module a son propre webhook, configuré via variable d'environnement Vercel
// (jamais en base : ces URLs sont secrètes, la table app_settings est lisible publiquement).
export type DiscordWebhookKind = "stocks" | "armurerie" | "rdv" | "contrats" | "fiches" | "base_donnees" | "arrestations" | "actions" | "compta" | "delais" | "membres" | "admin" | "rapport" | "gm";

const ENV_KEYS: Record<DiscordWebhookKind, string> = {
  stocks: "DISCORD_WEBHOOK_STOCKS",
  armurerie: "DISCORD_WEBHOOK_ARMURERIE",
  rdv: "DISCORD_WEBHOOK_RDV",
  contrats: "DISCORD_WEBHOOK_CONTRATS",
  fiches: "DISCORD_WEBHOOK_FICHES",
  base_donnees: "DISCORD_WEBHOOK_BASE_DONNEES",
  arrestations: "DISCORD_WEBHOOK_ARRESTATIONS",
  actions: "DISCORD_WEBHOOK_ACTIONS",
  compta: "DISCORD_WEBHOOK_COMPTA",
  delais: "DISCORD_WEBHOOK_DELAIS",
  membres: "DISCORD_WEBHOOK_MEMBRES",
  admin: "DISCORD_WEBHOOK_ADMIN",
  rapport: "DISCORD_WEBHOOK_RAPPORT",
  gm: "DISCORD_WEBHOOK_GM", // repli : DISCORD_WEBHOOK_ADMIN si absent
};

// Catégories obsidian_stocks considérées comme "armurerie" (voir app/obsidian/armurerie/page.tsx).
export const ARMURERIE_CATEGORIES = ["arme", "munition", "accessoire", "explosif", "gilet", "radio"];

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedInput {
  content?: string;      // texte hors embed (mentions @rôle / @membre)
  mentionRoles?: string[]; // ids de rôles autorisés à être notifiés
  mentionUsers?: string[]; // ids d'utilisateurs autorisés à être notifiés
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
    const url = process.env[ENV_KEYS[kind]] || (kind === "gm" ? process.env.DISCORD_WEBHOOK_ADMIN : undefined);
    if (!url) return { ok: false, error: `Webhook "${kind}" non configuré (variable ${ENV_KEYS[kind]} manquante sur Vercel)` };

    const res = await fetch(`${url}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: opts.content || undefined,
        allowed_mentions: { parse: [], roles: opts.mentionRoles || [], users: opts.mentionUsers || [] },
        embeds: [buildEmbed(opts)],
      }),
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

// Alerte sécurité/connexions (ex: connexion refusée). Webhook dédié via la variable
// Vercel DISCORD_WEBHOOK_CONNEXIONS. Ne throw jamais.
export async function sendSecurityAlert(title: string, description: string, color = 0xef4444) {
  try {
    const url = process.env.DISCORD_WEBHOOK_CONNEXIONS;
    if (!url) return { ok: false, error: "DISCORD_WEBHOOK_CONNEXIONS non configurée" };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [{ title, description, color, timestamp: new Date().toISOString() }] }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Discord a répondu ${res.status}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
