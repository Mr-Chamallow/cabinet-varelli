import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche, notifyDiscord } from "@/lib/cabinetServer";
import { diffuser, estStaff, topicPour } from "@/lib/cabinetAcces";
import { calculer, historiser, nettoyerLignes, numeroFacture } from "@/lib/factures";

// Liste des factures (employés) avec totaux : encaissé, en attente, en retard
export async function GET() {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const { data, error } = await r.supabaseAdmin.from("cabinet_factures").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const rows = data || [];
    const aujourdHui = new Date().toISOString().slice(0, 10);
    const totaux = {
      encaisse: rows.filter((f: any) => f.statut === "payee").reduce((s: number, f: any) => s + Number(f.montant || 0), 0),
      attente: rows.filter((f: any) => f.statut === "en_attente").reduce((s: number, f: any) => s + Number(f.montant || 0), 0),
      retard: rows.filter((f: any) => f.statut === "en_attente" && f.date_echeance && f.date_echeance < aujourdHui).length,
    };
    return NextResponse.json({ rows, totaux });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Nouvelle facture liée à un dossier : client repris du dossier, total calculé côté serveur,
// message automatique dans le dossier (le client la voit dans Mon espace et dans le dossier)
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();

    const { data: dossier } = await db.from("cabinet_dossiers").select("id,titre,client_discord_id,client_nom,statut").eq("id", b.dossier_id).maybeSingle();
    if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    if (dossier.statut === "archive") return NextResponse.json({ error: "Dossier archivé" }, { status: 400 });

    const lignes = nettoyerLignes(b.lignes);
    if (lignes.length === 0) return NextResponse.json({ error: "Ajoute au moins une ligne (désignation, quantité, prix)" }, { status: 400 });
    const tvaTaux = Math.min(Math.max(Number(b.tva_taux) || 0, 0), 100);
    const { sousTotal, total } = calculer(lignes, tvaTaux);
    if (total <= 0) return NextResponse.json({ error: "Le total doit être supérieur à 0" }, { status: 400 });

    const numero = await numeroFacture(db);
    const echeance = b.date_echeance || null;
    const { data: facture, error } = await db.from("cabinet_factures").insert([{
      numero,
      dossier_id: dossier.id,
      client_discord_id: dossier.client_discord_id,
      client_nom: dossier.client_nom,
      libelle: `${numero} : ${dossier.titre}`.slice(0, 200),
      montant: total,
      sous_total: sousTotal,
      tva_taux: tvaTaux,
      lignes,
      note: String(b.note || "").trim().slice(0, 1000) || null,
      statut: "en_attente",
      date_echeance: echeance,
      cree_par: nomAffiche(user),
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await historiser(db, facture.id, "creation", `Montant ${total.toFixed(2)} EUR`, nomAffiche(user));

    const texte = `Facture ${numero} émise : ${total.toFixed(2).replace(".", ",")} EUR` + (echeance ? `, échéance le ${new Date(echeance).toLocaleDateString("fr-FR")}` : "") + ". Elle est disponible dans Mon espace, onglet Mes factures.";
    const { data: msg } = await db.from("cabinet_messages").insert([{
      dossier_id: dossier.id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true, contenu: texte,
    }]).select().single();
    if (msg) await diffuser(`dossier:${dossier.id}`, msg);

    await notifyDiscord(`**Nouvelle facture** ${numero} (${total.toFixed(2).replace(".", ",")} EUR) sur le dossier : ${dossier.titre}`);
    return NextResponse.json(facture);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
