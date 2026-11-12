import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { CABINET_STAFF_ROLES } from "@/lib/cabinetAcces";
import { gradeParRole } from "@/lib/grades";

// Liste des avocats et employés du cabinet (pour attribuer un dossier, choisir un avocat, bureaux)
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv", "cabinet_compta", "cabinet_facturation", "cabinet_depenses", "cabinet_commissions", "cabinet_bilan"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin
      .from("site_logins")
      .select("discord_id,discord_name,nom_perso,site_role")
      .in("site_role", CABINET_STAFF_ROLES);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const rows: any[] = (data || []).map((u: any) => ({
      discord_id: u.discord_id,
      nom: u.nom_perso || u.discord_name || "?",
      role: u.site_role,
    }));
    // L'utilisateur connecté apparaît toujours, même si son rôle n'est pas encore à jour dans l'annuaire
    const moi: any = r.user;
    if (moi?.discord_id && !rows.some(x => x.discord_id === moi.discord_id)) {
      rows.push({ discord_id: moi.discord_id, nom: moi.nom_perso || moi.discord_name || "?", role: moi.site_role || "" });
    }
    // Taux de chaque employé : grade (rôle, ou grade choisi dans Administration) puis barème
    const [{ data: grades }, { data: ovr }] = await Promise.all([
      r.supabaseAdmin.from("cabinet_grades").select("grade,taux_pct"),
      r.supabaseAdmin.from("cabinet_avocat_grades").select("avocat_discord_id,grade"),
    ]);
    const tauxParGrade: Record<string, number> = Object.fromEntries((grades || []).map((g: any) => [g.grade, Number(g.taux_pct) || 0]));
    const gradeChoisi: Record<string, string> = Object.fromEntries((ovr || []).map((g: any) => [g.avocat_discord_id, g.grade]));
    for (const x of rows) {
      const grade = gradeChoisi[x.discord_id] || gradeParRole(x.role) || null;
      x.grade = grade;
      x.taux = grade ? (tauxParGrade[grade] ?? 0) : 0;
    }
    rows.sort((a: any, b: any) => a.nom.localeCompare(b.nom));
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
