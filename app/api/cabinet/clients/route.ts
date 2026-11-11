import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";

// Recherche d'un client (pour ouvrir un dossier) par pseudo, nom RP ou ID Discord
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const q = (new URL(req.url).searchParams.get("q") || "").replace(/[,()%*]/g, "").trim();
    if (q.length < 2) return NextResponse.json({ rows: [] });
    const { data, error } = await r.supabaseAdmin
      .from("avocat_clients")
      .select("discord_id,discord_name,nom_rp,id_perso")
      .or(`discord_name.ilike.%${q}%,nom_rp.ilike.%${q}%,discord_id.eq.${q}`)
      .limit(15);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
