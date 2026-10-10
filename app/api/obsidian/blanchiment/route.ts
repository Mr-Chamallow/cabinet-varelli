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
    const propre = Math.round(montant * (1 - taux / 100));
    const membre = String(b.membre || "").trim();
    const by = (user as any)?.nom_perso || (user as any)?.discord_name || b.created_by || "";
    const sid = crypto.randomUUID();
    const base = { membre, semaine: weekStartOf(), created_by: by, source: "blanchiment", source_id: sid };
    const motif = `Blanchiment ${usd(montant)} à ${taux} % → ${usd(propre)} propres (frais ${usd(montant - propre)})${b.notes ? " — " + b.notes : ""}`;
    const { error: e } = await supabaseAdmin.from("obsidian_comptabilite").insert([
      { ...base, type: "dépense", categorie: "Blanchiment (argent sale sorti)", montant, type_argent: "sale", motif },
      { ...base, type: "recette", categorie: "Blanchiment (argent propre reçu)", montant: propre, type_argent: "propre", motif },
    ]);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    await postAlert("compta", `🧼 Blanchiment — ${usd(montant)}`, motif, GOLD);
    return NextResponse.json({ ok: true, propre, frais: montant - propre, source_id: sid });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
