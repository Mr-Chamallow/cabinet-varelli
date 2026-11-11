// Envoi de messages privés Discord via le bot du site (variable DISCORD_BOT_TOKEN).
// Le bot ne peut écrire qu'aux membres qui partagent un serveur avec lui. Échec silencieux : jamais bloquant.
const API = "https://discord.com/api/v10";

export async function envoyerDm(discordId: string, texte: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !discordId) return;
  const entete = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };
  try {
    const canal = await fetch(`${API}/users/@me/channels`, {
      method: "POST", headers: entete, body: JSON.stringify({ recipient_id: discordId }),
    }).then(r => (r.ok ? r.json() : null));
    if (!canal?.id) return;
    await fetch(`${API}/channels/${canal.id}/messages`, {
      method: "POST", headers: entete, body: JSON.stringify({ content: texte.slice(0, 1900) }),
    });
  } catch {
    // une notification ratée ne doit jamais bloquer l'action
  }
}

// Lien absolu vers le site (NEXTAUTH_URL), sinon chemin relatif
export function lienSite(chemin: string) {
  const base = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  return base + chemin;
}
