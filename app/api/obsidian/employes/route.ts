import type { UserLike } from "@/lib/types";
import type { Row } from "@/lib/types";
import { NextResponse } from "next/server";
import { requirePermission, requirePatron } from "@/lib/serverAuth";
import { estAdminUser } from "@/lib/auth";
import { logAudit, postAlert, GREEN } from "@/lib/alerts";

// Promouvoir = permission admin en écriture (table roles), aucun nom de rôle en dur.
const isPromoter = (u: UserLike) => estAdminUser(u);

// [table, colonne du nom] - toutes pointent vers l'employé par employe_id (rempli automatiquement en base).
const TABLES_NOM: [string, string][] = [["actions_illegales", "membre"], ["arrestations", "membre"], ["obsidian_comptabilite", "membre"], ["obsidian_mouvements", "membre"], ["obsidian_paiements", "employe"], ["cahier_transactions", "created_by"]];

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_employes");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_employes").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: `Erreur serveur : ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePermission("obsidian_employes");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id, ...patch } = await req.json();
    const { data: old } = await supabaseAdmin.from("obsidian_employes").select("nom,discord_id,role").eq("id", id).maybeSingle();
    const promoted = !!old && patch.role !== undefined && String(patch.role || "") !== String(old.role || "");
    if (promoted && !isPromoter(user)) return NextResponse.json({ error: "Seuls le CEO et le COO peuvent changer le rôle / promouvoir" }, { status: 403 });
    const renamed = !!old && patch.nom !== undefined && String(patch.nom).trim() !== old.nom;
    if (renamed) {
      const p = await requirePatron();
      if (!p.authorized) return NextResponse.json({ error: "Seul le Patron peut renommer un employé" }, { status: 403 });
      patch.nom = String(patch.nom).trim();
    } else { delete patch.nom; }
    const { error: dbError } = await supabaseAdmin.from("obsidian_employes").update(patch).eq("id", id);
    if (!dbError && renamed) {
      await logAudit(supabaseAdmin, ((user as Row)?.nom_perso || (user as Row)?.discord_name), "Employé renommé", old!.nom, `-> ${patch.nom}`);
      for (const [t, c] of TABLES_NOM) {
        await supabaseAdmin.from(t).update({ [c]: patch.nom }).eq("employe_id", id);
        await supabaseAdmin.from(t).update({ [c]: patch.nom }).eq(c, old!.nom); // lignes anciennes sans employe_id
      }
      // Le nom du personnage devient aussi le nom affiché partout (Discord -> Prénom Nom).
      if (old!.discord_id) await supabaseAdmin.from("site_logins").update({ nom_perso: patch.nom }).eq("discord_id", old!.discord_id);
    }
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    if (promoted && old) {
      const who = (user as Row)?.nom_perso || (user as Row)?.discord_name;
      await logAudit(supabaseAdmin, who, "Promotion / changement de rôle", old.nom, `${old.role || "-"} -> ${patch.role}`);
      await postAlert("compta", `⬆️ Promotion - ${old.nom}`, `${old.role || "-"} -> **${patch.role}**\nPar **${who || "?"}**`, GREEN);
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: `Erreur serveur : ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error, user } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Seul le Patron peut supprimer un employé" }, { status: 403 });

    const { id } = await req.json();
    const { data: emp } = await supabaseAdmin.from("obsidian_employes").select("nom,discord_id").eq("id", id).maybeSingle();
    const { error: dbError } = await supabaseAdmin.from("obsidian_employes").delete().eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    await logAudit(supabaseAdmin, ((user as Row)?.nom_perso || (user as Row)?.discord_name), "Employé supprimé", emp?.nom || String(id));
    // Ne pas le recréer automatiquement à la prochaine synchro.
    if (emp?.discord_id) await supabaseAdmin.from("site_logins").update({ employe_exclu: true }).eq("discord_id", emp.discord_id);
    else if (emp?.nom) await supabaseAdmin.from("site_logins").update({ employe_exclu: true }).ilike("discord_name", emp.nom);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: `Erreur serveur : ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
  }
}
