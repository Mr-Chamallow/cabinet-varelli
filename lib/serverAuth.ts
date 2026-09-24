import { getServerSession } from "next-auth";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { hasPermission } from "@/lib/auth";

let _supabaseAdmin: SupabaseClient | null = null;
let _configError: string | null = null;

function getSupabaseAdmin(): { client: SupabaseClient | null; error: string | null } {
  if (_supabaseAdmin || _configError) return { client: _supabaseAdmin, error: _configError };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    _configError = `Variable(s) d'environnement manquante(s) sur Vercel : ${!url ? "NEXT_PUBLIC_SUPABASE_URL " : ""}${!key ? "SUPABASE_SERVICE_ROLE_KEY" : ""}`.trim();
    return { client: null, error: _configError };
  }
  try {
    _supabaseAdmin = createClient(url, key);
    return { client: _supabaseAdmin, error: null };
  } catch (e: any) {
    _configError = `Échec de création du client Supabase admin : ${e?.message || e}`;
    return { client: null, error: _configError };
  }
}

export async function requirePermission(permission: string) {
  const { client, error: configError } = getSupabaseAdmin();
  if (configError || !client) {
    return { authorized: false, user: null, supabaseAdmin: null as any, error: configError || "Config Supabase admin manquante" };
  }

  try {

    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return { authorized: false, user: null, supabaseAdmin: client, error: "Session non trouvée (non connecté ou cookie invalide)" };

    const role = user.site_role;
    const permissions = user.permissions;
    const authorized = hasPermission({ id: user.discord_id, nom: user.discord_name, role, permissions } as any, permission);
    return { authorized, user, supabaseAdmin: client, error: authorized ? null : `Rôle "${role}" sans la permission "${permission}"` };
  } catch (e: any) {
    return { authorized: false, user: null, supabaseAdmin: client, error: `Erreur de session : ${e?.message || e}` };
  }
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const { client, error } = getSupabaseAdmin();
    if (!client) throw new Error(error || "Supabase admin non configuré");
    return (client as any)[prop];
  },
});

// Autorise si l'utilisateur a AU MOINS UNE des permissions données — utile quand
// plusieurs pages/rôles distincts (ex: Stocks et Armurerie) écrivent dans la même
// table et doivent donc pouvoir passer par la même route API.
export async function requireAnyPermission(permissions: string[]) {
  let last: Awaited<ReturnType<typeof requirePermission>> | null = null;
  for (const p of permissions) {
    const res = await requirePermission(p);
    if (res.authorized) return res;
    last = res;
  }
  return last!;
}
