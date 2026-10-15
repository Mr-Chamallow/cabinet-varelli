import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";

interface Check {
  label: string;
  ok: boolean;
  detail: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const perms: string[] = (session?.user as any)?.permissions || [];
  if (!session?.user || !perms.includes("admin")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const checks: Check[] = [];

  // --- Variables d'environnement ---
  const envVars: [string, boolean][] = [
    ["NEXT_PUBLIC_SUPABASE_URL", !!process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["SUPABASE_SERVICE_ROLE_KEY", !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["NEXTAUTH_SECRET", !!process.env.NEXTAUTH_SECRET],
    ["NEXTAUTH_URL", !!process.env.NEXTAUTH_URL],
    ["DISCORD_CLIENT_ID", !!process.env.DISCORD_CLIENT_ID],
    ["DISCORD_CLIENT_SECRET", !!process.env.DISCORD_CLIENT_SECRET],
    ["ADMIN_DISCORD_ID", !!process.env.ADMIN_DISCORD_ID],
  ];
  for (const [name, present] of envVars) {
    checks.push({ label: name, ok: present, detail: present ? "Définie" : "Manquante sur Vercel" });
  }

  // NEXTAUTH_URL doit correspondre au domaine réel, sinon Discord redirige mal après connexion
  const nextauthUrl = process.env.NEXTAUTH_URL || "";
  if (nextauthUrl) {
    const looksValid = /^https?:\/\/[^\s/]+$/.test(nextauthUrl);
    checks.push({
      label: "Format de NEXTAUTH_URL",
      ok: looksValid,
      detail: looksValid ? nextauthUrl : `"${nextauthUrl}" ne ressemble pas à une URL valide (pas de slash final attendu)`,
    });
  }

  // --- Connexion Supabase avec la clé de service (écritures) ---
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    try {
      const admin = createClient(url, serviceKey);
      const { error } = await admin.from("roles").select("id").limit(1);
      checks.push({
        label: "Connexion Supabase (clé de service)",
        ok: !error,
        detail: error ? error.message : "OK - lecture de la table 'roles' réussie",
      });
    } catch (e: any) {
      checks.push({ label: "Connexion Supabase (clé de service)", ok: false, detail: e?.message || String(e) });
    }
  } else {
    checks.push({ label: "Connexion Supabase (clé de service)", ok: false, detail: "Variables manquantes, test impossible" });
  }

  // --- Connexion Supabase avec la clé publique (lectures côté client) ---
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    try {
      const anon = createClient(url, anonKey);
      const { error } = await anon.from("app_settings").select("cle").limit(1);
      checks.push({
        label: "Connexion Supabase (clé publique)",
        ok: !error,
        detail: error ? error.message : "OK - lecture de la table 'app_settings' réussie",
      });
    } catch (e: any) {
      checks.push({ label: "Connexion Supabase (clé publique)", ok: false, detail: e?.message || String(e) });
    }
  } else {
    checks.push({ label: "Connexion Supabase (clé publique)", ok: false, detail: "Variables manquantes, test impossible" });
  }

  // --- Session Discord actuelle ---
  checks.push({
    label: "Session Discord",
    ok: !!session.user,
    detail: `Connecté en tant que ${(session.user as any)?.discord_name || "?"} (rôle: ${(session.user as any)?.site_role || "?"})`,
  });

  // --- Intégrité des données (stocks / compta) ---
  if (url && serviceKey) {
    try {
      const db = createClient(url, serviceKey);
      const all = async (table: string, cols: string) => {
        const rows: any[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await db.from(table).select(cols).range(from, from + 999);
          if (error) throw new Error(`${table} : ${error.message}`);
          rows.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        return rows;
      };
      const [stocks, mvts, compta] = await Promise.all([
        all("obsidian_stocks", "id,nom,quantite,prix_unitaire"),
        all("obsidian_mouvements", "id,stock_id,stock_nom,type,quantite,total,motif"),
        all("obsidian_comptabilite", "id,type,montant,semaine,source,source_id,type_argent"),
      ]);
      const list = (a: string[]) => (a.length > 6 ? a.slice(0, 6).join(", ") + ` ... (+${a.length - 6})` : a.join(", "));
      const add = (label: string, bad: string[], okTxt: string) =>
        checks.push({ label, ok: bad.length === 0, detail: bad.length ? `${bad.length} problème(s) : ${list(bad)}` : okTxt });

      add("Stocks négatifs", stocks.filter(x => Number(x.quantite) < 0).map(x => `${x.nom} (${x.quantite})`), `${stocks.length} stocks, aucun négatif`);
      add("Prix de stock invalides", stocks.filter(x => Number(x.prix_unitaire) < 0 || isNaN(Number(x.prix_unitaire))).map(x => x.nom), "Aucun prix négatif");

      const stockIds = new Set(stocks.map(x => x.id));
      add("Mouvements sans stock", mvts.filter(m => m.stock_id && !stockIds.has(m.stock_id)).map(m => `${m.stock_nom}`), `${mvts.length} mouvements rattachés à un stock`);

      const comptaStock = compta.filter(c => c.source === "stock");
      const comptaIds = new Map<string, number>();
      comptaStock.forEach(c => comptaIds.set(c.source_id, (comptaIds.get(c.source_id) || 0) + 1));
      const achats = mvts.filter(m => ["entrée", "entree"].includes(m.type) && Number(m.total) > 0 && !/^(annulation|ajustement)/i.test(m.motif || ""));
      add("Achats sans écriture compta", achats.filter(m => !comptaIds.has(m.id)).map(m => `${m.quantite} x ${m.stock_nom}`), `${achats.length} achats valorisés, tous comptabilisés`);
      const mvtIds = new Set(mvts.map(m => m.id));
      add("Écritures compta stock orphelines", comptaStock.filter(c => !mvtIds.has(c.source_id)).map(c => `${c.montant} $`), "Aucune orpheline");
      add("Doublons compta (même source)", [...comptaIds.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id.slice(0, 8)} x${n}`), "Aucun doublon");
      add("Écritures compta invalides", compta.filter(c => !(Number(c.montant) > 0) || !c.semaine).map(c => `${c.type} ${c.montant}`), `${compta.length} écritures valides (montant > 0, semaine renseignée)`);
    } catch (e: any) {
      checks.push({ label: "Intégrité des données", ok: false, detail: e?.message || String(e) });
    }
  }

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json({ checks, allOk, checkedAt: new Date().toISOString() });
}
