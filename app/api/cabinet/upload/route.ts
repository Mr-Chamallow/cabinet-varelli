import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";

// Upload dans la messagerie : images (8 Mo max) ou documents PDF, Word, Excel, texte (15 Mo max)
const DOCUMENTS = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "csv", "odt"];

export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat", "cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const ext = (file.name.split(".").pop() || "").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5);
    const estImage = file.type.startsWith("image/");
    const estDocument = DOCUMENTS.includes(ext);
    if (!estImage && !estDocument) return NextResponse.json({ error: "Format non accepté (images, PDF, Word, Excel, texte)" }, { status: 400 });
    const limite = estImage ? 8 : 15;
    if (file.size > limite * 1024 * 1024) return NextResponse.json({ error: `Fichier trop lourd (${limite} Mo max)` }, { status: 400 });

    const nom = (file.name || "fichier").slice(0, 120);
    const path = `dossiers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "bin"}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await r.supabaseAdmin.storage.from("cabinet").upload(path, buf, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data } = r.supabaseAdmin.storage.from("cabinet").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, nom, image: estImage });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
