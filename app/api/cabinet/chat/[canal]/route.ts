import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { nomAffiche } from "@/lib/cabinetServer";
import { SALONS, accesDossier, diffuser, estDirection, estStaff, topicPour } from "@/lib/cabinetAcces";

// Messagerie interne. Le nom de canal (slug) dans l'URL :
//   salon-general, salon-juridique, salon-direction : salons par équipe
//   bureau-<ID Discord> : bureau d'un avocat (messages visibles par tous les employés)
//   dossier-<ID du dossier> : notes internes d'un dossier (direction et avocat assigné)
function resoudre(slug: string): { canal: string; ok: boolean; salon?: string } {
  if (slug.startsWith("salon-")) {
    const nom = slug.slice(6);
    if ((SALONS as readonly string[]).includes(nom)) return { canal: `salon:${nom}`, ok: true, salon: nom };
  }
  if (slug.startsWith("bureau-") && slug.length > 7) return { canal: `bureau:${slug.slice(7)}`, ok: true };
  if (slug.startsWith("dossier-") && slug.length > 8) return { canal: `interne:${slug.slice(8)}`, ok: true };
  return { canal: "", ok: false };
}

async function acces(user: any, db: any, slug: string) {
  const c = resoudre(slug);
  if (!c.ok) return { err: NextResponse.json({ error: "Canal inconnu" }, { status: 404 }) } as any;
  if (!estStaff(user)) return { err: NextResponse.json({ error: "Réservé aux employés" }, { status: 403 }) } as any;
  if (c.salon === "direction" && !estDirection(user)) return { err: NextResponse.json({ error: "Salon réservé à la direction" }, { status: 403 }) } as any;
  if (c.canal.startsWith("interne:")) {
    const dossierId = c.canal.slice(8);
    const a = await accesDossier(db, user, dossierId);
    if (!a.peutGerer) return { err: NextResponse.json({ error: "Dossier non attribué à ton nom" }, { status: 403 }) } as any;
  }
  return { canal: c.canal };
}

export async function GET(_req: Request, ctx: { params: Promise<{ canal: string }> }) {
  try {
    const { canal: slug } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const a = await acces(r.user, r.supabaseAdmin, slug); if (a.err) return a.err;
    const { data, error } = await r.supabaseAdmin.from("cabinet_internes").select("*").eq("canal", a.canal).order("created_at", { ascending: true }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [], topic: topicPour(a.canal) });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ canal: string }> }) {
  try {
    const { canal: slug } = await ctx.params;
    const r = await requireAnyPermission(["cabinet_dossiers", "cabinet_rdv"]);
    if (!r.authorized) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    const user = r.user as any;
    const a = await acces(user, r.supabaseAdmin, slug); if (a.err) return a.err;
    const b = await req.json();
    const contenu = String(b.contenu || "").trim().slice(0, 4000);
    const image_url = b.image_url ? String(b.image_url) : null;
    if (!contenu && !image_url) return NextResponse.json({ error: "Message vide" }, { status: 400 });

    const { data, error } = await r.supabaseAdmin.from("cabinet_internes").insert([{
      canal: a.canal,
      auteur_discord_id: user.discord_id,
      auteur_nom: nomAffiche(user),
      contenu: contenu || null,
      image_url,
    }]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await diffuser(a.canal, data);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
