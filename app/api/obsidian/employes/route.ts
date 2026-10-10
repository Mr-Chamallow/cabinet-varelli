import { NextResponse } from "next/server";
import { requirePermission, requirePatron } from "@/lib/serverAuth";

const TABLES_NOM = ["actions_illegales", "arrestations", "obsidian_comptabilite", "obsidian_mouvements"];

export async function POST(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_employes");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const body = await req.json();
    const { data, error: dbError } = await supabaseAdmin.from("obsidian_employes").insert([body]).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePermission("obsidian_employes");
    if (!authorized) return NextResponse.json({ error: error || "Non autorisé" }, { status: 403 });

    const { id, ...patch } = await req.json();
    const { data: old } = await supabaseAdmin.from("obsidian_employes").select("nom").eq("id", id).maybeSingle();
    const renamed = !!old && patch.nom !== undefined && String(patch.nom).trim() !== old.nom;
    if (renamed) {
      const p = await requirePatron();
      if (!p.authorized) return NextResponse.json({ error: "Seul le Patron peut renommer un employé" }, { status: 403 });
      patch.nom = String(patch.nom).trim();
    } else { delete patch.nom; }
    const { error: dbError } = await supabaseAdmin.from("obsidian_employes").update(patch).eq("id", id);
    if (!dbError && renamed) {
      for (const t of TABLES_NOM) await supabaseAdmin.from(t).update({ membre: patch.nom }).eq("membre", old!.nom);
      await supabaseAdmin.from("obsidian_paiements").update({ employe: patch.nom }).eq("employe", old!.nom);
    }
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin, error } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Seul le Patron peut supprimer un employé" }, { status: 403 });

    const { id } = await req.json();
    const { data: emp } = await supabaseAdmin.from("obsidian_employes").select("nom,discord_id").eq("id", id).maybeSingle();
    const { error: dbError } = await supabaseAdmin.from("obsidian_employes").delete().eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    // Ne pas le recréer automatiquement à la prochaine synchro.
    if (emp?.discord_id) await supabaseAdmin.from("site_logins").update({ employe_exclu: true }).eq("discord_id", emp.discord_id);
    else if (emp?.nom) await supabaseAdmin.from("site_logins").update({ employe_exclu: true }).ilike("discord_name", emp.nom);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
