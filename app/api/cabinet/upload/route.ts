import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";

// Upload d'une image (coller ou choisir un fichier) dans la messagerie des dossiers
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Seules les images sont acceptées" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Image trop lourde (8 Mo max)" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "png").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png";
    const path = `dossiers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await r.supabaseAdmin.storage.from("cabinet").upload(path, buf, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data } = r.supabaseAdmin.storage.from("cabinet").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
