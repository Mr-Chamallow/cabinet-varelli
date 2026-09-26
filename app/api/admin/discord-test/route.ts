import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { sendDiscordAlert, DiscordWebhookKind } from "@/lib/discordAlert";

export async function POST(req: Request) {
  const { authorized, error } = await requirePermission("admin");
  if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

  const { kind } = await req.json();
  const kinds: DiscordWebhookKind[] = ["stocks", "armurerie", "rdv", "contrats", "fiches"];
  if (!kinds.includes(kind)) return NextResponse.json({ error: "kind invalide" }, { status: 400 });

  const result = await sendDiscordAlert(kind, `Test du webhook **${kind}** depuis Obsidian Logistique. Si tu vois ce message, c'est branché ✅`, {
    title: "🔔 Test webhook",
    color: 0xa48fff,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
