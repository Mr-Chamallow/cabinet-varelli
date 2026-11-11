import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { estStaff } from "@/lib/cabinetAcces";

// Fiche client côté employés : identité, dossiers, factures, rendez-vous
export async function GET(_req: Request, ctx: { params: Promise<{ discordId: string }> }) {
  try {
    const { discordId } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const [client, dossiers, factures, rdv] = await Promise.all([
      db.from("avocat_clients").select("discord_id,discord_name,nom_rp,tel_rp,id_perso,created_at").eq("discord_id", discordId).maybeSingle(),
      db.from("cabinet_dossiers").select("id,titre,statut,client_nom,created_at").eq("client_discord_id", discordId).order("created_at", { ascending: false }),
      db.from("cabinet_factures").select("id,numero,montant,statut,date_echeance,created_at").eq("client_discord_id", discordId).order("created_at", { ascending: false }),
      db.from("cabinet_rdv").select("id,date_rdv,motif,statut").eq("discord_id", discordId).order("date_rdv", { ascending: false }),
    ]);
    if (!client.data) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    return NextResponse.json({ client: client.data, dossiers: dossiers.data || [], factures: factures.data || [], rdv: rdv.data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
