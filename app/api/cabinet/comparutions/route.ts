import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";

const STATUTS = ["prise_en_charge", "en_attente", "refusee"];

// Liste : tous les avocats voient toutes les comparutions immédiates.
export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
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
    const { data: g } = await db.from("cabinet_avocat_grades").select("grade").eq("avocat_discord_id", avocatId).maybeSingle();
    const { data: t } = g?.grade ? await db.from("cabinet_grades").select("taux_pct").eq("grade", g.grade).maybeSingle() : { data: null };
    const taux = Number(t?.taux_pct) || 0;
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
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    const b = await req.json();
    const champs = ["date_audience", "heure", "tribunal", "client_nom", "chefs", "juge_proc", "matricules_officiers", "statut", "montant", "notes"];
    const maj: Record<string, any> = {};
    for (const c of champs) if (c in b) maj[c] = c === "montant" ? Math.max(0, Math.round(Number(b[c]) || 0)) : (b[c] === "" ? null : b[c]);
    if ("montant" in maj) {
      const { data: actuel } = await db.from("cabinet_comparutions").select("taux_pct").eq("id", id).single();
      maj.part_avocat = Math.round((maj.montant * (Number(actuel?.taux_pct) || 0)) / 100);
    }
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
