import { NextResponse } from "next/server";
import { requirePermission, supabaseAdmin } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const { authorized } = await requirePermission("obsidian_paie");
  if (!authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("obsidian_paiements").insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}