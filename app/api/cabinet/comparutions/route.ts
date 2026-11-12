import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { gradeParRole } from "@/lib/grades";
import { estPatronUser, estStaffUser } from "@/lib/cabinetRoles";

// Taux de l'avocat : grade enregistré, sinon grade déduit de son rôle (et enregistré pour la suite)
async function tauxAvocat(db: any, discordId: string, nom: string, roles: (string | null | undefined)[]) {
  const { data: g } = await db.from("cabinet_avocat_grades").select("grade").eq("avocat_discord_id", discordId).maybeSingle();
  let grade = g?.grade as string | null | undefined;
  if (!grade) {
    grade = roles.map(gradeParRole).find(Boolean) || null;
    if (grade && discordId) await db.from("cabinet_avocat_grades").insert([{ avocat_discord_id: discordId, avocat_nom: nom, grade }]);
  }
  const { data: t } = grade ? await db.from("cabinet_grades").select("taux_pct").eq("grade", grade).maybeSingle() : { data: null };
  return Number(t?.taux_pct) || 0;
}

const STATUTS = ["prise_en_charge", "en_attente", "refusee"];

// Liste : tous les avocats voient toutes les comparutions immédiates.
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized || !estStaffUser(r.user)) return NextResponse.json({ error: "Réservé au personnel du cabinet" }, { status: 403 });
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_comparutions").select("*").order("date_audience", { ascending: false }).order("heure", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Création : la comparution est attribuée à l'avocat qui la saisit et apparaît dans le calendrier du cabinet.
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized || !estStaffUser(r.user)) return NextResponse.json({ error: "Réservé au personnel du cabinet" }, { status: 403 });
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date_audience || "")) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    if (!String(b.client_nom || "").trim()) return NextResponse.json({ error: "Client obligatoire" }, { status: 400 });
    const statut = STATUTS.includes(b.statut) ? b.statut : "en_attente";
    const heure = String(b.heure || "09:00");
    const avocatNom = nomAffiche(r.user);
    const avocatId = (r.user as any).discord_id;

    // Pourcentage selon le grade de l'avocat (figé au moment de la saisie)
    const taux = await tauxAvocat(db, avocatId, avocatNom, [(r.user as any).role, (r.user as any).site_role]);
    const montantCI = Math.max(0, Math.round(Number(b.montant) || 0));
    const partAvocat = Math.round((montantCI * taux) / 100);

    const { data: rdv, error: errRdv } = await db.from("cabinet_rdv").insert([{
      client_nom: String(b.client_nom).trim(),
      motif: `Comparution immédiate${b.tribunal ? " · " + b.tribunal : ""}${b.chefs ? " · " + b.chefs : ""}`,
      prestation: "Comparution immédiate",
      date_rdv: `${b.date_audience}T${heure}:00`,
      statut: statut === "refusee" ? "annule" : "attribue",
      avocat_discord_id: avocatId,
      avocat_nom: avocatNom,
    }]).select("id").single();
    if (errRdv) return NextResponse.json({ error: errRdv.message }, { status: 400 });

    const { data, error } = await db.from("cabinet_comparutions").insert([{
      date_audience: b.date_audience,
      heure,
      tribunal: b.tribunal || null,
      client_nom: String(b.client_nom).trim(),
      chefs: b.chefs || null,
      juge_proc: b.juge_proc || null,
      matricules_officiers: b.matricules_officiers || null,
      avocat_discord_id: avocatId,
      avocat_nom: avocatNom,
      statut,
      montant: montantCI,
      taux_pct: taux,
      part_avocat: partAvocat,
      notes: b.notes || null,
      rdv_id: rdv?.id || null,
      created_by: avocatNom,
    }]).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Modification (statut, montant, notes…). Passer en « refusée » annule le rendez-vous lié.
export async function PATCH(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized || !estStaffUser(r.user)) return NextResponse.json({ error: "Réservé au personnel du cabinet" }, { status: 403 });
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    const b = await req.json();
    const champs = ["date_audience", "heure", "tribunal", "client_nom", "chefs", "juge_proc", "matricules_officiers", "statut", "montant", "notes"];
    const maj: Record<string, any> = {};
    for (const c of champs) if (c in b) maj[c] = c === "montant" ? Math.max(0, Math.round(Number(b[c]) || 0)) : (b[c] === "" ? null : b[c]);
    // La part est recalculée à chaque modification avec le grade ACTUEL de l'avocat (corrige les parts à 0 %)
    const { data: actuel } = await db.from("cabinet_comparutions").select("avocat_discord_id, avocat_nom, montant").eq("id", id).single();
    const estMoi = actuel?.avocat_discord_id === (r.user as any).discord_id;
    const taux = await tauxAvocat(db, actuel?.avocat_discord_id || "", actuel?.avocat_nom || "", estMoi ? [(r.user as any).role, (r.user as any).site_role] : []);
    const montantFinal = "montant" in maj ? maj.montant : Number(actuel?.montant) || 0;
    maj.taux_pct = taux;
    maj.part_avocat = Math.round((montantFinal * taux) / 100);
    if (maj.statut && !STATUTS.includes(maj.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    const { data, error } = await db.from("cabinet_comparutions").update(maj).eq("id", id).select("*, rdv_id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (data?.rdv_id && maj.statut) {
      await db.from("cabinet_rdv").update({ statut: maj.statut === "refusee" ? "annule" : "attribue" }).eq("id", data.rdv_id);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Suppression définitive : réservée au patron. Supprime aussi le rendez-vous lié au calendrier.
export async function DELETE(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized || !estStaffUser(r.user)) return NextResponse.json({ error: "Réservé au personnel du cabinet" }, { status: 403 });
    if (!r.authorized || !estPatronUser(r.user)) return NextResponse.json({ error: "Réservé au patron" }, { status: 403 });
    const db = r.supabaseAdmin;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    const { data: ci } = await db.from("cabinet_comparutions").select("rdv_id").eq("id", id).maybeSingle();
    const { error } = await db.from("cabinet_comparutions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (ci?.rdv_id) await db.from("cabinet_rdv").delete().eq("id", ci.rdv_id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
