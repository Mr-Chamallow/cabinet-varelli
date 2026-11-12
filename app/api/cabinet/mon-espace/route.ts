import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";

// Espace client : dossiers en cours, factures et prochains rendez-vous du client connecté uniquement
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const moi = user.discord_id;

    const { data: masques } = await db.from("cabinet_dossier_masques").select("dossier_id").eq("discord_id", moi);
    const caches = (masques || []).map((m: any) => m.dossier_id);
    const { data: coRows } = await db.from("cabinet_dossier_clients").select("dossier_id").eq("client_discord_id", moi);
    const coIds = (coRows || []).map((x: any) => x.dossier_id);
    let dq = db.from("cabinet_dossiers").select("id,titre,statut,prestation,created_at")
      .or(coIds.length ? `client_discord_id.eq.${moi},id.in.(${coIds.join(",")})` : `client_discord_id.eq.${moi}`).neq("statut", "archive").order("created_at", { ascending: false }).limit(30);
    if (caches.length) dq = dq.not("id", "in", `(${caches.join(",")})`);

    const [{ data: dossiers }, { data: factures }, { data: rdv }] = await Promise.all([
      dq,
      db.from("cabinet_factures").select("id,libelle,montant,statut,date_echeance,created_at")
        .eq("client_discord_id", moi).order("created_at", { ascending: false }).limit(50),
      db.from("cabinet_rdv").select("id,date_rdv,motif,prestation,statut,avocat_nom")
        .eq("discord_id", moi).in("statut", ["demande", "attribue", "confirme"])
        .gte("date_rdv", new Date().toISOString()).order("date_rdv", { ascending: true }).limit(10),
    ]);

    return NextResponse.json({ dossiers: dossiers || [], factures: factures || [], rdv: rdv || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
