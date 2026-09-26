import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { sendDiscordMessage, editDiscordMessage, DiscordWebhookKind, DiscordEmbedField } from "@/lib/discordAlert";

// Un utilisateur doit avoir la permission du module concerné pour déclencher son webhook.
const PERM_MAP: Record<DiscordWebhookKind, string[]> = {
  stocks: ["obsidian_stocks", "obsidian_armurerie"],
  armurerie: ["obsidian_armurerie"],
  rdv: ["obsidian_rdv"],
  contrats: ["obsidian_contrats"],
  fiches: ["obsidian_stats"],
};

export async function POST(req: Request) {
  try {
    const { kind, action, messageId, title, description, fields, color } = await req.json() as {
      kind: DiscordWebhookKind; action?: "create" | "update" | "delete";
      messageId?: string; title: string; description?: string; fields?: DiscordEmbedField[]; color?: number;
    };
    if (!kind || !PERM_MAP[kind]) return NextResponse.json({ error: "kind invalide" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "title requis" }, { status: 400 });

    const { authorized, error } = await requireAnyPermission(PERM_MAP[kind]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    // Mise à jour d'un message existant (la fiche/contrat/rdv a été modifié·e).
    if (action === "update" && messageId) {
      const result = await editDiscordMessage(kind, messageId, { title, description, fields, color });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true, messageId });
    }

    // Suppression : on n'efface pas le message Discord, on l'édite pour marquer que
    // l'entrée d'origine a été supprimée (garde l'historique visible dans le salon).
    if (action === "delete" && messageId) {
      const result = await editDiscordMessage(kind, messageId, {
        title: `~~${title}~~`,
        description: `${description ? description + "\n\n" : ""}❌ **Supprimé**`,
        fields, color: 0x555566,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    // Création (par défaut, et aussi utilisé en repli si un update arrive sans messageId,
    // par exemple si l'ID n'a jamais été sauvegardé en base pour une raison quelconque).
    const result = await sendDiscordMessage(kind, { title, description, fields, color });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
