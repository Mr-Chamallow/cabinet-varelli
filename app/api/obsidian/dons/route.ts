import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { postAlert, GREEN, RED, GOLD } from "@/lib/alerts";
import { weekStartOf } from "@/lib/weekStart";
import { money } from "@/lib/money";

// POST : un employé enregistre un don (propre ou sale) avec photo de preuve facultative.
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_dons");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const form = await req.formData();
    const montant = Math.round((Number(form.get("montant")) || 0) * 100) / 100;
    const type_argent = String(form.get("type_argent") || "");
    const motif = String(form.get("motif") || "").slice(0, 300);
    const semaine = String(form.get("semaine") || "") || weekStartOf();
    if (!(montant > 0)) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    if (!["propre", "sale"].includes(type_argent)) return NextResponse.json({ error: "Choisis argent propre ou sale" }, { status: 400 });
    const employe = String((user as any)?.nom_perso || (user as any)?.discord_name || "").trim();
    if (!employe) return NextResponse.json({ error: "Employé introuvable" }, { status: 400 });

    let preuve_url: string | null = null;
    const file = form.get("preuve");
    if (file && typeof file !== "string" && (file as File).size > 0) {
      const f = file as File;
      if (!f.type.startsWith("image/")) return NextResponse.json({ error: "La preuve doit être une image" }, { status: 400 });
      if (f.size > 6 * 1024 * 1024) return NextResponse.json({ error: "Image trop lourde (6 Mo max)" }, { status: 400 });
      const ext = (f.type.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabaseAdmin.storage.from("dons-preuves").upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
      if (upErr) return NextResponse.json({ error: `Photo non envoyée : ${upErr.message}` }, { status: 400 });
      preuve_url = supabaseAdmin.storage.from("dons-preuves").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: dbError } = await supabaseAdmin.from("obsidian_dons").insert([{
      employe, montant, type_argent, motif, semaine, preuve_url,
      created_by: employe, created_by_id: String((user as any)?.discord_id || ""),
    }]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await postAlert("compta", `🎁 Don à valider - ${money(montant)}`, `${employe} propose un don en argent ${type_argent}${motif ? `\n${motif}` : ""}`, GOLD);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// PATCH : la paie valide ou refuse un don ({ id, ok }).
export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_paie");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id, ok } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const par = String((user as any)?.nom_perso || (user as any)?.discord_name || "");
    const { data, error: dbError } = await supabaseAdmin.rpc("obsidian_don_valider", { p_id: id, p_par: par, p_ok: !!ok });
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    const d: any = data;
    await postAlert("compta", `${ok ? "✅ Don validé" : "❌ Don refusé"} - ${money(d.montant)}`, `${d.employe} · argent ${d.type_argent}\nPar ${par}`, ok ? GREEN : RED);
    return NextResponse.json(d);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
