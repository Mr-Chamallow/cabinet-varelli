import { NextResponse } from "next/server";

// Lien d'invitation Discord (variable Vercel DISCORD_INVITE), exposé à la page /login.
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ url: process.env.DISCORD_INVITE || "" });
}
