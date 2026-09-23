import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { hasPermission } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requirePermission(permission: string) {
  // ⚠️ authOptions DOIT être passé ici, sinon getServerSession() ne peut pas
  // décoder le cookie de session dans un Route Handler App Router → toujours null.
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return { authorized: false, user: null, supabaseAdmin };

  const role = user.site_role;
  const permissions = user.permissions;
  const authorized = hasPermission({ id: user.discord_id, nom: user.discord_name, role, permissions } as any, permission);
  return { authorized, user, supabaseAdmin };
}

export { supabaseAdmin };
