import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/serverAuth";
import { diffuser } from "@/lib/cabinetAcces";
import { historiser } from "@/lib/factures";
import { montant } from "@/lib/montant";
import { prevenirRelance } from "@/lib/cabinetNotifs";

// Relance automatique (Vercel Cron, voir vercel.json) : facture échue et non réglée
// => message dans le dossier avec le PDF, DM au client. Une relance au plus tous les 7 jours.
export const dynamic = "force-dynamic";
const DELAI_JOURS = 7;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const db = supabaseAdmin;
    const aujourdHui = new Date().toISOString().slice(0, 10);
    const limite = new Date(Date.now() - DELAI_JOURS * 86400_000).toISOString().slice(0, 10);

    const { data: factures, error } = await db.from("cabinet_factures")
      .select("*").eq("statut", "en_attente").lt("date_echeance", aujourdHui).not("dossier_id", "is", null);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    let relancees = 0;
    for (const f of factures || []) {
      if (f.derniere_relance && f.derniere_relance > limite) continue;
      const { data: dossier } = await db.from("cabinet_dossiers").select("id,titre,client_discord_id,statut").eq("id", f.dossier_id).maybeSingle();
      if (!dossier || dossier.statut !== "ouvert") continue;

      const texte = `Rappel : la facture ${f.numero} de ${montant(f.montant)} est échue depuis le ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}. Merci de la régulariser. Le PDF est joint ci-dessous.`;
      const { data: msg } = await db.from("cabinet_messages").insert([{
        dossier_id: dossier.id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true, contenu: texte,
        fichier_url: `/api/cabinet/factures/${f.id}/pdf`, fichier_nom: `${f.numero}.pdf`,
      }]).select().single();
      if (msg) await diffuser(`dossier:${dossier.id}`, msg);

      await db.from("cabinet_factures").update({ derniere_relance: aujourdHui }).eq("id", f.id);
      await historiser(db, f.id, "relance", "Relance automatique envoyée dans le dossier", "Système");
      await prevenirRelance(dossier.client_discord_id, f.numero, f.montant);
      relancees++;
    }
    return NextResponse.json({ ok: true, relancees });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
