import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { diffuser, estStaff } from "@/lib/cabinetAcces";
import { historiser } from "@/lib/factures";

const STATUTS = ["en_attente", "payee", "annulee"];

// Détail d'une facture et son historique
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const db = r.supabaseAdmin;
    const { data: facture } = await db.from("cabinet_factures").select("*").eq("id", id).maybeSingle();
    if (!facture) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    const { data: historique } = await db.from("cabinet_factures_historique").select("*").eq("facture_id", id).order("created_at", { ascending: false });
    return NextResponse.json({ facture, historique: historique || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// Changer le statut : en_attente, payee ou annulee. Chaque changement est historisé.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    if (!estStaff(r.user)) return NextResponse.json({ error: "Réservé aux employés" }, { status: 403 });
    const user = r.user as any;
    const db = r.supabaseAdmin;
    const b = await req.json();
    if (!STATUTS.includes(b.statut)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

    const { data: actuelle } = await db.from("cabinet_factures").select("*").eq("id", id).maybeSingle();
    if (!actuelle) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    if (actuelle.statut === b.statut) return NextResponse.json(actuelle);

    const { data, error } = await db.from("cabinet_factures")
      .update({ statut: b.statut, payee_at: b.statut === "payee" ? new Date().toISOString() : null })
      .eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await historiser(db, id, "statut", `${actuelle.statut} vers ${b.statut}`, nomAffiche(user));

    // Facture réglée : message de confirmation dans le dossier
    if (b.statut === "payee" && actuelle.dossier_id) {
      const { data: msg } = await db.from("cabinet_messages").insert([{
        dossier_id: actuelle.dossier_id, auteur_nom: "Cabinet Varelli & Associés", est_staff: true,
        contenu: `Facture ${actuelle.numero || ""} réglée. Merci.`,
      }]).select().single();
      if (msg) await diffuser(`dossier:${actuelle.dossier_id}`, msg);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
