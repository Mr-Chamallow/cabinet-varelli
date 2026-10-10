import { sendDiscordMessage, DiscordWebhookKind, DiscordEmbedField } from "@/lib/discordAlert";
import { mention, roleIds, RoleKey } from "@/lib/discordRoles";

export const usd = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const GREEN = 0x22c55e, RED = 0xef4444, GOLD = 0xd4af37, ORANGE = 0xeab308, BLUE = 0x64b5f6, GREY = 0x555566;

// Poste une alerte (embed) sans jamais faire échouer l'action métier.
// `ping` : rôles Discord à mentionner (ex: GROUPS.JURIDIQUE ou ["CEO","COO"]) ; `pingUsers` : ids Discord de membres.
export async function postAlert(kind: DiscordWebhookKind, title: string, description: string, color = GOLD, fields?: DiscordEmbedField[], ping?: RoleKey[], pingUsers?: string[]) {
  try {
    const parts = [ping?.length ? mention(ping) : "", ...(pingUsers || []).map(u => `<@${u}>`)].filter(Boolean);
    await sendDiscordMessage(kind, { title, description, color, fields, content: parts.join(" ") || undefined, mentionRoles: ping?.length ? roleIds(ping) : [], mentionUsers: pingUsers || [] });
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

// Si |montant| >= seuil → alerte « gros mouvement » dans le salon compta.
export async function bigMoveAlert(db: any, montant: number, label: string, who: string) {
  const seuil = await bigThreshold(db);
  if (!seuil || Math.abs(montant) < seuil) return;
  await postAlert("compta", `${montant >= 0 ? "💰 Gros gain" : "📉 Grosse perte"} — ${usd(Math.abs(montant))}`, `${label}\nPar **${who || "?"}**`, montant >= 0 ? GREEN : RED, undefined, ["CEO", "COO"]);
}

// Journal des actions sensibles (Admin > Journaux > Sensibles). Ne throw jamais.
export async function logAudit(db: any, acteur: string, action: string, cible: string, detail?: string) {
  try { await db.from("journal_audit").insert([{ acteur: acteur || "?", action, cible: cible || "", detail: detail || null }]); } catch {}
}
