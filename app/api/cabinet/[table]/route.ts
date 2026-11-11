import { NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/serverAuth";
import { canWrite } from "@/lib/cabinetServer";

// Tables éditables du cabinet (tarifs, organigramme, présentation, types de dossiers)
const TABLES: Record<string, { write: string; cols: string[]; order: string; key: string; staffOnly?: boolean }> = {
  cabinet_tarifs:        { write: "cabinet_tarifs",        cols: ["categorie", "nom", "prix", "description", "ordre"], order: "ordre", key: "id" },
  cabinet_membres:       { write: "cabinet_organigramme",  cols: ["nom_rp", "poste", "description", "ordre", "photo_url", "barreau", "numero_barreau", "annee_inscription", "specialites"], order: "ordre", key: "id" },
  cabinet_avis:          { write: "cabinet_presentation",   cols: ["auteur_nom", "note", "contenu", "statut"],          order: "created_at", key: "id", staffOnly: true },
  cabinet_pages:         { write: "cabinet_presentation",  cols: ["cle", "contenu"],                                   order: "cle",   key: "cle" },
  cabinet_dossier_types: { write: "cabinet_dossiers",      cols: ["nom", "description", "template", "ordre"],          order: "ordre", key: "id" },
};

async function guard(table: string, mode: "read" | "write") {
  const c = TABLES[table];
  if (!c) return { err: NextResponse.json({ error: "Table inconnue" }, { status: 404 }) } as any;
  // Table réservée au cabinet (ex : avis non publiés) : même la lecture est réservée aux employés
  const r = await requireAnyPermission(mode === "read" && !c.staffOnly ? ["avocat", c.write] : [c.write]);
  if (!r.authorized) return { err: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) } as any;
  if (mode === "write" && !canWrite(r.user, c.write)) return { err: NextResponse.json({ error: "Lecture seule pour toi sur cet onglet" }, { status: 403 }) } as any;
  return { db: r.supabaseAdmin, c };
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
    const { data, error } = await a.db.from(table).update(patch).eq(key, body[key]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
