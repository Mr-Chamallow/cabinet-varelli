import { MENTIONS_CABINET } from "@/lib/factureMentions";
import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { PERMS_BUREAU } from "@/lib/cabinetRoles";
import { estFacturation } from "@/lib/cabinetAcces";
import { nomAffiche } from "@/lib/cabinetServer";
import { calculer, historiser, nettoyerLignes, numeroDevis, numeroFacture } from "@/lib/factures";
import { journaliser } from "@/lib/journal";

// Devis : créés par la comptabilité, puis acceptés et transformés en facture
async function controle() {
  const r = await requireAnyPermission(PERMS_BUREAU);
  if (!r.authorized || !estFacturation(r.user)) return null;
  return r;
}

export async function GET() {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_devis").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const db = r.supabaseAdmin;
    const b = await req.json();
    const { data: dossier } = await db.from("cabinet_dossiers").select("id,titre,client_discord_id,client_nom").eq("id", b.dossier_id).maybeSingle();
    if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    const lignes = nettoyerLignes(b.lignes);
    if (lignes.length === 0) return NextResponse.json({ error: "Ajoute au moins une ligne" }, { status: 400 });
    const tvaTaux = Math.min(Math.max(Number(b.tva_taux) || 0, 0), 100);
    const { sousTotal, total } = calculer(lignes, tvaTaux);
    const numero = await numeroDevis(db);
    const { data, error } = await db.from("cabinet_devis").insert([{
      numero, dossier_id: dossier.id, client_discord_id: dossier.client_discord_id, client_nom: dossier.client_nom,
      lignes, sous_total: sousTotal, tva_taux: tvaTaux, montant: total, statut: "envoye",
      note: String(b.note || "").slice(0, 1000) || null, auteur_nom: nomAffiche(r.user),
      signatures: [{ role: "avocat", nom: nomAffiche(r.user), at: new Date().toISOString() }],
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await journaliser(db, nomAffiche(r.user), "Devis créé", numero, `${total} $`);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// action : accepter | refuser | transformer (crée la facture à partir du devis)
export async function PATCH(req: Request) {
  try {
    const r = await controle();
    if (!r) return NextResponse.json({ error: "Réservé à la comptabilité" }, { status: 403 });
    const db = r.supabaseAdmin;
    const auteur = nomAffiche(r.user);
    const b = await req.json();
    const { data: d } = await db.from("cabinet_devis").select("*").eq("id", b.id).maybeSingle();
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    if (d.statut === "facture") return NextResponse.json({ error: "Déjà transformé en facture" }, { status: 400 });

    if (b.action === "accepter" || b.action === "refuser") {
      const statut = b.action === "accepter" ? "accepte" : "refuse";
      const { data, error } = await db.from("cabinet_devis").update({ statut }).eq("id", d.id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    }

    if (b.action === "transformer") {
      if (d.statut !== "accepte") return NextResponse.json({ error: "Le devis doit être accepté" }, { status: 400 });
      const { data: dossier } = await db.from("cabinet_dossiers").select("id,titre,client_discord_id,client_nom").eq("id", d.dossier_id).maybeSingle();
      if (!dossier) return NextResponse.json({ error: "Dossier du devis introuvable" }, { status: 404 });
      const lignes = nettoyerLignes(d.lignes);
      const { sousTotal, total } = calculer(lignes, Number(d.tva_taux) || 0);
      const numero = await numeroFacture(db);
      const echeance = new Date(Date.now() + MENTIONS_CABINET.delaiPaiementJours * 86400_000).toISOString().slice(0, 10);
      const { data: facture, error } = await db.from("cabinet_factures").insert([{
        numero, dossier_id: dossier.id, client_discord_id: dossier.client_discord_id, client_nom: dossier.client_nom,
        libelle: `${numero} : ${dossier.titre}`.slice(0, 200), montant: total, sous_total: sousTotal, tva_taux: Number(d.tva_taux) || 0,
        lignes, note: d.note, cree_par: auteur, statut: "en_attente", date_echeance: echeance, montant_paye: 0,
      }]).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await db.from("cabinet_devis").update({ statut: "facture", facture_id: facture.id }).eq("id", d.id);
      await historiser(db, facture.id, "creation", `Depuis le devis ${d.numero}`, auteur);
      await journaliser(db, auteur, "Facture émise depuis devis", numero, `${d.numero}`);
      return NextResponse.json(facture);
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
