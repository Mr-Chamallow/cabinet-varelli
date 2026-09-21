import { NextResponse } from "next/server";
import { requirePermission, supabaseAdmin } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const { authorized } = await requirePermission("obsidian_comptabilite");
  if (!authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("obsidian_comptabilite").insert([body]).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { authorized } = await requirePermission("obsidian_comptabilite");
  if (!authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await req.json();
  const { error } = await supabaseAdmin.from("obsidian_comptabilite").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}