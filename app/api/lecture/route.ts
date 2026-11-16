import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { supabaseAdmin } from "@/lib/serverAuth";
import { hasPermission } from "@/lib/auth";

// Lecture des tables "finances" : seules les tables listées ici sont accessibles,
// et seulement aux personnes ayant une des permissions indiquées (lecture ou écriture).
// Les clients du cabinet n'ont aucune de ces permissions : ils ne peuvent rien lire.
const LECTURE: Record<string, string[]> = {
  obsidian_paiements: ["obsidian_paie"],
  obsidian_comptabilite: ["obsidian_comptabilite", "obsidian_paie", "obsidian_stats", "obsidian_dashboard"],
  obsidian_dons: ["obsidian_dons", "obsidian_paie", "obsidian_dashboard"],
  obsidian_taxes: ["obsidian_taxes"],
  obsidian_taxes_paiements: ["obsidian_taxes"],
  cahier_transactions: ["cahier_vente", "obsidian_comptabilite", "obsidian_stats"],
};

export const dynamic = "force-dynamic";

type Filtre = [string, any];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user: any = session?.user;
    if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const b = await req.json();
    const table = String(b.table || "");
    const perms = LECTURE[table];
    if (!perms) return NextResponse.json({ error: "Table inconnue" }, { status: 404 });

    const u = { id: user.discord_id, nom: user.discord_name, role: user.site_role, permissions: user.permissions || [] };
    if (!perms.some(p => hasPermission(u as any, p))) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const options = b.count ? { count: "exact" as const, head: !!b.head } : undefined;
    let q: any = supabaseAdmin.from(table).select(String(b.select || "*"), options);

    for (const [col, val] of (b.eq || []) as Filtre[]) q = q.eq(col, val);
    for (const [col, val] of (b.ilike || []) as Filtre[]) q = q.ilike(col, val);
    for (const [col, ascending] of (b.order || []) as [string, boolean][]) q = q.order(col, { ascending: !!ascending });
    if (b.range) q = q.range(Number(b.range[0]), Number(b.range[1]));
    if (b.limit) q = q.limit(Number(b.limit));

    const { data, error, count } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data || [], count: count ?? null });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
