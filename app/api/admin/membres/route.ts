import { NextResponse } from "next/server";
import { requirePatron } from "@/lib/serverAuth";
import { postAlert, ORANGE, RED } from "@/lib/alerts";
import { syncEmployes } from "@/lib/syncEmployes";

// Renommer / virer un membre du site — Patron uniquement.
const TABLES_NOM = ["actions_illegales", "arrestations", "obsidian_comptabilite", "obsidian_mouvements"];

export async function PATCH(req: Request) {
  try {
    const { authorized, supabaseAdmin: db, error, user } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Réservé au Patron" }, { status: 403 });
    const { discord_id, nom, renommer_employe } = await req.json();
    const nouveau = String(nom || "").trim();
    if (!discord_id || !nouveau) return NextResponse.json({ error: "discord_id et nom requis" }, { status: 400 });
    const { data: old } = await db.from("site_logins").select("discord_name,nom_perso").eq("discord_id", discord_id).single();
    if (!old) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    const { error: e } = await db.from("site_logins").update({ nom_perso: nouveau }).eq("discord_id", discord_id);
    if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    if (renommer_employe) {
      const { data: emp } = await db.from("obsidian_employes").select("id,nom").eq("discord_id", discord_id).maybeSingle();
      if (emp && emp.nom !== nouveau) {
        await db.from("obsidian_employes").update({ nom: nouveau }).eq("id", emp.id);
        for (const t of TABLES_NOM) await db.from(t).update({ membre: nouveau }).eq("membre", emp.nom);
        await db.from("obsidian_paiements").update({ employe: nouveau }).eq("employe", emp.nom);
      }
    }
    await postAlert("membres", "✏️ Membre renommé", `**${old.nom_perso || old.discord_name}** → **${nouveau}**\nPar : ${(user as any)?.discord_name || "?"}`, ORANGE);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

// « Virer » = bannir du site + retirer de la liste des membres (le Patron peut débannir ensuite).
export async function DELETE(req: Request) {
  try {
    const { authorized, supabaseAdmin: db, error, user } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Réservé au Patron" }, { status: 403 });
    const { discord_id } = await req.json();
    if (!discord_id) return NextResponse.json({ error: "discord_id requis" }, { status: 400 });
    if (discord_id === (user as any)?.discord_id || discord_id === process.env.ADMIN_DISCORD_ID) return NextResponse.json({ error: "Impossible de te virer toi-même" }, { status: 400 });
    const { data: l } = await db.from("site_logins").select("discord_name,nom_perso").eq("discord_id", discord_id).maybeSingle();
    const nom = l?.nom_perso || l?.discord_name || "";
    await db.from("site_bans").upsert({ discord_id, nom, motif: "Viré par le Patron", banned_by: (user as any)?.discord_name || "", banned_at: new Date().toISOString() });
    await db.from("site_logins").delete().eq("discord_id", discord_id);
    await postAlert("admin", "🚪 Membre viré", `**${nom || discord_id}** (\`${discord_id}\`)\nPar : ${(user as any)?.discord_name || "?"}`, RED);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

// Synchronise les employés depuis les membres du site.
export async function POST() {
  try {
    const { authorized, supabaseAdmin: db, error } = await requirePatron();
    if (!authorized) return NextResponse.json({ error: error || "Réservé au Patron" }, { status: 403 });
    return NextResponse.json({ ok: true, ...(await syncEmployes(db)) });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
