import NextAuth from "next-auth";
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

const handler = NextAuth({
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
      // Un override manuel (via /admin) prime toujours sur le rôle Discord calculé
      if (token.discord_id) {
        const override = await getRoleOverride(token.discord_id as string);
        if (override) token.site_role = override;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).site_role = token.site_role;
        (session.user as any).discord_name = token.discord_name;
        (session.user as any).discord_id = token.discord_id;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
