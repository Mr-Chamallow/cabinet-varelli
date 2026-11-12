import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Devis du client connecté (client principal ou client ajouté au dossier). Il peut signer ou refuser un devis envoyé.
async function estClientDuDevis(db: any, devis: any, moi: string) {
  if (devis.client_discord_id === moi) return true;
  const { data } = await db.from("cabinet_dossier_clients").select("dossier_id").eq("dossier_id", devis.dossier_id).eq("client_discord_id", moi).maybeSingle();
  return !!data;
}

export async function GET() {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const moi = (r.user as any).discord_id;
    const { data: co } = await db.from("cabinet_dossier_clients").select("dossier_id").eq("client_discord_id", moi);
    const coIds = (co || []).map((x: any) => x.dossier_id);
    const filtre = coIds.length ? `client_discord_id.eq.${moi},dossier_id.in.(${coIds.join(",")})` : `client_discord_id.eq.${moi}`;
    const { data, error } = await db.from("cabinet_devis")
      .select("id,numero,lignes,sous_total,tva_taux,montant,statut,note,signatures,created_at,dossier_id,client_discord_id")
      .neq("statut", "facture").or(filtre).order("created_at", { ascending: false }).limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

// action : accepter (avec nom complet = signature) | refuser
export async function POST(req: Request) {
  try {
    const r = await requireAnyPermission(["avocat"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const db = r.supabaseAdmin;
    const moi = (r.user as any).discord_id;
    const b = await req.json();
    const { data: d } = await db.from("cabinet_devis").select("*").eq("id", b.id).maybeSingle();
    if (!d) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    if (!(await estClientDuDevis(db, d, moi))) return NextResponse.json({ error: "Ce devis ne te concerne pas" }, { status: 403 });
    if (d.statut !== "envoye") return NextResponse.json({ error: "Ce devis n'est plus en attente de signature" }, { status: 400 });

    const auteur = nomAffiche(r.user);
    if (b.action === "accepter") {
      const nom = String(b.nom || "").trim().slice(0, 120);
      if (nom.length < 3) return NextResponse.json({ error: "Tape ton nom complet pour signer" }, { status: 400 });
      const signatures = [...(Array.isArray(d.signatures) ? d.signatures : []), { role: "client", nom, discord_id: moi, at: new Date().toISOString() }];
      const { data, error } = await db.from("cabinet_devis").update({ statut: "accepte", signatures }).eq("id", d.id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await journaliser(db, nom, "Devis signé par le client", d.numero, `${d.montant} $`);
      return NextResponse.json(data);
    }
    if (b.action === "refuser") {
      const { data, error } = await db.from("cabinet_devis").update({ statut: "refuse" }).eq("id", d.id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      await journaliser(db, auteur, "Devis refusé par le client", d.numero, null);
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
