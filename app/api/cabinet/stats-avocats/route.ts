import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { CABINET_STAFF_ROLES } from "@/lib/cabinetAcces";
import { estDirection } from "@/lib/cabinetAcces";

// Statistiques par avocat (direction). Paramètre ?mois=YYYY-MM ou ?mois=all
export async function GET(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_direction"]);
    if (!r.authorized || !estDirection(r.user)) return NextResponse.json({ error: "Réservé à la direction" }, { status: 403 });
    const db = r.supabaseAdmin;
    const mois = new URL(req.url).searchParams.get("mois") || "all";
    const filtre = /^\d{4}-\d{2}$/.test(mois) ? mois : null;
    const debutMois = filtre ? `${filtre}-01` : null;
    const finMois = filtre ? (() => { const [a, m] = filtre.split("-").map(Number); const d = new Date(Date.UTC(a, m, 1)); return d.toISOString().slice(0, 10); })() : null;

    const [{ data: staff }, { data: acces }, { data: dossiers }, { data: rdv }, { data: comp }] = await Promise.all([
      db.from("site_logins").select("discord_id,nom_perso,discord_name,site_role").in("site_role", CABINET_STAFF_ROLES),
      db.from("cabinet_dossier_acces").select("dossier_id,avocat_discord_id"),
      db.from("cabinet_dossiers").select("id,statut,created_at"),
      db.from("cabinet_rdv").select("avocat_discord_id,statut,date_rdv"),
      db.from("cabinet_comparutions").select("avocat_discord_id,statut,montant,date_audience"),
    ]);

    const dossierPar = new Map((dossiers || []).map((d: any) => [d.id, d]));
    const dansMois = (s: string | null | undefined) => !filtre || (s && s >= debutMois! && s < finMois!);

    const lignes = (staff || []).map((s: any) => {
      const id = s.discord_id;
      const mesDossiers = (acces || []).filter((a: any) => a.avocat_discord_id === id)
        .map((a: any) => dossierPar.get(a.dossier_id)).filter((d: any) => d && dansMois(String(d.created_at).slice(0, 10)));
      const mesRdv = (rdv || []).filter((x: any) => x.avocat_discord_id === id && dansMois(String(x.date_rdv).slice(0, 10)));
      const mesComp = (comp || []).filter((c: any) => c.avocat_discord_id === id && c.statut === "prise_en_charge" && dansMois(c.date_audience));
      return {
        discord_id: id,
        nom: s.nom_perso || s.discord_name || "?",
        role: s.site_role,
        dossiers: mesDossiers.length,
        dossiersOuverts: mesDossiers.filter((d: any) => d.statut === "ouvert").length,
        rdvTermines: mesRdv.filter((x: any) => x.statut === "termine").length,
        rdvTotal: mesRdv.length,
        comparutions: mesComp.length,
        honorairesCI: mesComp.reduce((t: number, c: any) => t + (Number(c.montant) || 0), 0),
      };
    });
    lignes.sort((a, b) => b.honorairesCI - a.honorairesCI || b.dossiers - a.dossiers);
    return NextResponse.json({ mois: filtre || "all", rows: lignes });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
