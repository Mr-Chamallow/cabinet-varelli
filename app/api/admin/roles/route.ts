import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("roles").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id, ...patch } = await req.json();
    const { error: dbError } = await supabaseAdmin.from("roles").update(patch).eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("admin");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id } = await req.json();
    const { error: dbError } = await supabaseAdmin.from("roles").delete().eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
