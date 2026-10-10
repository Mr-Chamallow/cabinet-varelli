import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { postAlert, logAudit, bigMoveAlert, usd, GREEN, RED } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_comptabilite");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_comptabilite").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    const m = Number(data.montant) || 0;
    const signed = data.type === "recette" ? m : -m;
    await postAlert("compta", `${data.type === "recette" ? "↑ Recette" : "↓ Dépense"} — ${usd(m)}`, `${data.motif || data.categorie}`, signed >= 0 ? GREEN : RED, [
      { name: "Catégorie", value: data.categorie || "—", inline: true },
      { name: "Argent", value: data.type_argent || "—", inline: true },
      { name: "Saisi par", value: data.created_by || "—", inline: true },
    ]);
    await bigMoveAlert(supabaseAdmin, signed, `${data.categorie} — ${data.motif || ""}`, data.created_by || "");
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_comptabilite");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id } = await req.json();
    const { data: gone } = await supabaseAdmin.from("obsidian_comptabilite").select("type,montant,motif,categorie").eq("id", id).maybeSingle();
    const { error: dbError } = await supabaseAdmin.from("obsidian_comptabilite").delete().eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    if (gone) await logAudit(supabaseAdmin, ((user as any)?.nom_perso || (user as any)?.discord_name), "Opération compta supprimée", gone.motif || gone.categorie, `${gone.type} ${gone.montant} $`);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
