import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canWrite, nomAffiche } from "@/lib/cabinetServer";
import { journaliser } from "@/lib/journal";

// Tables éditables du cabinet (tarifs, organigramme, présentation, types de dossiers)
const TABLES: Record<string, { write: string; cols: string[]; order: string; key: string; staffOnly?: boolean }> = {
  cabinet_tarifs:        { write: "cabinet_tarifs",        cols: ["categorie", "nom", "prix", "prix_montant", "commission_pct", "description", "ordre"], order: "ordre", key: "id" },
  cabinet_membres:       { write: "cabinet_organigramme",  cols: ["nom_rp", "poste", "description", "ordre", "photo_url", "barreau", "numero_barreau", "annee_inscription", "specialites", "slogan", "telephone", "email"], order: "ordre", key: "id" },
  cabinet_avis:          { write: "cabinet_presentation",   cols: ["auteur_nom", "note", "contenu", "statut"],          order: "created_at", key: "id", staffOnly: true },
  cabinet_pages:         { write: "cabinet_presentation",  cols: ["cle", "contenu"],                                   order: "cle",   key: "cle" },
  cabinet_dossier_types: { write: "cabinet_dossiers",      cols: ["nom", "description", "template", "ordre"],          order: "ordre", key: "id" },
  cabinet_codes_constitution_usa: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_constitution_sa: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_aviation: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_civil: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_electoral: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_environnemental: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_gouvernemental: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_impots: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_travail: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_maritime: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_penal_texte: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_procedure_penale: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_route: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_armes: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_etat_urgence: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_autres_lois: { write: "cabinet_dossiers", cols: ["numero", "partie", "titre_rubrique", "chapitre", "texte", "applicable", "ordre"], order: "ordre", key: "id" },
  cabinet_codes_livret: { write: "cabinet_dossiers", cols: ["article", "categorie_id", "titre", "contenu", "amende", "detention", "procureur", "bracelet", "autres_sanctions", "ordre"], order: "ordre", key: "id" },
};

async function guard(table: string, mode: "read" | "write") {
  const c = TABLES[table];
  if (!c) return { err: NextResponse.json({ error: "Table inconnue" }, { status: 404 }) } as any;
  // Table réservée au cabinet (ex : avis non publiés) : même la lecture est réservée aux employés
  const r = await requireAnyPermission(mode === "read" && !c.staffOnly ? ["avocat", c.write, "cabinet_compta"] : [c.write]);
  if (!r.authorized) return { err: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) } as any;
  if (mode === "write" && !canWrite(r.user, c.write)) return { err: NextResponse.json({ error: "Lecture seule pour toi sur cet onglet" }, { status: 403 }) } as any;
  return { db: r.supabaseAdmin, c, user: r.user };
}

const pick = (b: any, cols: string[]) =>
  Object.fromEntries(
    cols.filter(c => c in (b || {})).map(c => {
      const v = b[c];
      if (v === "" || v === undefined || v === null) return [c, null];
      return [c, c === "ordre" ? Number(v) || 0 : v];
    })
  );

export async function GET(_req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await guard(table, "read"); if (a.err) return a.err;
    const { data, error } = await a.db.from(table).select("*").order(a.c.order, { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rows: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await guard(table, "write"); if (a.err) return a.err;
    const payload = pick(await req.json(), a.c.cols);
    if (table === "cabinet_pages") {
      if (!payload.cle) return NextResponse.json({ error: "cle requise" }, { status: 400 });
      const { data, error } = await a.db.from(table).upsert([{ ...payload, updated_at: new Date().toISOString() }], { onConflict: "cle" }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data);
    }
    const { data, error } = await a.db.from(table).insert([payload]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await guard(table, "write"); if (a.err) return a.err;
    const body = await req.json();
    const key = a.c.key;
    if (!body[key]) return NextResponse.json({ error: `${key} requis` }, { status: 400 });
    const patch = pick(body, a.c.cols.filter(c => c !== key));
    const avant = table === "cabinet_tarifs" ? (await a.db.from(table).select("*").eq(key, body[key]).maybeSingle()).data : null;
    const { data, error } = await a.db.from(table).update(patch).eq(key, body[key]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (avant && (avant.prix !== data.prix || avant.prix_montant !== data.prix_montant)) {
      await a.db.from("cabinet_tarifs_historique").insert([{ tarif_id: data.id, nom: data.nom, ancien_prix: String(avant.prix ?? ""), nouveau_prix: String(data.prix ?? ""), auteur_nom: nomAffiche(a.user) }]);
    }
    if (table !== "cabinet_pages") await journaliser(a.db, nomAffiche(a.user), "Modification", `${table} : ${data.nom || data.nom_rp || ""}`, null);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await guard(table, "write"); if (a.err) return a.err;
    const body = await req.json();
    const key = a.c.key;
    if (!body[key]) return NextResponse.json({ error: `${key} requis` }, { status: 400 });
    const { error } = await a.db.from(table).delete().eq(key, body[key]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 });
  }
}
