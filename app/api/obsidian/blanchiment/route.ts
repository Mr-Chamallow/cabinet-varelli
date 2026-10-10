import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { weekStartOf } from "@/lib/weekStart";
import { postAlert, usd, GOLD } from "@/lib/alerts";

// Blanchiment : X $ d'argent sale sortent, (X - frais) $ d'argent propre rentrent.
// Les deux écritures partagent le même source_id ; le hub les traite comme un TRANSFERT (pas comme recette/dépense)
// et ne compte que les frais (X - propre) comme dépense réelle.
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("cahier_vente");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const b = await req.json();
    const montant = Math.round(Number(b.montant) || 0);
    const taux = Math.min(100, Math.max(0, Number(b.taux) || 0));
    if (montant <= 0) return NextResponse.json({ error: "Montant > 0 requis" }, { status: 400 });
    // sens : "sale_propre" (sale → propre) ou "propre_sale" (propre → sale). groupe : groupe externe qui blanchit pour nous (optionnel).
    const sens = b.sens === "propre_sale" ? "propre_sale" : "sale_propre";
    const groupe = String(b.groupe || "").trim();
    const src = sens === "sale_propre" ? "sale" : "propre", dst = sens === "sale_propre" ? "propre" : "sale";
    const propre = Math.round(montant * (1 - taux / 100)); // montant reçu après frais
    const membre = String(b.membre || "").trim();
    const by = (user as any)?.nom_perso || (user as any)?.discord_name || b.created_by || "";
    const sid = crypto.randomUUID();
    const base = { membre, semaine: weekStartOf(), created_by: by, source: "blanchiment", source_id: sid };
    const motif = `Blanchiment ${groupe ? "via " + groupe + " " : ""}${usd(montant)} ${src}s à ${taux} % → ${usd(propre)} ${dst}s (frais ${usd(montant - propre)})${b.notes ? " — " + b.notes : ""}`;
    const { error: e } = await supabaseAdmin.from("obsidian_comptabilite").insert([
      { ...base, type: "dépense", categorie: `Blanchiment (argent ${src} sorti)`, montant, type_argent: src, motif },
      { ...base, type: "recette", categorie: `Blanchiment (argent ${dst} reçu)`, montant: propre, type_argent: dst, motif },
    ]);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    await postAlert("compta", `🧼 Blanchiment ${groupe ? "(" + groupe + ") " : ""}— ${usd(montant)}`, motif, GOLD);
    return NextResponse.json({ ok: true, propre, frais: montant - propre, source_id: sid });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
