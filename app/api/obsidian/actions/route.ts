import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { weekStartOf } from "@/lib/weekStart";
import { postAlert, logAudit, bigMoveAlert, usd, GREEN, RED, ORANGE, GREY } from "@/lib/alerts";

// Enregistre une action illégale ET écrit automatiquement le gain / la perte dans la comptabilité.
export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_actions");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const b = await req.json();
    const membre = String(b.membre || "").trim();
    const action = String(b.action || "").trim();
    const montant = Number(b.montant) || 0;
    if (!membre || !action) return NextResponse.json({ error: "membre et action requis" }, { status: 400 });
    const createdAt = b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString();

    const { data: row, error: e1 } = await supabaseAdmin.from("actions_illegales").insert([{
      membre, action, montant, notes: b.notes || null, created_by: b.created_by || null, created_at: createdAt,
    }]).select().single();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

    if (montant !== 0) {
      const { error: e2 } = await supabaseAdmin.from("obsidian_comptabilite").insert([{
        type: montant > 0 ? "recette" : "dépense",
        categorie: action,
        montant: Math.abs(montant),
        type_argent: "sale",
        motif: `${action} — ${membre}${b.notes ? ` — ${b.notes}` : ""}`,
        membre,
        semaine: weekStartOf(createdAt),
        created_by: b.created_by || "",
        created_at: createdAt,
        source: "action",
        source_id: row.id,
      }]);
      if (e2) {
        await supabaseAdmin.from("actions_illegales").delete().eq("id", row.id);
        return NextResponse.json({ error: `Compta : ${e2.message}` }, { status: 400 });
      }
    }
    await postAlert("actions", `🕶️ ${action}`, `**${membre}** · ${montant >= 0 ? "gain" : "perte"} **${usd(Math.abs(montant))}**${b.notes ? `\n${b.notes}` : ""}`, montant >= 0 ? GREEN : RED);
    await bigMoveAlert(supabaseAdmin, montant, `${action} — ${membre}`, b.created_by || membre);
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Supprime l'action ET sa ligne de compta liée.
export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_actions");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { data: old } = await supabaseAdmin.from("actions_illegales").select("*").eq("id", id).maybeSingle();
    await supabaseAdmin.from("obsidian_comptabilite").delete().eq("source", "action").eq("source_id", id);
    const { error: e } = await supabaseAdmin.from("actions_illegales").delete().eq("id", id);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    if (old) await logAudit(supabaseAdmin, (user as any)?.discord_name, "Action supprimée", `${old.action} — ${old.membre}`, `${Number(old.montant) || 0} $`);
    if (old) await postAlert("actions", `🗑️ Action supprimée — ${old.action}`, `**${old.membre}** · ${usd(Number(old.montant) || 0)}`, GREY);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Modifie une action ET sa ligne de compta liée.
export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_actions");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const b = await req.json();
    const id = b.id;
    const membre = String(b.membre || "").trim();
    const action = String(b.action || "").trim();
    const montant = Number(b.montant) || 0;
    if (!id || !membre || !action) return NextResponse.json({ error: "id, membre et action requis" }, { status: 400 });
    const createdAt = b.created_at ? new Date(b.created_at).toISOString() : new Date().toISOString();

    const { data: row, error: e1 } = await supabaseAdmin.from("actions_illegales")
      .update({ membre, action, montant, notes: b.notes || null, created_at: createdAt, delai_alerte: false }).eq("id", id).select().single();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

    await supabaseAdmin.from("obsidian_comptabilite").delete().eq("source", "action").eq("source_id", id);
    if (montant !== 0) {
      const { error: e2 } = await supabaseAdmin.from("obsidian_comptabilite").insert([{
        type: montant > 0 ? "recette" : "dépense", categorie: action, montant: Math.abs(montant), type_argent: "sale",
        motif: `${action} — ${membre}${b.notes ? ` — ${b.notes}` : ""}`, membre, semaine: weekStartOf(createdAt),
        created_by: row.created_by || b.created_by || "", created_at: createdAt, source: "action", source_id: id,
      }]);
      if (e2) return NextResponse.json({ error: `Compta : ${e2.message}` }, { status: 400 });
    }
    await postAlert("actions", `✏️ Action modifiée — ${action}`, `**${membre}** · ${montant >= 0 ? "gain" : "perte"} **${usd(Math.abs(montant))}**`, ORANGE);
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
