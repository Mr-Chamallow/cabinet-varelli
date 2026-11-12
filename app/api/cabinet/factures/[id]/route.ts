import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { diffuser, estStaff } from "@/lib/cabinetAcces";
import { historiser, numeroAvoir } from "@/lib/factures";
import { journaliser } from "@/lib/journal";

const STATUTS = ["en_attente", "payee", "annulee"];
const MODES = ["Virement", "Espèces", "Carte", "Chèque", "Autre"];

// Détail d'une facture : historique, paiements reçus, avoirs
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_compta"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const { data: facture } = await db.from("cabinet_factures").select("*").eq("id", id).maybeSingle();
    if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    const { data: historique } = await db.from("cabinet_factures_historique").select("*").eq("facture_id", id).order("created_at", { ascending: false });
    const { data: paiements } = await db.from("cabinet_paiements").select("*").eq("facture_id", id).order("created_at", { ascending: false });
    return NextResponse.json({ facture, historique: historique || [], paiements: paiements || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Actions sur une facture :
// - { action: "paiement", montant, mode }  : paiement (partiel ou total)
// - { action: "avoir", motif }              : annulation par avoir numéroté
// - { statut: "en_attente" | "payee" | "annulee", mode? } : changement de statut
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_compta"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const user = r.user as any;
    const auteur = nomAffiche(user);
    const db = r.supabaseAdmin;
    const b = await req.json();

    const { data: actuelle } = await db.from("cabinet_factures").select("*").eq("id", id).maybeSingle();
    if (!actuelle) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    const total = Math.round(Number(actuelle.montant) || 0);
    const dejaPaye = Math.round(Number(actuelle.montant_paye) || 0);
    const reste = total - dejaPaye;

    const messageReglee = async () => {
      if (!actuelle.dossier_id) return;
      const { data: msg } = await db.from("cabinet_messages").insert([{
        dossier_id: actuelle.dossier_id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true,
        contenu: `Facture ${actuelle.numero || ""} réglée. Merci.`,
      }]).select().single();
      if (msg) await diffuser(`dossier:${actuelle.dossier_id}`, msg);
    };

    // Paiement partiel ou total
    if (b.action === "paiement") {
      const montant = Math.round(Number(b.montant));
      const mode = MODES.includes(b.mode) ? b.mode : "Autre";
      if (!(montant > 0)) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
      if (actuelle.statut === "annulee") return NextResponse.json({ error: "Facture annulée" }, { status: 400 });
      if (montant > reste) return NextResponse.json({ error: `Le reste à payer est de ${reste} $` }, { status: 400 });
      const { error: errPaie } = await db.from("cabinet_paiements").insert([{ facture_id: id, montant, mode, auteur_nom: auteur }]);
      if (errPaie) return NextResponse.json({ error: errPaie.message }, { status: 400 });
      const nouveauPaye = dejaPaye + montant;
      const complet = nouveauPaye >= total;
      const { data, error } = await db.from("cabinet_factures")
        .update({ montant_paye: nouveauPaye, statut: complet ? "payee" : actuelle.statut, payee_at: complet ? new Date().toISOString() : null })
        .eq("id", id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await historiser(db, id, "paiement", `${montant} $ par ${mode}${complet ? " (facture soldée)" : ` (reste ${total - nouveauPaye} $)`}`, auteur);
      if (complet) await messageReglee();
      return NextResponse.json(data);
    }

    // Avoir : annule la facture et crée un avoir numéroté
    if (b.action === "avoir") {
      const motif = String(b.motif || "").trim().slice(0, 300);
      if (!motif) return NextResponse.json({ error: "Motif requis" }, { status: 400 });
      if (actuelle.statut === "annulee") return NextResponse.json({ error: "Déjà annulée" }, { status: 400 });
      const numero = await numeroAvoir(db);
      const { error: errAv } = await db.from("cabinet_avoirs").insert([{ numero, facture_id: id, montant: total, motif, auteur_nom: auteur }]);
      if (errAv) return NextResponse.json({ error: errAv.message }, { status: 400 });
      await db.from("cabinet_factures").update({ statut: "annulee", payee_at: null }).eq("id", id);
      await historiser(db, id, "avoir", `Avoir ${numero} : ${motif}`, auteur);
      await journaliser(db, auteur, "Avoir émis", numero, `Facture ${actuelle.numero}`);
      return NextResponse.json({ ok: true, numero });
    }

    // Changement de statut
    if (!STATUTS.includes(b.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    if (actuelle.statut === b.statut) return NextResponse.json(actuelle);

    // Marquer réglée = encaisser le reste dû
    if (b.statut === "payee" && reste > 0) {
      const mode = MODES.includes(b.mode) ? b.mode : "Autre";
      await db.from("cabinet_paiements").insert([{ facture_id: id, montant: reste, mode, auteur_nom: auteur }]);
    }
    const majPaye = b.statut === "payee" ? total : dejaPaye;
    const { data, error } = await db.from("cabinet_factures")
      .update({ statut: b.statut, montant_paye: majPaye, payee_at: b.statut === "payee" ? new Date().toISOString() : null })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await historiser(db, id, "statut", `${actuelle.statut} vers ${b.statut}`, auteur);
    if (b.statut === "payee") await messageReglee();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
