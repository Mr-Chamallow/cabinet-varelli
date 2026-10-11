import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { hasPermission } from "@/lib/auth";

// Photo de preuve d'un don (bucket prive) : visible par l'auteur du don et par la paie, via un lien temporaire.
export async function GET(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_dons");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { data: d } = await supabaseAdmin.from("obsidian_dons").select("preuve_url,created_by_id").eq("id", id).maybeSingle();
    if (!d?.preuve_url) return NextResponse.json({ error: "Pas de preuve" }, { status: 404 });
    const u: any = user;
    const isPaie = hasPermission({ id: u.discord_id, nom: u.discord_name, role: u.site_role, permissions: u.permissions } as any, "obsidian_paie");
    if (!isPaie && String(d.created_by_id || "") !== String(u.discord_id || "")) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    // anciens dons : URL publique complete -> on garde le chemin apres le nom du bucket
    const path = String(d.preuve_url).includes("/dons-preuves/") ? String(d.preuve_url).split("/dons-preuves/").pop()! : String(d.preuve_url);
    const { data: signed, error: e } = await supabaseAdmin.storage.from("dons-preuves").createSignedUrl(decodeURIComponent(path.split("?")[0]), 120);
    if (e || !signed?.signedUrl) return NextResponse.json({ error: e?.message || "Lien impossible" }, { status: 404 });
    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
