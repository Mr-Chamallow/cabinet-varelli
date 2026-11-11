import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasPermission } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

type Ctx = { authorized: boolean; user: any; supabaseAdmin: typeof supabaseAdmin };

async function ctx(): Promise<Ctx> {
  const session = await getServerSession();
  const user = (session?.user as any) || null;
  if (!user) return { authorized: false, user: null, supabaseAdmin };
  const perms = user.permissions || [];
  const role = user.site_role;
  const u = { id: user.discord_id, nom: user.discord_name, role, permissions: perms };
  return { authorized: true, user: { ...user, _u: u }, supabaseAdmin };
}

function ok(c: Ctx, p: string) {
  return c.authorized && hasPermission(c.user._u, p);
}

// Une permission précise
export async function requirePermission(permission: string) {
  const c = await ctx();
  return { authorized: ok(c, permission), user: c.user, supabaseAdmin };
}

// Au moins une des permissions
export async function requireAnyPermission(permissions: string[]) {
  const c = await ctx();
  const authorized = permissions.some(p => ok(c, p));
  return { authorized, user: c.user, supabaseAdmin };
}

// Patron / admin uniquement
export async function requirePatron() {
  const c = await ctx();
  const isPatron = c.authorized && (c.user.site_role === "Associé / Patron" || c.user.site_role === "CEO - Directeur général");
  return { authorized: isPatron, user: c.user, supabaseAdmin };
}

export { supabaseAdmin, NextResponse };