import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { hasWriteAccess } from "@/lib/auth";
import { logAudit } from "@/lib/alerts";

// Ecriture generique des tables "simples" : chaque table a SA permission (niveau ecriture requis).
// audit = table dont on garde la trace dans le journal d'audit (qui a change quoi).
const TABLES: Record<string, { perm: string[]; audit?: string; label?: string }> = {
  obsidian_drogues: { perm: ["obsidian_prix"], audit: "nom", label: "Prix drogue" },
  obsidian_armes_prix: { perm: ["obsidian_prix"], audit: "nom", label: "Prix arme" },
  obsidian_zones: { perm: ["obsidian_prix"], audit: "nom", label: "Zone" },
  obsidian_garage: { perm: ["obsidian_garage"], audit: "modele", label: "Garage" },
  obsidian_rdv: { perm: ["obsidian_rdv"], label: "Rendez-vous" },
  obsidian_contrats: { perm: ["obsidian_contrats"], audit: "titre", label: "Contrat" },
  obsidian_fiches: { perm: ["obsidian_fiches", "base_donnees", "obsidian_dashboard"], audit: "nom", label: "Fiche" },
  obsidian_journal: { perm: ["obsidian_fiches"] },
  bdd_personnes: { perm: ["base_donnees", "obsidian_fiches", "obsidian_dashboard"], audit: "nom", label: "Personne" },
  bdd_vehicules: { perm: ["base_donnees"], audit: "plaque", label: "Vehicule BDD" },
  bdd_activites: { perm: ["base_donnees", "obsidian_fiches", "obsidian_dashboard"] },
  carte_gangs: { perm: ["carte-enqueteur", "base_donnees"], audit: "nom", label: "Groupe" },
  carte_points: { perm: ["carte-enqueteur"] },
  carte_dossiers: { perm: ["carte-enqueteur"] },
  carte_personnes: { perm: ["carte-enqueteur", "base_donnees"] },
  carte_plaques: { perm: ["carte-enqueteur", "base_donnees"] },
  carte_categories: { perm: ["carte-enqueteur"] },
  cahier_produits: { perm: ["cahier_vente"] },
  obsidian_boards: { perm: ["carte-enqueteur", "juridique", "base_donnees"], audit: "nom", label: "Tableau d'enquete" },
  obsidian_board_links: { perm: ["carte-enqueteur", "juridique", "base_donnees"] },
  obsidian_board: { perm: ["carte-enqueteur", "juridique", "base_donnees"] },
  obsidian_taxes: { perm: ["obsidian_taxes"], audit: "groupe", label: "Taxe" },
  obsidian_recrutement: { perm: ["obsidian_recrutement"], audit: "nom_rp", label: "Recrutement" },
  obsidian_guerres: { perm: ["obsidian_guerres"], audit: "adversaire", label: "Guerre" },
  obsidian_settings: { perm: ["obsidian_paie", "obsidian_comptabilite", "obsidian_reglement"], audit: "id", label: "Reglages" },
};
const STRIP = ["id", "created_at"]; // jamais fournis par le client sauf upsert explicite

async function auth(table: string) {
  const cfg = TABLES[table];
  if (!cfg) return { err: NextResponse.json({ error: "Table inconnue" }, { status: 404 }) } as any;
  let last: any = null;
  for (const p of cfg.perm) {
    const r = await requirePermission(p);
    last = r;
    if (r.authorized) {
      const u: any = r.user;
      if (hasWriteAccess({ id: u.discord_id, nom: u.discord_name, role: u.site_role, permissions: u.permissions } as any, p)) {
        return { db: r.supabaseAdmin, who: String(u.nom_perso || u.discord_name || ""), cfg };
      }
    }
  }
  return { err: NextResponse.json({ error: last?.error || "Ecriture non autorisee" }, { status: 403 }) } as any;
}
const clean = (o: any) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !STRIP.includes(k)));
const describe = (cfg: any, row: any) => (cfg.audit && row ? String(row[cfg.audit] ?? "") : "");

export async function POST(req: Request, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params;
    const a = await auth(table); if (a.err) return a.err;
    const b = await req.json();
    const rows = (Array.isArray(b.rows) ? b.rows : [b.row]).filter(Boolean).map(clean);
    if (!rows.length) return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    const { data, error } = await a.db.from(table).insert(rows).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (a.cfg.audit) await logAudit(a.db, a.who, `${a.cfg.label} cree`, describe(a.cfg, data?.[0]));
    return NextResponse.json({ data: Array.isArray(b.rows) ? data : data?.[0] });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params;
    const a = await auth(table); if (a.err) return a.err;
    const b = await req.json();
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const patch = clean(b.patch);
    const { data: before } = await a.db.from(table).select("*").eq("id", b.id).maybeSingle();
    const { data, error } = await a.db.from(table).update(patch).eq("id", b.id).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (a.cfg.audit) {
      const diff = Object.keys(patch).filter(k => before && JSON.stringify(before[k]) !== JSON.stringify(patch[k])).map(k => `${k}: ${String(before[k] ?? "")} -> ${String(patch[k] ?? "")}`).join(" ; ").slice(0, 400);
      if (diff) await logAudit(a.db, a.who, `${a.cfg.label} modifie`, describe(a.cfg, data || before), diff);
    }
    return NextResponse.json({ data });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

// Upsert (reglages) : l'id est autorise ici
export async function PUT(req: Request, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params;
    const a = await auth(table); if (a.err) return a.err;
    const b = await req.json();
    const row = { ...(b.row || {}), updated_at: new Date().toISOString() };
    const { data, error } = await a.db.from(table).upsert(row, { onConflict: b.onConflict || "id" }).select().maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (a.cfg.audit) await logAudit(a.db, a.who, `${a.cfg.label} modifie`, describe(a.cfg, row), JSON.stringify(row).slice(0, 400));
    return NextResponse.json({ data });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await params;
    const a = await auth(table); if (a.err) return a.err;
    const b = await req.json();
    if (table === "obsidian_board" && b.all) {
      const { error } = await a.db.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (!b.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const { data: before } = await a.db.from(table).select("*").eq("id", b.id).maybeSingle();
    if (table === "carte_gangs") { // on detache les personnes / vehicules du groupe (pas de suppression)
      await a.db.from("bdd_personnes").update({ groupe_id: null }).eq("groupe_id", b.id);
      await a.db.from("bdd_vehicules").update({ groupe_id: null }).eq("groupe_id", b.id);
    }
    const { error } = await a.db.from(table).delete().eq("id", b.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (a.cfg.audit) await logAudit(a.db, a.who, `${a.cfg.label} supprime`, describe(a.cfg, before), JSON.stringify(before || {}).slice(0, 400));
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
