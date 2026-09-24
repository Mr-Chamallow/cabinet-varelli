import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { DISCORD_SERVER_ID, getHighestRole } from "@/lib/discord-config";
import { supabase } from "@/lib/supabase";

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || "";

async function fetchGuildRoles(accessToken: string): Promise<string[]> {
  const res = await fetch(
    `https://discord.com/api/users/@me/guilds/${DISCORD_SERVER_ID}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.roles || [];
}

async function getRoleOverride(discordId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("role_overrides")
    .select("role")
    .eq("discord_id", discordId)
    .maybeSingle();
  return data?.role || null;
}

async function getRolePermissions(roleName: string): Promise<string[] | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("roles")
    .select("permissions")
    .eq("nom", roleName)
    .maybeSingle();
  return data?.permissions ?? null;
}

// Trace chaque connexion (nom + rôle détecté + horodatage) dans site_logins, pour
// avoir une vraie liste des membres qui utilisent le site (Admin > Membres) — et
// pouvoir vérifier si quelqu'un qui dit "je n'arrive pas à accéder au site" s'est
// réellement connecté ou non. Ne doit jamais faire planter la connexion en cas d'échec.
async function recordLogin(discordId: string, discordName: string, role: string) {
  if (!supabase) return;
  try {
    const { data: existing } = await supabase
      .from("site_logins")
      .select("discord_id")
      .eq("discord_id", discordId)
      .maybeSingle();
    if (existing) {
      await supabase.from("site_logins").update({ discord_name: discordName, site_role: role, last_login: new Date().toISOString() }).eq("discord_id", discordId);
    } else {
      await supabase.from("site_logins").insert([{ discord_id: discordId, discord_name: discordName, site_role: role }]);
    }
  } catch {
    // La table n'existe peut-être pas encore (script SQL non exécuté) — ne bloque jamais la connexion pour ça.
  }
}

// Config NextAuth centralisée, exportée pour être réutilisable côté serveur
// (route handler ET lib/serverAuth.ts pour les routes API protégées).
export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds guilds.members.read" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        const roles = await fetchGuildRoles(account.access_token);
        token.discord_id = account.providerAccountId;
        token.discord_name = (profile as any)?.username || "Membre";
        token.site_role =
          account.providerAccountId === ADMIN_DISCORD_ID
            ? "Associé / Patron"
            : getHighestRole(roles);
      }
      if (token.discord_id) {
        const override = await getRoleOverride(token.discord_id as string);
        if (override) token.site_role = override;
      }
      if (token.site_role) {
        const perms = await getRolePermissions(token.site_role as string);
        token.permissions = perms;
      }
      if (account?.access_token && token.discord_id) {
        await recordLogin(token.discord_id as string, (token.discord_name as string) || "Membre", (token.site_role as string) || "");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).site_role = token.site_role;
        (session.user as any).discord_name = token.discord_name;
        (session.user as any).discord_id = token.discord_id;
        (session.user as any).permissions = token.permissions || null;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
