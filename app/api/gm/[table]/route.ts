import { palierOf } from "@/lib/rolesRP";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/serverAuth";
import { hasWriteAccess } from "@/lib/auth";
import { postAlert, syncAlert, logAudit, GOLD, GREEN, RED, ORANGE, BLUE, GREY } from "@/lib/alerts";
import { GROUPS } from "@/lib/discordRoles";

// Écriture générique des tables du Consortium. Chaque table a SA permission (niveau écriture requis).
const TABLES: Record<string, { perm: string[]; cols: string[] }> = {
  tribunal_dossiers: { perm: ["gm_tribunal"], cols: ["titre", "accuse", "organisation", "statut", "juge", "procureur", "avocat", "date_audience", "acte_accusation", "defense", "preuves", "verdict", "sentence"] },
  gm_pactes: { perm: ["gm_pactes"], cols: ["organisation", "statut", "date_signature", "date_fin", "signataire", "clauses", "violations"] },
  gm_audits: { perm: ["gm_audits"], cols: ["organisation", "note", "appreciation", "sanction", "sanction_fin", "notes"] },
  gm_evenements: { perm: ["gm_evenements"], cols: ["type", "titre", "statut", "partenaire", "date_event", "montant", "lots", "notes", "checklist"] },
  gm_reputation_log: { perm: ["gm_reputation"], cols: ["organisation", "delta", "motif"] },
  gm_organisations: { perm: ["gm_reputation", "gm_pactes", "gm_audits", "gm_tribunal", "gm_evenements"], cols: ["nom", "categorie", "notes"] },
};

async function auth(table: string) {
  const cfg = TABLES[table];
  if (!cfg) return { err: NextResponse.json({ error: "Table inconnue" }, { status: 404 }) } as any;
  let last: any = null;
  for (const p of cfg.perm) {
    const r = await requirePermission(p);
    last = r;
    if (r.authorized) {
      const u: any = r.user;
      const ok = hasWriteAccess({ id: u.discord_id, nom: u.discord_name, role: u.site_role, permissions: u.permissions } as any, p);
      if (ok) return { db: r.supabaseAdmin, who: u.nom_perso || u.discord_name || "", cfg };
    }
  }
  return { err: NextResponse.json({ error: last?.error || "Écriture non autorisée sur cet onglet" }, { status: 403 }) } as any;
}

// Le groupe doit exister dans Base de données → Groupes (carte_gangs) : on le relie par son id.
const GROUP_FIELD: Record<string, { field: string; strict: boolean }> = {
  tribunal_dossiers: { field: "organisation", strict: true }, gm_pactes: { field: "organisation", strict: true },
  gm_audits: { field: "organisation", strict: true }, gm_reputation_log: { field: "organisation", strict: true },
  gm_evenements: { field: "partenaire", strict: false },
};
async function linkGroupe(db: any, table: string, payload: any): Promise<string | null> {
  const g = GROUP_FIELD[table]; if (!g || !(g.field in payload)) return null;
  const name = String(payload[g.field] ?? "").trim();
  if (!name) { payload.groupe_id = null; return null; }
  const { data } = await db.from("carte_gangs").select("id,nom").ilike("nom", name).limit(1).maybeSingle();
  if (data) { payload.groupe_id = data.id; payload[g.field] = data.nom; return null; }
  payload.groupe_id = null;
  return g.strict ? `Groupe « ${name} » introuvable : crée-le d'abord dans Base de données → Groupes.` : null;
}

const pick = (b: any, cols: string[]) => Object.fromEntries(Object.entries(b || {}).filter(([k]) => cols.includes(k)).map(([k, v]) => [k, v === "" ? null : v]));

async function ensureOrg(db: any, nom?: string | null) {
  if (nom && nom.trim()) await db.from("gm_organisations").upsert({ nom: nom.trim() }, { onConflict: "nom", ignoreDuplicates: true });
}
async function rep(db: any, organisation: string, delta: number, motif: string, source: string, source_id: string, by: string) {
  if (!organisation || !delta) return;
  await ensureOrg(db, organisation);
  await db.from("gm_reputation_log").insert([{ organisation, delta, motif, source, source_id, created_by: by }]);
}
const clearRep = (db: any, source: string, id: string) => db.from("gm_reputation_log").delete().eq("source", source).eq("source_id", id);

// Qui prévenir selon le type d'événement
// Qui prévenir (seulement si l'alerte est urgente : échec / attaque / capture à faire)
const evColor = (st: string) => (/echec|attaq/.test(st) ? RED : /livre|cloturee|capturee|resolue/.test(st) ? GREEN : /annul/.test(st) ? GREY : BLUE);
function pingEvent(type: string, statut = "") {
  if (type === "convoi") return /echec|attaq/.test(statut) ? [...GROUPS.LOGISTIQUE, ...GROUPS.SECURITE] : [];
  if (type === "capture") return statut === "a_faire" ? GROUPS.SECURITE : [];
  if (type === "alerte") return statut === "ouverte" ? (["RS", "AJ"] as any) : [];
  return [] as any;
}

async function afterCreate(db: any, table: string, row: any, who: string) {
  if (table === "gm_audits") {
    await rep(db, row.organisation, Math.round((Number(row.note) - 5) * 4), `Audit : ${row.note}/10`, "audit", row.id, who);
    await syncAlert(db, table, row, "gm", `🔎 Audit — ${row.organisation}`, `Note **${row.note}/10**${row.appreciation ? `\n${row.appreciation}` : ""}${row.sanction ? `\n⛔ Sanction : **${row.sanction}**` : ""}`, Number(row.note) >= 5 ? GREEN : RED, undefined, Number(row.note) < 5 ? [...GROUPS.JURIDIQUE, "COO"] : ["RJ", "AJ"]);
  } else if (table === "gm_pactes") {
    await ensureOrg(db, row.organisation);
    if (row.statut === "actif") await rep(db, row.organisation, 5, "Pacte signé", "pacte", row.id, who);
    await syncAlert(db, table, row, "gm", `🤝 Pacte — ${row.organisation}`, `Statut : **${row.statut}**${row.clauses ? `\n${String(row.clauses).slice(0, 300)}` : ""}`, GOLD);
  } else if (table === "tribunal_dossiers") {
    await ensureOrg(db, row.organisation);
    await syncAlert(db, table, row, "gm", `⚖️ Dossier — ${row.titre}`, `Accusé : **${row.accuse || row.organisation || "?"}**\nStatut : ${row.statut}`, GOLD);
  } else if (table === "gm_evenements") {
    await ensureOrg(db, row.partenaire);
    const ic: any = { convoi: "🚚", enchere: "🔨", alerte: "🚨", capture: "🎯" };
    await syncAlert(db, table, row, "gm", `${ic[row.type] || "📌"} ${row.titre}`, `Statut : **${row.statut}**${row.partenaire ? `\nPartenaire : ${row.partenaire}` : ""}`, evColor(row.statut), undefined, pingEvent(row.type, row.statut));
  }
}

async function afterUpdate(db: any, table: string, old: any, row: any, who: string) {
  if (table === "gm_audits") {
    await clearRep(db, "audit", row.id);
    await rep(db, row.organisation, Math.round((Number(row.note) - 5) * 4), `Audit : ${row.note}/10`, "audit", row.id, who);
    if (row.sanction_fin !== old.sanction_fin) await db.from("gm_audits").update({ sanction_alerte: false }).eq("id", row.id);
  } else if (table === "gm_pactes") {
    const nv = (row.violations || []).length - (old.violations || []).length;
    if (nv > 0) {
      await rep(db, row.organisation, -10 * nv, `${nv} violation(s) du pacte`, "pacte_violation", row.id, who);
      await postAlert("gm", `⚠️ Violation de pacte — ${row.organisation}`, (row.violations || []).slice(-nv).map((v: any) => `• ${v.texte}`).join("\n"), ORANGE, undefined, GROUPS.JURIDIQUE);
    }
    if (row.statut !== old.statut) {
      if (row.statut === "rompu") await rep(db, row.organisation, -20, "Pacte rompu", "pacte_rompu", row.id, who);
      await syncAlert(db, table, row, "gm", `🤝 Pacte — ${row.organisation}`, `Statut : **${row.statut}** _(avant : ${old.statut})_`, row.statut === "rompu" ? RED : GOLD, undefined, row.statut === "rompu" ? [...GROUPS.JURIDIQUE, ...GROUPS.DIRECTION] : undefined);
    }
  } else if (table === "tribunal_dossiers") {
    if (row.verdict !== old.verdict && row.verdict !== "en_cours") {
      if (row.verdict === "coupable") {
        const { data: dupC } = await db.from("gm_evenements").select("id").eq("type", "capture").eq("dossier_id", row.id).limit(1).maybeSingle();
        if (!dupC) await db.from("gm_evenements").insert([{ type: "capture", titre: `Capture : ${row.accuse || row.organisation || row.titre}`, statut: "a_faire", partenaire: row.organisation || null, dossier_id: row.id, notes: `Condamné par le Tribunal de l'Ombre — dossier « ${row.titre} ».${row.sentence ? `\nSentence : ${row.sentence}` : ""}`, created_by: who }]);
      }
      if (row.verdict === "coupable" && row.organisation) await rep(db, row.organisation, -15, `Condamné : ${row.titre}`, "tribunal", row.id, who);
      await postAlert("gm", `⚖️ Verdict — ${row.titre}`, `**${row.verdict === "coupable" ? "COUPABLE" : "INNOCENT"}**${row.sentence ? `\nSentence : ${row.sentence}` : ""}\nAccusé : ${row.accuse || row.organisation || "?"}`, row.verdict === "coupable" ? RED : GREEN, undefined, row.verdict === "coupable" ? [...GROUPS.SECURITE, "CEO", "RJ"] : GROUPS.JURIDIQUE);
    } else if (row.statut !== old.statut) {
      await syncAlert(db, table, row, "gm", `⚖️ Dossier — ${row.titre}`, `Accusé : **${row.accuse || row.organisation || "?"}**\nStatut : **${row.statut}**`, GOLD);
    }
  } else if (table === "gm_evenements" && row.statut !== old.statut) {
    await clearRep(db, "evenement", row.id);
    if (row.type === "convoi" && row.partenaire) {
      if (row.statut === "livre") await rep(db, row.partenaire, 5, `Convoi livré : ${row.titre}`, "evenement", row.id, who);
      if (row.statut === "echec") await rep(db, row.partenaire, -5, `Convoi échoué : ${row.titre}`, "evenement", row.id, who);
    }
    const ic: any = { convoi: "🚚", enchere: "🔨", alerte: "🚨", capture: "🎯" };
    await syncAlert(db, table, row, "gm", `${ic[row.type] || "📌"} ${row.titre}`, `Statut : **${row.statut}**${row.partenaire ? `\nPartenaire : ${row.partenaire}` : ""}\n_(avant : ${old.statut})_`, evColor(row.statut), undefined, pingEvent(row.type, row.statut));
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await auth(table); if (a.err) return a.err;
    const body = await req.json();
    const payload: any = { ...pick(body, a.cfg.cols), created_by: a.who };
    const le = await linkGroupe(a.db, table, payload); if (le) return NextResponse.json({ error: le }, { status: 400 });
    if (table === "gm_organisations" && !payload.nom) return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    const { data, error } = await a.db.from(table).insert([payload]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (table === "gm_reputation_log") {
      const { data: all } = await a.db.from("gm_reputation_log").select("delta").eq("organisation", data.organisation);
      const after = Math.max(0, Math.min(100, 50 + (all || []).reduce((t: number, r: any) => t + Number(r.delta || 0), 0))), before = Math.max(0, Math.min(100, after - Number(data.delta || 0)));
      const pa = palierOf(after), pb = palierOf(before);
      await postAlert("gm", `⭐ Réputation — ${data.organisation}`, `${data.delta > 0 ? "+" : ""}${data.delta} · ${data.motif || "ajustement manuel"}\nScore : ${after}/100 — **${pa.label}**${pa.label !== pb.label ? `\n${data.delta > 0 ? "⬆️" : "⬇️"} Changement de palier : ${pb.label} → **${pa.label}**\n_${pa.effet}_` : ""}`, data.delta >= 0 ? GREEN : RED);
    }
    else await afterCreate(a.db, table, data, a.who);
    return NextResponse.json(data);
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await auth(table); if (a.err) return a.err;
    const body = await req.json();
    const key = table === "gm_organisations" ? "nom" : "id";
    if (!body[key]) return NextResponse.json({ error: `${key} requis` }, { status: 400 });
    const { data: old } = await a.db.from(table).select("*").eq(key, body[key]).single();
    if (!old) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    const patch: any = pick(body, a.cfg.cols); delete patch.nom;
    const le = await linkGroupe(a.db, table, patch); if (le) return NextResponse.json({ error: le }, { status: 400 });
    const { data, error } = await a.db.from(table).update(patch).eq(key, body[key]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await afterUpdate(a.db, table, old, data, a.who);
    return NextResponse.json(data);
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ table: string }> }) {
  try {
    const { table } = await ctx.params;
    const a = await auth(table); if (a.err) return a.err;
    const b = await req.json();
    const key = table === "gm_organisations" ? "nom" : "id";
    if (!b[key]) return NextResponse.json({ error: `${key} requis` }, { status: 400 });
    if (table === "gm_organisations") await a.db.from("gm_reputation_log").delete().eq("organisation", b.nom);
    else if (table !== "gm_reputation_log") for (const s of ["audit", "pacte", "pacte_violation", "pacte_rompu", "tribunal", "evenement"]) await clearRep(a.db, s, b.id);
    const { data: gone } = await a.db.from(table).select("*").eq(key, b[key]).maybeSingle();
    const { error } = await a.db.from(table).delete().eq(key, b[key]);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAudit(a.db, a.who, "Suppression", `${table}`, gone ? (gone.titre || gone.organisation || gone.nom || String(b[key])) : String(b[key]));
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: `Erreur serveur : ${e?.message || e}` }, { status: 500 }); }
}
