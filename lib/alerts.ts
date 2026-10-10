import { sendDiscordMessage, editDiscordMessage, DiscordWebhookKind, DiscordEmbedField } from "@/lib/discordAlert";
import { mention, roleIds, RoleKey } from "@/lib/discordRoles";

export const usd = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const GREEN = 0x22c55e, RED = 0xef4444, GOLD = 0xd4af37, ORANGE = 0xeab308, BLUE = 0x64b5f6, GREY = 0x555566;

// Poste une alerte (embed) sans jamais faire échouer l'action métier.
// `ping` : rôles Discord à mentionner (ex: GROUPS.JURIDIQUE ou ["CEO","COO"]) ; `pingUsers` : ids Discord de membres.
// Règle anti-spam : on ne ping QUE pour les choses importantes (alerte rouge, violation, verdict, échec, stock bas, gros mouvement).
// Le reste est posté sans mention (le message reste visible dans le salon, sans notifier personne).
// Ping UNIQUEMENT : violation de pacte, verdict, pacte rompu, stock bas, convoi attaqué / échoué.
const URGENT = /violation|verdict|stock bas/i;
const URGENT_DESC = /rompu|échec|echec|attaq/i;
export const isUrgent = (title: string, _color?: number, desc = "") => URGENT.test(title) || URGENT_DESC.test(desc);

export async function postAlert(kind: DiscordWebhookKind, title: string, description: string, color = GOLD, fields?: DiscordEmbedField[], ping?: RoleKey[], pingUsers?: string[]) {
  try {
    const urgent = isUrgent(title, color, description);
    const roles = urgent ? ping : undefined;
    const parts = [roles?.length ? mention(roles) : "", ...(urgent ? (pingUsers || []).map(u => `<@${u}>`) : [])].filter(Boolean);
    await sendDiscordMessage(kind, { title, description, color, fields, content: parts.join(" ") || undefined, mentionRoles: roles?.length ? roleIds(roles) : [], mentionUsers: urgent ? (pingUsers || []) : [] });
  } catch {}
}

// Un seul message Discord par ligne (convoi, dossier, pacte, audit...) : créé une fois, puis MODIFIÉ à chaque changement.
// Le message modifié ne notifie personne ; un ping n'est envoyé (séparément) que pour les changements urgents.
export async function syncAlert(db: any, table: string, row: any, kind: DiscordWebhookKind, title: string, description: string, color = GOLD, fields?: DiscordEmbedField[], ping?: RoleKey[]) {
  try {
    if (row?.discord_message_id) {
      const r = await editDiscordMessage(kind, row.discord_message_id, { title, description, color, fields });
      if (r.ok) { if (ping?.length && isUrgent(title, color, description)) await postAlert(kind, `🔔 ${title}`, "Voir le message d'origine ci-dessus.", color, undefined, ping); return; }
    }
    const urgent = isUrgent(title, color, description);
    const r = await sendDiscordMessage(kind, { title, description, color, fields, content: urgent && ping?.length ? mention(ping) : undefined, mentionRoles: urgent && ping?.length ? roleIds(ping) : [] });
    if (r.messageId && row?.id) await db.from(table).update({ discord_message_id: r.messageId }).eq("id", row.id);
  } catch {}
}

// Seuil « gros mouvement » réglable dans Admin > Personnalisation (app_settings.alert_seuil_gros). 0 = désactivé.
export async function bigThreshold(db: any): Promise<number> {
  try {
    const { data } = await db.from("app_settings").select("valeur").eq("cle", "alert_seuil_gros").maybeSingle();
    if (data && data.valeur !== null && data.valeur !== "") return Math.max(0, Number(data.valeur) || 0);
  } catch {}
  return 100000;
}

// Si |montant| >= seuil -> alerte « gros mouvement » dans le salon compta.
export async function bigMoveAlert(db: any, montant: number, label: string, who: string) {
  const seuil = await bigThreshold(db);
  if (!seuil || Math.abs(montant) < seuil) return;
  await postAlert("compta", `${montant >= 0 ? "💰 Gros gain" : "📉 Grosse perte"} - ${usd(Math.abs(montant))}`, `${label}\nPar **${who || "?"}**`, montant >= 0 ? GREEN : RED, undefined, ["CEO", "COO"]);
}

// Journal des actions sensibles (Admin > Journaux > Sensibles). Ne throw jamais.
export async function logAudit(db: any, acteur: string, action: string, cible: string, detail?: string) {
  try { await db.from("journal_audit").insert([{ acteur: acteur || "?", action, cible: cible || "", detail: detail || null }]); } catch {}
}
