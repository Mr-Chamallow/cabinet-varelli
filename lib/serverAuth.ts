import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasPermission, estAdminUser } from "@/lib/auth";
import { authOptions } from "@/lib/authOptions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
);

async function session() {
  const s = await getServerSession(authOptions);
  const user = (s?.user as any) || null;
  if (!user) return { user: null, u: null };
  const u = { id: user.discord_id, nom: user.discord_name, role: user.site_role, permissions: user.permissions || [] };
  return { user, u };
}

export async function requirePermission(permission: string) {
  const { user, u } = await session();
  const authorized = !!u && hasPermission(u as any, permission);
  return { authorized, user, supabaseAdmin, error: authorized ? null : "Non autorisé" };
}

export async function requireAnyPermission(permissions: string[]) {
  const { user, u } = await session();
  const authorized = !!u && permissions.some(p => hasPermission(u as any, p));
  return { authorized, user, supabaseAdmin, error: authorized ? null : "Non autorisé" };
}

export async function requirePatron() {
  const { user } = await session();
  // Patron = permission admin en écriture (table roles), plus aucun nom de rôle en dur.
  const authorized = estAdminUser(user);
  return { authorized, user, supabaseAdmin, error: authorized ? null : "Non autorisé" };
}

export type Db = typeof supabaseAdmin;
export { supabaseAdmin, NextResponse };