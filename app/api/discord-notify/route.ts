import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { sendDiscordAlert, DiscordWebhookKind } from "@/lib/discordAlert";

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
    const { kind, content, title } = await req.json();
    if (!kind || !PERM_MAP[kind as DiscordWebhookKind]) {
      return NextResponse.json({ error: "kind invalide" }, { status: 400 });
    }
    if (!content) return NextResponse.json({ error: "content requis" }, { status: 400 });

    const { authorized, error } = await requireAnyPermission(PERM_MAP[kind as DiscordWebhookKind]);
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const result = await sendDiscordAlert(kind as DiscordWebhookKind, content, { title });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
