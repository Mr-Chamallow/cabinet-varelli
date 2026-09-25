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
        detail: error ? error.message : "OK — lecture de la table 'roles' réussie",
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
        detail: error ? error.message : "OK — lecture de la table 'app_settings' réussie",
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

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json({ checks, allOk, checkedAt: new Date().toISOString() });
}
